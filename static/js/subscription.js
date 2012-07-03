var SOCKET_SERVER = 'localhost'
var SOCKET_PORT = 3100
var HEARTBEAT_INTERVAL = 10*1000; // 10 seconds

var Subscription = Backbone.Model.extend({
	defaults: {
		tags: [],
		socket: undefined
	},
	initialize: function() {
		this.socket();
		this.bind("change:tags", this.heartbeat_func(), this);
	},
	socket: function() {
		// establish a socket connection
		var socket = io.connect('http://'+SOCKET_SERVER+':'+SOCKET_PORT);
		socket.on('event', function(data) {
			console.log(data);
			this.trigger('event', data);
		})
		this.set({ socket: socket });
		this.set({ heartbeat: setInterval(this.heartbeat_func.bind(this), HEARTBEAT_INTERVAL) });
	},
	heartbeat_func: function() {
		// keep the connection alive
		this.get('socket').emit('tags', this.get('tags'));
	}
})