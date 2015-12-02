var chat_messages = [];
var media_queue = [];
var connected_users = {};
var admin_users = [];
var max_user_timeout = 5000;
var previous_video = '';
var shortid = require('shortid');
var sanitizer = require('sanitizer');
var can_resume = true;
var all_sockets = {};
var banned = {};

module.exports = function(io,adminpass,run_id) {
	function userUnlock(data){
		admin_users.push(this.userId);
		this.emit('user',{action: data===adminpass ? 'admin' : 'noadmin'});
		last_seen(this.userId);
		adminRefresh(this.userId);
	};
	function chat(data){
		var message = {authorId: this.userId, message: sanitizer.sanitize(data.message)};
		message.ts = (new Date()).getTime();
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
		if (banned[data.userId]) {
			this.emit('banned');
			this.conn.close();
			disconnectUser({userId:data.userId});
		}
		for (uid in connected_users) {
			if (!connected_users[uid].disconnected && connected_users[uid].userName.trim().toLowerCase()==data.userName.trim().toLowerCase()) {
				this.emit('user',{action:'duplicate'});
				return;
			}
		}
		connected_users[data.userId]=data; 
		this.userId=data.userId;
		all_sockets[this.userId]=this;
		data.userName=sanitizer.sanitize(data.userName);
		last_seen(this.userId);
		io.sockets.emit('user',{action:'add',user:{userId:data.userId,userName:data.userName,disconnected: false}});
		this.emit('user',{action:eventName,userId:data.userId,userName:data.userName,disconnected: false});
		adminRefresh();
	}
	function disconnectUser(data) {
		//delete connected_users[this.userId];
		if (!data) return;
		var userId = data.userId ? data.userId : data;
		if (!connected_users || !connected_users[userId]) return;
		connected_users[userId].disconnected=true;
		io.sockets.emit('user',{action:'remove',userId: userId}); 
		adminRefresh();
	}
	function disconnectMe() {
		disconnectUser({userId: this.userId});
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
	function deleteMedia(data) {
		for (var i = 1; i < media_queue.length; i++) {
			if (media_queue[i].videoId==data.videoId) {
				media_queue.splice(i,1);
				io.emit('mediaRefresh',{media_queue:media_queue});
				return;
			}
		}
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
		if ((media_queue[0].votes.down.length - media_queue[0].votes.up.length) >= 2) videoNext({previous: media_queue[0].videoId});
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
	function admin(data) {
		if (admin_users.indexOf(this.userId)<0) {
			socket.emit('noadmin');
			socket.conn.close();
			return;
		}
		switch (data.command) {
			case 'clear':
				media_queue=[];
			case 'skip':
				videoNext({});
				break;
			case 'ban':
				banned[data.userId]=connected_users[data.userId].userName;
			case 'boot':
				all_sockets[data.userId].emit('kicked',{});
				all_sockets[data.userId].conn.close();
				delete all_sockets[data.userId];
				disconnectUser({userId: data.userId});
				break;
			case 'shuffle':
				for (var i = 0; i < media_queue.length; i++) {
					media_queue[i].sortvalue = (i===0?0:Math.random());
				}
				media_queue.sort(function(a,b){return a.sortvalue-b.sortvalue});
				io.emit('mediaRefresh',{media_queue:media_queue});
				break;
			case 'adminify':
				admin_users.push(data.userId);
				all_sockets[data.userId].emit('user',{action:'admin'});
				break;
			case 'disadminify':
				for (var i = 0; i < admin_users.length; i++) {
					if (admin_users[i]==data.userId) {
						admin_users.splice(i,1);
						break;
					}
				}
				all_sockets[data.userId].emit('user',{action:'deadmin'});
				break;
			case 'rename':
				connected_users[data.userId].userName=data.userName;
				all_sockets[data.userId].emit('user',{action:'rename',userId:data.userId,userName:data.userName,disconnected: false});
				io.emit('user',{action: 'add',user:connected_users[data.userId]});
				break;
		}
		adminRefresh();
	}
	
	function adminRefresh(except) {
		for (var i = 0; i < admin_users.length; i++) {
			if (admin_users[i] === except) continue;
			all_sockets[admin_users[i]].emit('adminrefresh',{admins: admin_users});
		}
	}
	
	function last_seen(id) {
		if (connected_users[id]) {
			connected_users[id].last_seen = (new Date()).getTime();
		}
	}
	function pong() {
		last_seen(this.userId);
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
		socket.on('delete',deleteMedia);
		socket.on('vote',vote);
		socket.on('resume',resume);
		socket.on('disconnect',disconnectMe);
		socket.on('admin',admin);
		socket.on('pong',pong);
		socket.on('ping',function(){this.emit('pong');});
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
	setInterval(function(){
		io.emit('ping');
	},100);
};

