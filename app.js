
var _ = require('underscore');
var express = require('express');
var mongo = require('mongodb');
var http = require('http');
var fs = require('fs');
var Buffer = require('buffer').Buffer;
var dgram = require('dgram');

var current = 0; // current subscriber generation
var seconds = 1000; // length of a second

var db_settings = {
	appname: "eventish",
	host: "localhost",
	port: 27017,
	name: "eventish",
}

var subscription_settings = {
	host: "localhost",
	port: "28018",
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
		subscriptions.update({}, { $inc: {current: current} }, undefined, true); 
	})
})

//EVENTS 

var app = express.createServer();
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
		tags: req.body.tags
	}
	if(req.body.data) {
		new_event.data = req.body.data;
	}
	events.insert(new_event, function(err, result) {
		console.log(result);
		res.send(result._id)
	})

	// get any subscriptions that include one or more of the tags associated with this event
	// send a message to that subscribed user
	subscriptions.find({tags: {$in: req.body.tags}}, function(err, subs) {
		broadcast(subs, new_event);
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

// SUBSCRIPTIONS

var subscription_timeout = setInterval(function() {
	// remove all stale subscriptions
	subscriptions.remove({ current: {$lt: current - subscription_settings.max_timeout } });
	// increment the subscription generation
	current++;
}, subscription_settings.timeout)

var sock = dgram.createSocket("udp4", function(msg, peer) {
	// incoming messages always contain the list of subscribed tags
	var msg = JSON.parse(msg);
	var key = peer.address + ":" + peer.port; // no real way to know who it is apart from their port

	// update the connection's subscription
	subscriptions.update({ address: peer.address, port: peer.port }, {$inc: { tags: tags, current: current }}, true, false);
});

var broadcast = function(subs, event) {
	var buffer = JSON.stringify(event);
	_.each(subs, function(sub) {
		sock.send(buffer, 0, buffer.length, sub.port, sub.host)
	})
}

app.listen(3100);