/*jslint nomen: true */
/*global clearInterval: false, clearTimeout: false, document: false, event: false, frames: false, history: false, Image: false, location: false, name: false, navigator: false, Option: false, parent: false, screen: false, setInterval: false, setTimeout: false, window: false, XMLHttpRequest: false */
/*global alert: false, confirm: false, console: false, Debug: false, opera: false, prompt: false, WSH: false */
/*global Backbone: false, io: false, _: false */

(function () {
    "use strict";
    var SOCKET_SERVER = 'localhost', SOCKET_PORT = 3100;

    window.Subscription = Backbone.Model.extend({
        defaults: {
            tags: [],
            socket: undefined
        },
        initialize: function () {
            this.socket();
            this.bind("change:tags", this.update_tags, this);
        },
        socket: function () {
            // establish a socket connection
            var socket = io.connect('http://' + SOCKET_SERVER + ':' + SOCKET_PORT);
            socket.on('connect', this.update_tags.bind(this));
            socket.on('event', function (data) {
                this.trigger('event', data);
            }.bind(this));
            this.set({ socket: socket });
        },
        update_tags: function () {
            // keep the connection alive
            console.log('updating tags!');
            this.get('socket').emit('subscribe', this.get('tags'));
        }
    });

    window.Tag = Backbone.Model.extend({
        defaults: {
            name: undefined,
            active: false
        }
    });

    window.Event = Backbone.Model.extend({
        defaults: {
            tags: [],
            timestamp: undefined
        },
        format: function (string) {
            return _.template(string, this.get('data'));
        }
    });

    window.EventCollection = Backbone.Collection.extend({
        model: window.Event
    });

    window.EventGroup = Backbone.Model.extend({
        defaults: {
            count: 0
        },
        initialize: function () {
            this.set({
                events: new window.EventCollection()
            });
        },
        accepts: function (event) {
            var tag = this.get('tag');

            if (!tag) {
                return true;
            }

            if (_.indexOf(event.get('tags'), tag) >= 0) {
                return true;
            } else {
                return false;
            }
        },
        add: function (event) {
            this.get('events').add(event, { silent: true });
            this.set({ count: this.get('events').length });
            this.get('events').trigger('add', event);
        }
    });

    window.EventGroupCollection = Backbone.Collection.extend({
        model: window.EventGroup
    });

    window.NestedGroup = window.EventGroup.extend4000({
        initialize: function () {
            this.set({
                groups: new window.EventGroupCollection()
            });
        },
        add: function (event) {
            if (this.accepts(event)) {
                this.get('events').add(event);
                var group = this.get('groups').find(function (group) {
                    return group.accepts(event);
                });
                if (group) {
                    group.add(event);
                }
            }
        },
        clone: function () {
            var groups, clone;

            clone = window.EventGroup.prototype.clone.apply(this);
            this.get('groups').each(function (group) {
                clone.get('groups').add(group.clone());
            });

            return clone;
        }
    });

    window.EventGroupIterator = window.NestedGroup.extend4000({
        add: function (event) {
            if (this.accepts(event)) {
                var key, group, template;

                key = event.get('data')[this.get('key')];
                group = this.get('groups').get(key);

                if (!group) {
                    template = this.get('template');
                    if (template) {
                        group = template.clone();
                    } else {
                        group = new window.NestedGroup();
                    }
                    group.set({
                        id: key
                    });
                    this.get('groups').add(group);
                }

                group.add(event);
            }
        },
        clone: function () {
            var clone = window.NestedGroup.prototype.clone.apply(this);
            clone.set({
                template: this.get('template')
            });
            return clone;
        }
    });
}());