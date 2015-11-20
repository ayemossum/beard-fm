var chat_messages = [];
var media_queue = [];
var connected_users = {};
var admin_users = [];
var max_user_timeout = 600000;
var shortid = require('shortid');
function userUnlock(data){
	console.log('userUnlock');
	console.log(data);
	this.emit('user','admin');
	last_seen(this.userId);
};
function chat(data){
	last_seen(this.userId);
}
function user(data){
	last_seen(this.userId);
}
function register(data){
	if (!data.id) data.id = shortid.generate();
	connected_users[id]=data.name;
	socket.userId=data.id;
	last_seen(this.userId);
}
module.exports = function(io) {
	io.sockets.on('connect',function(socket) {
		socket.emit("connected");
		socket.on('register',register);
		socket.on('userUnlock',userUnlock);
		socket.on('chat',chat);
		socket.on('user',user);
		socket.on('disconnect',disconnectUser);
	});
};

function last_seen(id) {
	if (connected_users[id]) {
		connected_users[id].last_seen = (new Date()).getTime();
	}
}

setInterval(function(){
	var now = (new Date()).getTime();
	for (id in connected_users) {
		if (connected_users[id].last_seen + max_user_timeout < now) {
			disconnectUser(id);
		}
	}
},2000);