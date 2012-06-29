
var Buffer = require('buffer').Buffer;
var dgram = require('dgram');

var stdin = process.openStdin();
stdin.setEncoding('utf8');

SERVER_HOST = '127.0.0.1';
SERVER_PORT = 28018;

var sock = dgram.createSocket("udp4");

var tags = [];

stdin.on('data', function (input) {
	// add subscripton to input
	tags.push(input.substr(0, input.length-1)); // remove \n at end of input
	subscribe(tags);
});

sock.on('message', function (buf) {
  process.stdout.write(buf.toString());
});

var subscribe = function(tags) {
	var msg = {
		tags: tags
	}
	console.log("subscribing to tags", tags);
	var buf = new Buffer(JSON.stringify(msg));
	sock.send(buf, 0, buf.length, SERVER_PORT, SERVER_HOST);
}

setInterval(function() { subscribe(tags) }, 30000);