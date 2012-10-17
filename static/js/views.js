/*jslint nomen: true */
/*global clearInterval: false, clearTimeout: false, document: false, event: false, frames: false, history: false, Image: false, location: false, name: false, navigator: false, Option: false, parent: false, screen: false, setInterval: false, setTimeout: false, window: false, XMLHttpRequest: false */
/*global alert: false, confirm: false, console: false, Debug: false, opera: false, prompt: false, WSH: false */
/*global Backbone: false, io: false, _: false */

(function () {
    "use strict";
    window.EventDetailView = Backbone.View.extend({
        model: window.Event,
        tagName: "li",
        className: 'file',
        initialize: function (options) {
            this.template = options.template === undefined ? "" : options.template;
        },
        render: function () {
            this.$el.text(this.model.format(this.template));
        }
    });

    window.EventGroupView = Backbone.View.extend({
        model: window.EventGroup,
        tagName: "li",
        template: "<label for='<%= cid %>'><%= label %></label><input type='checkbox' id='<%= cid %>' /><ol></ol>",
        rendered: false,
        initialize: function () {
            this.cid = _.uniqueId('group_');
            this.model.get('events').bind('add', this.append, this);
        },
        render: function () {
            this.rendered = true;
            this.$el.html(_.template(this.template, {
                cid: this.cid,
                label: _.template(this.model.get('label'), this.model.attributes)
            }));
            if (this.model.get('detail')) {
                this.model.get('events').each(this.append, this);
            }
        },
        append: function (event) {
            if (!this.rendered) {
                return;
            }
            var event_view = new window.EventDetailView({
                model: event,
                template: this.model.get('detail')
            });
            event_view.render();
            this.$('>ol').append(event_view.el);
        }
    });

    window.NestedGroupView = window.EventGroupView.extend4000({
        initialize: function () {
            var groups = this.model.get('groups');
            if (groups) {
                groups.bind('add', this.append_group, this);
            }
        },
        render: function () {
            window.EventGroupView.prototype.render.apply(this);
            var groups = this.model.get('groups');
            if (groups) {
                this.model.get('groups').each(this.append_group, this);
            }
        },
        append_group: function (group) {
            if (!this.rendered) {
                return;
            }

            var group_view = new window.NestedGroupView({
                model: group
            });
            group_view.render();
            this.$('>ol').prepend(group_view.el); // group views always go at the top
        }
    });
}());