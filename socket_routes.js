var chat_messages = [];
var media_queue = [];
var connected_users = {};
var admin_users = [];
var max_user_timeout = 600000;
var previous_video = '';
var shortid = require('shortid');
var sanitizer = require('sanitizer');
var can_resume = true;

module.exports = function(io,adminpass,run_id) {
	function userUnlock(data){
		console.log('userUnlock');
		this.emit('user',{action: data===adminpass ? 'admin' : 'noadmin'});
		last_seen(this.userId);
	};
	function chat(data){
		var message = {authorId: this.userId, message: sanitizer.sanitize(data.message)};
		io.sockets.emit('chat',message);
		chat_messages.push(message);
		if (chat_messages.lenth > 100) chat_messages=chat_messages.slice(-100);
		last_seen(this.userId);
	}
	function user(data){
		last_seen(this.userId);
	}
	function register(data){
		eventName = this.userId ? 'rename' : 'connected';
		if (!data.userId) data.userId = shortid.generate();
		connected_users[data.userId]=data; 
		this.userId=data.userId;
		data.userName=sanitizer.sanitize(data.userName);
		last_seen(this.userId);
		io.sockets.emit('user',{action:'add',user:{userId:data.userId,userName:data.userName,disconnected: false}});
		this.emit('user',{action:eventName,userId:data.userId,userName:data.userName,disconnected: false});
	}
	function disconnectUser(data) {
		//delete connected_users[this.userId];
		if (!data) return;
		var userId = data.userId ? data.userId : data;
		if (!connected_users || !connected_users[userId]) return;
		connected_users[userId].disconnected=true;
		io.sockets.emit('user',{action:'remove',userId: userId}); 
	}
	function disconnectMe() {
		disconnectUser(this.userId);
	}
	function getInit() {
		this.emit('datainit',{members: connected_users, media: media_queue, messages: chat_messages.slice(-30)});
	}
	function addMedia(data) {
		data.seek=0;
		for (var i = 0; i < media_queue.length; i++) {
			if (media_queue[i].videoId===data.videoId) return;
		}
		media_queue.push(data);
		io.sockets.emit('addMedia',data);
		last_seen(this.userId);
	}
	function videoNext(data) {
		if (previous_video==data.previous) return;
		previous_video=data.previous;
		media_queue = media_queue.slice(1);
		io.sockets.emit('videoNext',media_queue[0]);
		last_seen(this.userId);
	}
	function vote(data) {
		if (!media_queue[0].votes) {
			media_queue[0].votes = {'up':[],'down':[]};
		}
		var other = data == 'up' ? 'down' : 'up';
		if (media_queue[0].votes[other].indexOf(this.userId)) {
			media_queue[0].votes[other].splice(media_queue[0].votes[other].indexOf(this.userId),1);
		}
		if (media_queue[0].votes[data].indexOf(this.userId)>=0) return;
		media_queue[0].votes[data].push(this.userId);
		if (media_queue[0].votes.down.length - media_queue[0].votes.up.length >= 2) videoNext({previous: media_queue[0].videoId});
		last_seen(this.userId);
	}
	function resume(data) {
		this.emit('restart');
		if (!can_resume) {
			return;
		}
		can_resume=false;
		media_queue=data.media_queue;
		connected_users=data.users;
		for (u in connected_users) {
			connected_users[u].disconnected=true;
		}
		chat_messages = data.chat_messages;
		this.emit('restart');
	}
	
	function last_seen(id) {
		if (connected_users[id]) {
			connected_users[id].last_seen = (new Date()).getTime();
		}
	}
	
	io.sockets.on('connect',function(socket) {
		socket.emit("connected",{run_id: run_id});
		socket.on('register',register);
		socket.on('userUnlock',userUnlock);
		socket.on('chat',chat);
		socket.on('user',user);
		socket.on('addMedia',addMedia);
		socket.on('disconnect',disconnectUser);
		socket.on('getInit',getInit);
		socket.on('videoNext',videoNext);
		socket.on('vote',vote);
		socket.on('resume',resume);
		socket.on('disconnect',disconnectMe);
	});
	
	
	setInterval(function(){
		var now = (new Date()).getTime();
		for (id in connected_users) {
			if (connected_users[id] && connected_users[id].last_seen && connected_users[id].last_seen + max_user_timeout < now) {
				if (!connected_users[id].disconnected) 
					disconnectUser(id);
			}
		}
	},100);
	setInterval(function(){
		if (media_queue && media_queue.length>0) {
			media_queue[0].seek++;
		}
	},1000);
};

