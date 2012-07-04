var SOCKET_SERVER = 'localhost'
var SOCKET_PORT = 3100

var Subscription = Backbone.Model.extend({
	defaults: {
		tags: [],
		socket: undefined
	},
	initialize: function() {
		this.socket();
		this.bind("change:tags", this.update_tags, this);
	},
	socket: function() {
		// establish a socket connection
		var socket = io.connect('http://'+SOCKET_SERVER+':'+SOCKET_PORT);
		socket.on('connect', this.update_tags.bind(this));
		socket.on('event', function(data) {
			this.trigger('event', data);
		}.bind(this));
		this.set({ socket: socket });
	},
	update_tags: function() {
		// keep the connection alive
		console.log('updating tags!');
		this.get('socket').emit('tags', this.get('tags'));
	}
});

var Tag = Backbone.Model.extend({
	defaults: {
		name: undefined,
		active: false,
	}
});

var Event = Backbone.Model.extend({
	defaults: {
		tags: [],
		timestamp: undefined,
	}
})