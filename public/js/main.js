var player;
var google_loaded=false;
function gapiLoaded(){google_loaded=true;}
(function($) {
	var socket = io();
	window.__socket = socket;
	var chat_box_entry;
	var seek_advance;
	var appState = {
		users: {},
		userName: null,
		admin: false,
		connected: false,
		userId: null,
		playerReady: false,
		apiKey: 'AIzaSyDeGY1MfcSN53qzzM-xkD43Oun9GekWFTc',
		media_queue: []
	};
	window.__appState=appState;
	function playerReady(e) {
		appState.playerReady=true;
		console.info('PLAYER IS LOADED?');
		if (appState.connected) {
			playerStartup();
		}
	}
	function playerStateChange(e) {
		console.log('state changed to %s',e.data);
		if (e.data===YT.PlayerState.ENDED) {
			console.log('get me another');
			socket.emit('videoNext',{previous: player.getVideoData().video_id});
		}
	}
	function playerStartup() {
		if (appState.media_queue.length>0) playVideo(appState.media_queue[0].videoId, appState.media_queue[0].seek);
		clearInterval(seek_advance);
	}
	function becomeAdmin() {
		console.log("%s is now admin",appState.userName);
		appState.admin=true;
	}
	function playVideo(videoId,time) {
		player.cueVideoById(videoId)
		if (time) {
			player.seekTo(time);
		}
		player.playVideo();
	}
	function addUser(user) {
		appState.users[user.userId]=user;
		$('.chat-members').html(chatmembers({userId: appState.userId, users:appState.users}));
	}
	if (localStorage) {
		appState.userName = localStorage.getItem('userName');
		if (appState.userName) appState.userId = localStorage.getItem('userId');
		$('.register-box .user-name').val(appState.userName);
	}
	chat_box_entry = $('.js-chat-box-entry');

	socket.on('chat',function(value) {
		value = typeof value === 'string' ? JSON.parse(value) : value;
		if (value instanceof Array) $('.chat-messages').html(chatmessages(value));
		else $('.chat-messages').append(chatmessage(value));
	});
	socket.on('user',function(value){
		value = typeof value === 'string' ? JSON.parse(value) : value;
		switch (value.action){
			case 'connected':
				appState.connected=true;
				appState.userName=value.userName;
				appState.userId=value.userId;
				if (localStorage) {
					localStorage.setItem('userName',appState.userName);
					localStorage.setItem('userId',appState.userId);
				}
				if (appState.playerReady) {
					playerStartup();
				}
				$(".register-window").addClass('close');
				$(".add-media").addClass('show');
				break;
			case 'rename':
				appState.userName=value.userName;
				$(".register-window").addClass('close');
				$(".add-media").addClass('show');
				break;
			case 'add':
				addUser(value.user);
				break;
			case 'remove':
				removeUser(value.userId);
				break;
			case 'admin':
				becomeAdmin();
				break;
			case 'noadmin':
				appState.admin=false;
				alert('BAD user. BAD. Go sit in the corner');
				break;
		}
	});
	socket.on('media',function(value) {
		var media_data = typeof value === 'string' ? JSON.parse(value) : value;
		$('.media-list').html(medialist(media_data));
		if (media_data.length>0) {
			player.playVideo(media_data[0].videoId,media_data[0].time);
			if (media_data[0].mine) $('.media-box .controls').addClass('mine');
			else $('.media-box .controls').removeClass('mine');
		}
	});
	socket.on('chat',function(value) {
		value.author = appState.users[value.authorId];
		$('.chat-messages').append(chatmessage(value));
	});
	socket.on('addMedia',function(value) {
		appState.media_queue.push(value);
		$('.media-list').html(medialist({userId: appState.userId, media: appState.media_queue}));
		if (player.getPlayerState() !== YT.PlayerState.PLAYING) playVideo(appState.media_queue[0].videoId);
	});
	socket.on('videoNext',function(value) {
		console.log('videoNext',value);
		var played = false;
		if (value && value.videoId) {
			$.each(appState.media_queue,function(i,v){
				if (i==0) return true;
				if (v.videoId==value.videoId) {
					appState.media_queue = appState.media_queue.slice(i);
					playVideo(appState.media_queue[0].videoId,appState.media_queue[0].seek);
					$('.media-list').html(medialist({userId: appState.userId, media: appState.media_queue}));
					played=true;
					return false;
				}
			});
		}
		if (!played) {
			player.stopVideo();
			player.clearVideo();
			appState.media_queue=[];
		}
	});
	socket.on('datainit',function(values){
		console.log(values);
		appState.users=values.members;
		console.log(appState.users);
		$('.chat-members').html(chatmembers({userId: appState.userId, users:appState.users}));
		appState.media_queue = values.media;
		$('.media-list').html(medialist({userId: appState.userId, media: appState.media_queue}));
	});
	socket.emit('getInit');
	chat_box_entry.on('keypress',(e) => {
		if (e.which==13) {
			socket.emit('chat',{message: 'chat:'+chat_box_entry.val()});
			chat_box_entry.val('');
		}
	});
	$('.unlock').on('click',function(e){
			socket.emit('userUnlock',prompt('Password please'));
	});
	$('.add-media').on('click',function(e) {
		if ($('.media-adder').hasClass('open')) return;
		$('.media-adder').html(addmedia()).removeClass('close').addClass('open').find('.media-search').focus();;
	});
	$('.main-content').on('click','.media-adder .close-button',function(e) {
		$('.media-adder').removeClass('open').addClass('close');
	});
	$('.main-content').on('click','.user-name-button',function(e) {
		socket.emit('register',{userName: $('.user-name').val(),userId: appState.userId});
	});
	$('.main-content').on('keypress','.user-name',function(e){
		if (e.which==13) $('.user-name-button').click();
	});
	$('.main-content').on('keypress','.media-adder .media-search',function(e) {
		if (e.which==13) $('.media-adder .media-search-button').click();
	});
	$('.main-content').on('click','.media-adder .media-search-button',function(e){
		var search_value = {part: 'snippet',safeSearch: 'moderate',type:'video',q: $('.media-adder .media-search').val()}
		var request = gapi.client.youtube.search.list(search_value);
		request.execute(function(data) {
			search_value.pageToken=data.nextPageToken;
			request = gapi.client.youtube.search.list(search_value);
			request.execute(function(data2){
				data.items.concat(data2.items);
				$('.media-adder .resultsbox').html(searchresults(data));
			});
		})
	});
	$('.main-content').on('click','.media-adder .search-results .video-result',function(e) {
		video_data = $(this).data();
		video_data.userId=appState.userId;
		console.log(video_data);
		socket.emit('addMedia',video_data);
	});
	window.onYouTubeIframeAPIReady=function(){
		
		console.info("YOUTUBE API READY");
		player = new YT.Player('player', {
			events: {
				onStateChange: playerStateChange,
				onReady: playerReady
			}	
		});
	};
	seek_advance = setInterval(function(){
		if (appState.media_queue && appState.media_queue.length>0) {
			appState.media_queue[0].seek++;
		}
	},1000);
	$.getScript('https://apis.google.com/js/client.js?onload=gapiLoaded',function(){
		var proceed = function(){
			if (!google_loaded) {
				setTimeout(proceed,1);
				return;
			}
			gapi.client.setApiKey(appState.apiKey);
			gapi.client.load('youtube', 'v3', function() {});
		};
		setTimeout(proceed,1);
	});
	$.getScript('https://www.youtube.com/iframe_api',function(){});
})(jQuery);