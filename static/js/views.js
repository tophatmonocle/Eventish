/*jslint nomen: true */
/*global clearInterval: false, clearTimeout: false, document: false, event: false, frames: false, history: false, Image: false, location: false, name: false, navigator: false, Option: false, parent: false, screen: false, setInterval: false, setTimeout: false, window: false, XMLHttpRequest: false */
/*global alert: false, confirm: false, console: false, Debug: false, opera: false, prompt: false, WSH: false */
/*global Backbone: false, io: false, _: false */

(function () {
    "use strict";
    window.EventDetailView = Backbone.View.extend({
        model: window.Event,
        tagName: "li",
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
        template: "<label for='group_<%= cid %>'>Event Group</label><input type='checkbox' id='group_<%= cid %>' /><ol></ol>",
        initialize: function () {
            this.cid = _.uniqueId('group_');
        },
        render: function () {
            this.$el.html(_.template(this.template, { cid: this.cid }));
        },
        append: function (el) {
            this.$el.$('ol').append(el);
        }
    });
}());