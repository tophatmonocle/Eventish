
var _ = require('underscore');
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);
var mongo = require('mongodb');
var http = require('http');
var fs = require('fs');
var Buffer = require('buffer').Buffer;

var generation = 0; // generation subscriber generation
var seconds = 1000; // length of a second

var db_settings = {
	appname: "eventish",
	host: "localhost",
	port: 27017,
	name: "eventish",
}

var subscription_settings = {
	host: "localhost",
	port: 28018,
	timeout: 60*seconds,
	max_timeout: 2 // timeout periods before being removed
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
		subscriptions.update({}, { $inc: {generation: generation} }, undefined, true); 
	})
})

// EVENTS 

app.configure(function() {
	app.use(express.bodyParser());
});

app.get('/event', function(req, res) {
	events.find(req.body, function(err, cursor) {
		cursor.toArray(function(err, result) {
			res.send(result)
		})
	})
});

app.post('/event', function(req,res) {
	if(!req.body.tags) {
		res.send("at least one tag required");
		return;
	}
	new_event = {
		timestamp: new Date().getTime(),
		tags: req.body.tags,
		data: req.body.data // optional
	}
	events.insert(new_event, function(err, result) {
		res.send(result._id)
		// get any subscriptions that include one or more of the tags associated with this event
		// send a message to that subscribed user
		broadcast(result[0])	
	})
});

app.get('/', function(req, res) {
	fs.readFile('./templates/index.html', 'ascii', function(err, html) {
		if(err) {
			console.log("cannot load template");
			process.exit(1);
		}
		res.send(html);
	})
})

app.get('/scripts/:filename', function(req, res) {
	fs.readFile('./scripts/'+req.params.filename, 'ascii', function(err, js) {
		if(err) {
			res.send("Script not found");
			return;
		}
		res.send(js);
	});
})

app.listen(3100);

// SUBSCRIPTIONS

io.sockets.on('connection', function(socket) {
	socket.on('subscribe', function(tags) {
		subscriptions.update({ socket: socket }, { socket: socket, tags: tags, generation: generation });
	})
});

io.sockets.on('message', function(msg, callback) {
	subscriptions.update({ from: from }, { from: from, tags: msg.tags, generation: generation }, { upsert: true });
});

var subscription_timeout = setInterval(function() {
	// remove all stale subscriptions
	subscriptions.remove({ generation: {$lt: generation - subscription_settings.max_timeout } });
	// increment the subscription generation
	generation++;
}, subscription_settings.timeout)

var broadcast = function(event) {
	subscriptions.find({tags: {$in: req.body.tags}}, function(err, subs) {
		subs.toArray(function(err, subs) {
			_.each(subs, function(sub) {
				sub.socket.emit('event', event);
			});
		});
	})
}