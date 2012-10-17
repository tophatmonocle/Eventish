
var _ = require('underscore');
var express = require('express')
var sio = require('socket.io');
var mongo = require('mongodb');

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

app.get('/event', function(req, res) {
    events.find(req.body, function(err, cursor) {
        cursor.toArray(function(err, result) {
            res.send(result)
        })
    })
});

app.post('/event', function(req,res) {
    console.log('incoming event!');
    if(_.isArray(req.body)) {
        events_data = req.body;
    } else {
        events_data = [req.body];
    }
    console.log(events_data.length, "events found")
    _.each(events_data, function(data) {
        createEvent(data, function(err, event) {
            broadcast(event)
        })
    });
    res.send("ok")
});

app.get('/', function(req, res) {
    res.render('index', { layout: false });
});

var createEvent = function(event, cb) {
    new_event = {
        timestamp: new Date().getTime(),
        tags: event.tags,
        data: event.data // optional
    }
    console.log(new_event)
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