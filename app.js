
var _ = require('underscore');
var express = require('express')
var sio = require('socket.io');
var mongo = require('mongodb');
var http = require('http');
var fs = require('fs');
var Buffer = require('buffer').Buffer;

var app = express.createServer();

app.configure(function() {
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/static'))
	app.set('views', __dirname + '/templates');
	app.set('view engine', 'jade');
});

app.listen(3100);

var io = sio.listen(app)

io.configure(function() {
	io.set('log level', 1);
})

app.use('/css', express.static(__dirname + '/css'))
app.use('/img', express.static(__dirname + '/img'))

var seconds = 1000; // length of a second

var db_settings = {
	appname: "eventish",
	host: "localhost",
	port: 27017,
	name: "eventish",
}

// DB SETUP

var events, subscriptions;

var db = new mongo.Db(db_settings.name, new mongo.Server(db_settings.host, db_settings.port, {}), {});
db.open(function(err) {
	if(err) {
		console.log("database error");
		process.exit(1)
	}
	console.log("connected to database");
	db.collection("events", function(err, collection) {
		if(err) {
			console.log("collection error");
			process.exit(1);
		}
		events = collection;
	})
	db.collection("subscriptions", function(err, collection) {
		if(err) {
			console.log("collection error");
			process.exit(1);
		}
		subscriptions = collection;
		// reset existing subscriptions
		subscriptions.remove();
	})
})

// EVENTS 

app.get('/event', function(req, res) {
	events.find(req.body, function(err, cursor) {
		cursor.toArray(function(err, result) {
			res.send(result)
		})
	})
});

app.post('/event', function(req,res) {
	console.log('incoming event!');
	if(!req.body.tags) {
		res.send("at least one tag required");
		return;
	}
	console.log('found tags', req.body.tags)
	new_event = {
		timestamp: new Date().getTime(),
		tags: req.body.tags,
		data: req.body.data // optional
	}
	events.insert(new_event, function(err, result) {
		res.send(result._id)
		console.log('inserted event', result);
		// get any subscriptions that include one or more of the tags associated with this event
		// send a message to that subscribed user
		broadcast(result[0])	
	})
});

app.get('/', function(req, res) {
	res.render('index', { layout: false });
});

// SUBSCRIPTIONS

var sockets = {}

io.sockets.on('connection', function(socket) {
	sockets[socket.id] = socket;
	socket.on('tags', function(tags, callback) {
		console.log('updating tags to ', tags)
		subscriptions.update({ socket_id: socket.id }, { 
			socket_id: socket.id,
			// socket:socket,
			tags: tags,
		}, { upsert: true });
	});
});

var broadcast = function(event) {
	console.log('broadcasting event', event._id);
	subscriptions.find({tags: {$in: event.tags}}, function(err, subs) {
		console.log(subs.items.length);
		subs.toArray(function(err, subs) {
			_.each(subs, function(sub) {
				console.log('  to sub', sub)
				var socket = sockets[sub.socket_id];
				socket.emit('event', event);
			});
		});
	})
}