var express = require('express');
var app = express();
var settings = require('./settings.json');
var defaults = require('./defaults.json');
var socketio = require('socket.io');
var process = require('process');
var listen_port = process.env.PORT || 3000;
var adminpass = process.env.ADMIN || 'youshallnotpass';
var shortid = require('shortid');
var run_id = shortid();
for (key in settings) {
	app.set(key, settings[key]);
}
app.use(express.static('public'));

app.get('/', function (req, res) {
	res.render('index', { title: defaults.title, run_id: run_id } );
});
app.get('/ping', function(req,res){
	res.send('pong').end();
});

var server = require('http').Server(app);
var io = socketio.listen(server);
require('./socket_routes.js')(io,adminpass,run_id);


server.listen(listen_port, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log("Beard.fm is now running at http://%s:%s", host, port);
});