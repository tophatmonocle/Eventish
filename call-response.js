
var mongo = require('mongodb');

Math.nrand = function() {
    var x1, x2, rad;

    do {
        x1 = 2 * Math.random() - 1;
        x2 = 2 * Math.random() - 1;
        rad = x1 * x1 + x2 * x2;
    } while(rad >= 1 || rad == 0);

    var c = Math.sqrt(-2 * Math.log(rad) / rad);

    return x1 * c;
};

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
        var thisRun = Math.round(Math.random()*1e7);
        console.log("This run is tagged: " + thisRun);
        var events = collection;
        var now = new Date();
        var call = {
            timestamp: (new Date()).setSeconds(now.getSeconds()-60),
            tags: ["call", thisRun],
            data: {}
        }
        events.insert(call);

        for (var i=0; i<20; i++) {
            var dt = 20 + Math.nrand() * 20
            var response = {
                timestamp: (new Date()).setSeconds(now.getSeconds() - dt),
                tags: ["response", thisRun],
                data: {}
            }
            events.insert(response);
        }
        process.exit(0)
    });
})