function userUnlock(data){
	console.log('userUnlock');
	console.log(data);
	this.emit('user','admin');
};
function chat(socket,data){
	
}
function user(socket,data){
	
}
module.exports = function(io) {
	io.sockets.on('connect',function(socket) {
		socket.emit("connected");
		socket.on('userUnlock',userUnlock);
		socket.on('chat',chat);
		socket.on('user',user);
	});
};