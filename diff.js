
var mongo = require('mongodb');
var _ = require('underscore');

var db_settings = {
    appname: "eventish",
    host: "localhost",
    port: 27017,
    table: "eventish",
}

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

        var events = collection;

        var thisRun = Math.round(Math.random()*1e7);
        console.log("This run is tagged: " + thisRun);

        var first_names = ['Norberto', 'Shanon', 'Merlyn', 'Ricki', 'Marx', 'Trinidad', 'Stacy', 'Chanelle', 'Nena', 'Tanesha', 'Alix', 'Zetta', 'Luther', 'Sal', 'Jimmy', 'Agnes', 'Trena', 'Marco', 'Jimmie', 'Dorine']
        var last_names = ['Snoddy', 'Fagan', 'Platz', 'Batts', 'Hartman', 'Chae', 'Liakos', 'Counter', 'Marrow', 'Merchant', 'Moler', 'Narciso', 'Larson', 'Suttles', 'Ridgell', 'Habib', 'Tipping', 'Suess', 'Grenier', 'Dawn']
        var names = [];

        for(var i=1; i<20; i++) {
            var first = first_names[Math.floor(Math.random()*first_names.length)];
            var last = last_names[Math.floor(Math.random()*last_names.length)];
            var name = first + " " + last;
            if (!_.contains(names, name)) {
                names.push(name);
            }
        }

        var left = _.first(_.shuffle(names), 15);
        var right = _.first(_.shuffle(names), 17);

        _.each(left, function(name) {
            var e = {
                timestamp: new Date(),
                tags: ["left", thisRun],
                data: {
                    user: name
                }
            }
            events.insert(e);
        })
        _.each(right, function(name) {
            var e = {
                timestamp: new Date(),
                tags: ["right", thisRun],
                data: {
                    user: name
                }
            }
            events.insert(e);
        })

        process.exit(0)
    });
})
