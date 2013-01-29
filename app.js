
var _ = require('underscore');
var express = require('express');
var sio = require('socket.io');
var mongo = require('mongodb');
var http = require('http');

var app = express();
var server = http.createServer(app);

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/static'))
    app.set('views', __dirname + '/templates');
    app.set('view engine', 'jade');
});

server.listen(3100);

var io = sio.listen(server)

io.configure(function() {
    io.set('log level', 1);
    io.set('reconnection limit', 2000);
    io.set('max reconnection attempts', Infinity);
})

var db_settings = {
    appname: "eventish",
    host: "localhost",
    port: 27017,
    table: "eventish",
}

// DB SETUP

var events, subscriptions;

var db = new mongo.Db(db_settings.table, new mongo.Server(db_settings.host, db_settings.port, {}), {});
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
var filterMiddleware = function(next) {
	var isValidDate = function(timestamp) {return (new Date(parseInt(timestamp))).getTime() > 0}
	return function(req, res) {
		var data = req.method == "POST" ? req.body : req.query
		var options = {}
		if ("start_date" in data || "end_date" in data) {
			options.timestamp = {}
			if (isValidDate(data.start_date)) options.timestamp.$gte = parseInt(data.start_date)
			if (isValidDate(data.end_date)) options.timestamp.$lte = parseInt(data.end_date)
		}
		if (data.tags instanceof Array && data.tags.length > 0) {
			options.tags = {$all: data.tags}
		}
		
		events.find(options, function(err, cursor) {
			cursor.limit(1000).toArray(function(err, result) {
				res.header("X-Result-Count", result.length)
				res.result = result
				next(req, res)
			})
		})
	}
}
app.head('/event', filterMiddleware(function(req, res) {res.send("")}))
app.get('/event', filterMiddleware(function(req, res) {res.send(res.result)}));

app.post('/event', function(req,res) {
    console.log('incoming event!');
    if(!req.body.tags) {
        res.send("at least one tag required");
        return;
    }
    createEvent(req.body, function(err, event) {
        res.send(event._id)
        broadcast(event)
    })
});

app.get('/', function(req, res) {
    res.render('index', { layout: false });
});

app.get('/report', function(req, res) {
	res.render('report', {layout: false});
})

var createEvent = function(event, cb) {
    new_event = {
        timestamp: new Date().getTime(),
        tags: event.tags,
        data: event.data // optional
    }
    events.insert(new_event, function(err, result) {
        cb(false, result[0]);
    })
}

// SUBSCRIPTIONS

var sockets = {}

io.sockets.on('connection', function(socket) {
    sockets[socket.id] = socket;
    socket.on('subscribe', function(tags, callback) {
        console.log('updating subscription to ', tags)
        subscriptions.update({ socket_id: socket.id }, { 
            socket_id: socket.id,
            // socket:socket,
            tags: tags,
        }, { upsert: true });
    });
    socket.on('event', function(event, callback) {
        console.log('got a socket event');
        createEvent(event, function(err, event) {
            broadcast(event);
        });
    });
});

var broadcast = function(event) {
    subscriptions.find({tags: {$in: event.tags}}, function(err, subs) {
        subs.toArray(function(err, subs) {
            _.each(subs, function(sub) {
                var socket = sockets[sub.socket_id];
                socket.emit('event', event);
            });
        });
    })
}