var urlReq = require('urlReq')

// this is slow and it sucks
// test it better on the web client like this:
//
// socket = subscription.get('socket');
// var event = { tags: ['login', 'correct'] }
// for(i=1; i<1000; i++) {
//   socket.emit('event', event)
// }

for(i=1; i<1000; i++) {
    urlReq.urlReq('http://localhost:3100/event', {
        method: 'POST',
        params:{
            tags: ['login', 'correct'],
            data: {
                iteration: i
            }
        }
    }, function(body, res){

        console.log(body);

    });
}