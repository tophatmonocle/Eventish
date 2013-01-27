
var mongo = require('mongodb');
var _ = require('underscore');

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

        var events = collection;

        var thisRun = Math.round(Math.random()*1e7);
        console.log("This run is tagged: " + thisRun);

        var now = new Date();

        for (var h=24; h>=0; h--) {
            var count = 10+Math.round(Math.sin(h/12*Math.PI)+Math.nrand());
            for(var i=0; i<count; i++) {
                var e = {
                    timestamp: (new Date()).setHours(now.getHours()-h),
                    tags: ["nyan", thisRun],
                    data: {}
                }
                events.insert(e);
            }
        }

        process.exit(0)
    });
})