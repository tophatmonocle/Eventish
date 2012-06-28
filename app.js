
var _ = require('underscore');
var express = require('express');
var mongo = require('mongodb');
var http = require('http');
var fs = require('fs');

var app = express.createServer();
app.configure(function() {
	app.use(express.bodyParser());
});

var settings = {
	appname: "eventish",
	dbhost: "localhost",
	dbport: 27017,
	dbname: "eventish",
}

var events;

var db = new mongo.Db(settings.dbname, new mongo.Server(settings.dbhost, settings.dbport, {}), {});
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
})

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

app.get('/event', function(req, res) {
	events.find({}, function(err, cursor) {
		cursor.toArray(function(err, result) {
			res.send(result)
		})
	})
});

app.post('/event', function(req,res) {
	console.log(req.body);
	console.log(req.body.tags);
	if(!req.body.tags) {
		res.send("at least one tag required");
		return;
	}
	new_event = {
		date: new Date(),
		tags: req.body.tags
	}
	if(req.body.data) {
		new_event.data
	}
	events.insert(new_event, function(err, result) {
		console.log(result);
		res.send(result._id)
	})
});

app.listen(3100);