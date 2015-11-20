var express = require('express');
var app = express();
var settings = require('./settings.json');
var defaults = require('./defaults.json');
var socketio = require('socket.io');
for (key in settings) {
	app.set(key, settings[key]);
}
app.use(express.static('public'));

app.get('/', function (req, res) {
	res.render('index', { title: defaults.title } );
});

var server = require('http').Server(app);
var io = socketio.listen(server);
require('./socket_routes.js')(io);


server.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log("Beard.fm is now running at http://%s:%s", host, port);
});