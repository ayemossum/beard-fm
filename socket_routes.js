var chat_messages = [];
var media_queue = [];
var connected_users = {};
var admin_users = [];
var max_user_timeout = 600000;
var previous_video = '';
var shortid = require('shortid');

module.exports = function(io,adminpass) {
	function userUnlock(data){
		console.log('userUnlock');
		this.emit('user',{action: data===adminpass ? 'admin' : 'noadmin'});
		last_seen(this.userId);
	};
	function chat(data){
		io.sockets.emit('chat',{authorId: this.userId, message: data});
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
		last_seen(this.userId);
		io.sockets.emit('user',{action:'add',user:{userId:data.userId,userName:data.userName}});
		this.emit('user',{action:eventName,userId:data.userId,userName:data.userName});
	}
	function disconnectUser(data) {
		delete connected_users[this.userId];
		io.sockets.emit('user',{action:'remove',id:this.userId});
	}
	function getInit() {
		var members = [];
		for (i in connected_users) {members.push(connected_users[i])};
		this.emit('datainit',{members: members, media: media_queue});
	}
	function addMedia(data) {
		data.seek=0;
		for (var i = 0; i < media_queue.length; i++) {
			if (media_queue[i].videoId===data.videoId) return;
		}
		media_queue.push(data);
		io.sockets.emit('addMedia',data);
	}
	function videoNext(data) {
		if (previous_video==data.previous) return;
		previous_video=data.previous;
		media_queue = media_queue.slice(1);
		io.sockets.emit('videoNext',media_queue[0]);
	}
	
	function last_seen(id) {
		if (connected_users[id]) {
			connected_users[id].last_seen = (new Date()).getTime();
		}
	}
	
	io.sockets.on('connect',function(socket) {
		socket.emit("connected");
		socket.on('register',register);
		socket.on('userUnlock',userUnlock);
		socket.on('chat',chat);
		socket.on('user',user);
		socket.on('addMedia',addMedia);
		socket.on('disconnect',disconnectUser);
		socket.on('getInit',getInit);
		socket.on('videoNext',videoNext);
	});
	
	
	setInterval(function(){
		var now = (new Date()).getTime();
		for (id in connected_users) {
			if (connected_users[id] && connected_users[id].last_seen && connected_users[id].last_seen + max_user_timeout < now) {
				disconnectUser(id);
			}
		}
	},2000);
	setInterval(function(){
		if (media_queue && media_queue.length>0) {
			media_queue[0].seek++;
		}
	},1000);
};

