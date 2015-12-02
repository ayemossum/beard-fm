var player;
var google_loaded=false;
function gapiLoaded(){google_loaded=true;}
(function($) {
	var socket = io();
	window.__socket = socket;
	var chat_box_entry;
	var seek_advance;
	var unmute_volume;
	var appState = {
		users: {},
		userName: null,
		admin: false,
		connected: false,
		userId: null,
		playerReady: false,
		apiKey: 'AIzaSyDeGY1MfcSN53qzzM-xkD43Oun9GekWFTc',
		media_queue: [],
		notifications_allowed: false,
		run_id: null,
		chat_messages: [],
		has_played: true
	};
	if ("Notification" in window) {
		if (Notification.permission === 'granted') appState.notifications_allowed=true;
		else if (Notification.permission !== 'denied') {
			Notification.requestPermission(function(result){ if (result === 'denied' || result === 'defualt') return; appState.notifications_allowed=true;});
		}
	}
	window.__appState=appState;
	function notify (msgtype, msg) {
		if (!appState.notifications_allowed || !msgtype || (document.hasFocus && document.hasFocus())) return;
		var notification = new Notification(msgtype,{body:msg});
		notification.onclick=function(){
			notification.close();
		}
		setTimeout(function(){notification.close()},5000);
		
	}
	function findUrls( text )
	{
		var source = (text || '').toString();
		var urlArray = [];
		var url;
		var matchArray;

		// Regular expression to find FTP, HTTP(S) and email URLs.
		var regexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;

		// Iterate through any URLs in the text.
		while( (matchArray = regexToken.exec( source )) !== null )
		{
			var token = matchArray[0];
			urlArray.push( token );
		}

		return urlArray;
	}
	
	function urlify(text) {
		var urls = findUrls(text);
		if (urls.length==0) return text;
		$.each(urls, function(i,url){
			var bits = url.split('.');
			switch(bits[bits.length-1]) {
				case 'jpg':
				case 'jpeg':
				case 'gif':
				case 'png':
					text=text.replace(url,'<img src="'+url+'">');
					break;
				default:
					text=text.replace(url,'<a href="'+url+'">'+url+'</a>');
					break;
			}
		});
		return text;
	}
	function playerReady(e) {
		appState.playerReady=true;
		console.info('PLAYER IS LOADED?');
		if (appState.connected) {
			playerStartup();
		}
	}
	function playerStateChange(e) {
		if (e.data===YT.PlayerState.ENDED) {
			socket.emit('videoNext',{previous: player.getVideoData().video_id});
		}
		if (!appState.has_played && e.data===YT.PlayerState.PLAYING) {
			$('.media-box .controls').css('display',null);
		}
	}
	function playerStartup() {
		$('.controls .volume input').val(player.getVolume());
		unmute_volume = $('.controls .volume input').val() > 0 ? $('.controls .volume input').val() : 90;
		if (appState.media_queue.length>0) playVideo(appState.media_queue[0].videoId, appState.media_queue[0].seek);
	}
	function becomeAdmin() {
		console.log("%s is now admin",appState.userName);
		appState.admin=true;
		$('header').append(admincontrols({userId: appState.userId, users: $.extend({},appState.users)}));
		$('.media-list').html(medialist({userIsAdmin: appState.admin, userId: appState.userId, media: appState.media_queue}));
	}
	function leaveAdmin() {
		appState.admin=false;
		$('.admin-controls').addClass('close').on('animationend webkitAnimationEnd MSAnimationEnd',function(e){$(this).remove()});
	}
	function playVideo(videoId,time) {
		player.cueVideoById(videoId)
		if (time) {
			player.seekTo(time);
		}
		if (appState.has_played) player.playVideo();
		
		if (appState.media_queue[0].userId == appState.userId) $('.media-box .controls').addClass('mine');
		else $('.media-box .controls').removeClass('mine');
		notify('Playing Video',appState.media_queue[0].title);
	}
	function addUser(user) {
		if (appState.users[user.userId] && appState.users[user.userId].userName != user.userName) notify('User Renamed',appState.users[user.userId].userName + ' is now known as ' + user.userName);
		else notify('User Connected',user.userName);
		appState.users[user.userId]=user;
		$('.chat-members').html(chatmembers({userId: appState.userId, users:appState.users}));
		$('.chat-window .chat-message[data-user-id='+user.userId+']').removeClass('disconnected').find('.author').text(user.userName);
	}
	function removeUser(userId) {
		notify('User Disonnected',appState.users[userId].userName);
		appState.users[userId].disconnected=true;
		$('.chat-message[data-user-id='+userId+']').addClass('disconnected');
		$('.chat-members').html(chatmembers({userId: appState.userId, users:appState.users}));
		if (appState.userId==userId) socket.emit('register',{userId:userId,userName:appState.userName});
	}
	chat_box_entry = $('.chat-window .chat-input');

	socket.on('chat',function(value) {
		if (value instanceof Array) {
			$.each(value, function(i,single) {
				single.users=appState.users;
				single.userId=appState.userId;
				single.message=urlify(single.message);
				$('.chat-messages .chat-table').append(chatmessage(single));
				appState.chat_messages.push(single);
			});
			$('.chat-messages').prop('scrollTop',$('.chat-messages .chat-table').height());
		} 
		else {
			value.message=urlify(value.message)
			value.userId=appState.userId;
			value.users=appState.users;	
			$('.chat-messages .chat-table').append(chatmessage(value));
			$('.chat-messages').prop('scrollTop',$('.chat-messages .chat-table').height());
			appState.chat_messages.push(value);
			notify(appState.users[value.authorId].userName, value.message.length > 20 ? value.message.substr(0,20)+'...' : value.message);
		}
	});
	socket.on('user',function(value){
		value = typeof value === 'string' ? JSON.parse(value) : value;
		switch (value.action){
			case 'connected':
				console.log('connected');
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
				$(".register-window").addClass('close').removeClass('open');
				$(".chat-member[data-user-id="+appState.userId+"]").addClass('current-user');
				$(".add-media").addClass('show');
				break;
			case 'rename':
				appState.userName=value.userName;
				if (localStorage) {
					localStorage.setItem('userName',appState.userName);
				}
				$(".register-window").addClass('close').removeClass('open');
				$(".add-media").addClass('show');
				$('.chat-window .chat-message[data-user-id='+value.userId+'] .author').text(value.userName);
				$('.chat-message[data-user-id='+value.userId+']').removeClass('disconnected');
				break;
			case 'add':
				addUser(value.user);
				$('.chat-window .chat-message[data-user-id='+value.user.userId+'] .author').text(value.user.userName);
				break;
			case 'remove':
				removeUser(value.userId);
				break;
			case 'duplicate':
				alert('Duplicate user name. Please try again.');
				break;
			case 'admin':
				becomeAdmin();
				break;
			case 'noadmin':
				alert('BAD user. BAD. Go sit in the corner');
			case 'deadmin':
				$('header .admin-controls').remove();
				appState.admin=false;
				break;
		}
	});
	socket.on('media',function(value) {
		var media_data = typeof value === 'string' ? JSON.parse(value) : value;
		media_data.userIsAdmin = appState.admin;
		$('.media-list').html(medialist(media_data));
		if (media_data.length>0) {
			playVideo(media_data[0].videoId,media_data[0].time);
			if (media_data[0].mine) $('.media-box .controls').addClass('mine');
			else $('.media-box .controls').removeClass('mine');
		}
	});
	socket.on('addMedia',function(value) {
		appState.media_queue.push(value);
		$('.media-list').html(medialist({userIsAdmin: appState.admin, userId: appState.userId, media: appState.media_queue}));
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
					$('.media-list').html(medialist({userIsAdmin: appState.admin, userId: appState.userId, media: appState.media_queue}));
					played=true;
					return false;
				}
			});
		}
		if (!played) {
			notify('Video Queue','Queue is empty. Refill it.')
			player.stopVideo();
			player.clearVideo();
			appState.media_queue=[];
		}
		$('.voted').removeClass('voted');
	});
	socket.on('mediaRefresh',function(value) {
		appState.media_queue=value.media_queue;
		$('.media-list').html(medialist({userIsAdmin: appState.admin, userId: appState.userId, media: appState.media_queue}));
	});
	socket.on('connected',function(data){
		if (appState.run_id && appState.run_id != data.run_id) socket.emit('resume',appState)
		else appState.run_id=data.run_id;
	});
	socket.on('banned',function(data){
		socket.close();
		alert('You have been exiled. Have a "nice" day.');
	});
	socket.on('kicked',function(data) {
		player.stopVideo();
		$('.media-list').html('');
		$('.chat-messages').html('');
		$('.chat-members').html('');
		socket.close();
		alert('You have been ejected');
	});
	socket.on('restart',function(){
		location=location.href;
	});
	socket.on('adminrefresh',function(data){
		appState.admin=true;
		var curcontrols = $('.admin-controls');
		var users = $.extend({},appState.users);
		console.log(data);
		for (var i = 0; i < data.admins.length; i++) {
			console.log(data.admins[i]);
			console.log(users[data.admins[i]]);
			users[data.admins[i]].admin=true;
		}
		newcontrols = admincontrols({userId: appState.userId, users: users, replace: curcontrols.length > 0});
		curcontrols.length > 0  
			? $('.admin-controls').replaceWith(newcontrols) 
			: $('header').append(newcontrols);
	});
	socket.on('datainit',function(values){
		appState.users=values.members;
		$('.chat-members').html(chatmembers({userId: appState.userId, users:appState.users}));
		appState.media_queue = values.media;
		$('.media-list').html(medialist({userId: appState.userId, media: appState.media_queue}));
		appState.chat_messages = values.messages;
		$.each(values.messages, function(i,message) {message.users = appState.users; message.message = urlify(message.message); $('.chat-messages .chat-table').append(chatmessage(message)); $('.chat-messages').prop('scrollTop',$('.chat-messages .chat-table').height());});
	});
	socket.on('ping',function(){
		socket.emit('pong');
	});
	chat_box_entry.on('keypress',(e) => {
		if (e.which==13) {
			$('.chat-window .chat-send').click();
		}
	});
	$('.chat-window').on('click','.chat-send',function() {
			socket.emit('chat',{message: chat_box_entry.val()});
			chat_box_entry.val('');
	});
	$('.unlock').on('click',function(e){
		var pw = prompt('Password please');
		if (pw !== null)
			socket.emit('userUnlock',pw);
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
				data.items = data.items.concat(data2.items);
				$('.media-adder .resultsbox').html(searchresults(data));
			});
		})
	});
	$('.main-content').on('click','.media-adder .search-results .video-result',function(e) {
		$(this).remove();
		video_data = $(this).data();
		video_data.userId=appState.userId;
		socket.emit('addMedia',video_data);
	});
	$('.chat-members').on('dblclick','.chat-member.current-user',function(){
		$('.register-window').addClass('open').removeClass('close');
		$(".add-media").remove('show');
	});
	$('.media-box .vote-up').on('click',function(){
		$('.media-box .vote-down').removeClass('voted');
		$(this).addClass('voted');
		socket.emit('vote','up');
	});
	$('.media-box .vote-down').on('click',function(){
		$('.media-box .vote-up').removeClass('voted');
		$(this).addClass('voted');
		socket.emit('vote','down');
	});
	$('.media-box .volume input').on('input',function(e){
		player.setVolume(this.value);
	});
	$('.media-box .volume input').on('change',function(e){
		if (this.value==0) {
			$('.volume .muting').removeClass('fa-volume-up').addClass('fa-volume-off');
		}
		else {
			$('.volume .muting').addClass('fa-volume-up').removeClass('fa-volume-off');
			unmute_volume = this.value;
		}
	});
	$('.media-box .volume .muting').on('click',function(e){
		$('.volume .muting').toggleClass('fa-volume-up fa-volume-off');
		if ($('.volume .muting').hasClass('fa-volume-up')) {
			$('.media-box .volume input').val(unmute_volume);
			player.setVolume(unmute_volume);
		}
		else {
			unmute_volume = $('.media-box .volume input').val();
			$('.media-box .volume input').val(0);
			player.setVolume(0);
		}
		
	});
	$('.media-window').on('click','.media-item .delete',function(e){
		var mediaItem = $(this).closest('.media-item');
		socket.emit('delete',{videoId: mediaItem.data('videoId')});
	})
	$('header').on('click','.admin-controls .js-admin-next', function(e) {
		if (appState.admin) socket.emit('admin',{command:"skip"});
	});
	$('header').on('click','.admin-controls .js-admin-stop', function(e) {
		if (appState.admin && confirm('Stop player and clear all media?')) socket.emit('admin',{command:"clear"});
	});
	$('header').on('click','.admin-controls .js-admin-shuffle',function(e) {
		if (appState.admin && confirm('Shuffle?')) socket.emit('admin',{command:'shuffle'});
	});
	$('header').on('click','.admin-controls .js-admin-users', function(e) {
		if (appState.admin) {
			var ulist = $('.admin-users-list');
			$(".admin-users-list").toggleClass('open close');
			if (ulist.hasClass('open')) ulist.css({display:"block"});
			else {
				ulist.on('animationend webkitAnimationEnd MSAnimationEnd',function(){ulist.hide();ulist.off('animationend webkitAnimationEnd MSAnimationEnd');});
			}
		}
	});
	$('header').on('click','.admin-controls .js-boot', function(e) {
		var kickee = $(this).closest('.user').data('userId');
		if (appState.admin && confirm('This will eject '+appState.users[kickee].userName)) {
			socket.emit('admin',{command:'boot',userId: kickee});
		}
	});
	$('header').on('click','.admin-controls .js-ban', function(e) {
		var kickee = $(this).closest('.user').data('userId');
		if (appState.admin && confirm('This will eject and exile '+appState.users[kickee].userName)) {
			socket.emit('admin',{command:'ban',userId: kickee});
		}
	});
	$('header').on('click','.admin-controls .js-adminify', function(e) {
		var targetUserId = $(this).closest('.user').data('userId');
		if (appState.admin && confirm('Grant admin rights to '+appState.users[targetUserId].userName+'?')) {
			socket.emit('admin',{command:'adminify',userId: targetUserId});
		}
	});
	$('header').on('click','.admin-controls .js-disadminify', function(e) {
		var targetUserId = $(this).closest('.user').data('userId');
		if (appState.admin && confirm('Remove admin rights from '+appState.users[targetUserId].userName+'?')) {
			socket.emit('admin',{command:'disadminify',userId: targetUserId});
		}
	});
	$('header').on('click','.admin-controls .js-rename', function(e) {
		var renamee = $(this).closest('.user').data('userId');
		if (appState.admin){
			var newname = prompt('Enter new name for '+appState.users[renamee].userName);
			if (confirm('This will rename '+appState.users[renamee].userName+' to '+newname)) {
				socket.emit('admin',{command:'rename',userId: renamee,userName: newname});
			}
		}
	});
	$('body').on('click',function(e){
		if (!$(e.target).is('.js-admin-users') && $(e.target).closest('.js-admin-users').length==0 && $(e.target).closest('.admin-users-list').length==0 && $('.admin-users-list').hasClass('open')) {
			$('.admin-users-list').removeClass('open').addClass('close');
		}
	});
	window.onYouTubeIframeAPIReady=function(){
		
		console.info("YOUTUBE API READY");
		player = new YT.Player('player', {
			events: {
				onStateChange: playerStateChange,
				onReady: playerReady
			},
			playerVars: {
				rel: 0,
				enablejsapi: true,
				controls: 0,
				showinfo: 0,
				modestbranding: 1
			}
		});
		if (/(Android|i(Pad|Pod|Phone))/.test(navigator.userAgent)) {
			$('.media-box .controls').css('display','none');
			appState.has_played=false;
		}
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
	
	if (localStorage) {
		appState.userName = localStorage.getItem('userName');
		$('.register-box .user-name').val(appState.userName);
		if (appState.userName) {
			appState.userId = localStorage.getItem('userId');
			$('.user-name-button').click();
		}
	}
	socket.emit('getInit');
	setInterval(function(){
		$.get('/ping',function(response){});
	},600000);
})(jQuery);