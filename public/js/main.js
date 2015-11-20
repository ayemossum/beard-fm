(function($) {
	var socket = io();
	window.__socket = socket;
	var chat_box_entry;
	var appState = {
		userName: null,
		admin: false,
		connected: false,
		userId: null
	};
	$(function() {
		function becomeAdmin() {
			console.log("%s is now admin",appState.userName);
			appState.admin=true;
		}
		if (localStorage) {
			appState.userName = localStorage.getItem('userName');
			if (appState.userName) appState.userId = localStorage.getItem('userId');
		}
		chat_box_entry = $('.js-chat-box-entry');

		socket.on('message', (data) => {
			console.log(data);
			var value = data.message.split(':');
			switch(value[0]) {
				case 'connected':
				socket.emit('fudgeyou');
					console.log('connected');
					break;
				case 'chat':
					/// TODO: do chat
					break;
				case 'user':
					switch (value[1]){
						case 'add':
							addUser(value[2]);
							break;
						case 'remove':
							removeUser(value[2]);
							break;
						case 'rename':
							renameUser(value[2],value[3]);
							break;
						case 'admin':
							becomeAdmin();
							break;						
					}
					break;
			}
		});
		socket.on('user',function(value){
			value=value.split(':');
			switch (value[0]){
				case 'add':
					addUser(value[1]);
					break;
				case 'remove':
					removeUser(value[1]);
					break;
				case 'rename':
					renameUser(value[1],value[2]);
					break;
				case 'admin':
					becomeAdmin();
					break;						
			}
		});
		chat_box_entry.on('keypress',(e) => {
			if (e.which==13) {
				socket.emit('chat',{message: 'chat:'+chat_box_entry.val()});
				chat_box_entry.val('');
			}
		});
		$('.unlock').on('click',function(e){
				socket.emit('userUnlock');
		});
	});
})(jQuery);