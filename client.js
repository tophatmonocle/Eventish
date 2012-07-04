var urlReq = require('urlReq')

urlReq.urlReq('http://localhost:3100/event', {
    method: 'POST',
    params:{
        tags: ['login', 'correct']
    }
}, function(body, res){

    console.log(body);

});