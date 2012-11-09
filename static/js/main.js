
var subscription;
$(document).ready(function () {
    var tags = [];
    var highlights = [];

    if (localStorage) {
        if(localStorage.getItem('tags')) {
            tags = localStorage.getItem('tags').split(',');
        }
        if(localStorage.getItem('highlights')) {
            highlights = localStorage.getItem('highlights').split(',');
        }

        $('#tags').val(tags.join(','));
        $('#highlight').val(highlights.join(','));
    }

    subscription = new Subscription({ tags: tags });
    
    $('#highlight').select2({ tags: tags });

    $('#tags').select2({ tags:[] }).bind('change', function() {
        var tags = $(this).val().split(',');
        subscription.set({ tags: tags });
        if (localStorage) {
            localStorage.setItem('tags', tags);
        }
        $('#highlight').select2({ tags: tags });
    });

    $('#highlight').bind('change', function () {
        $('.event').each(function () {
            highlight(this);
        });
        if (localStorage) {
            localStorage.setItem('highlights', $(this).val().split(','));
        }
    });

    subscription.bind('event', newEvent);

    matches_generated = new EventGroup({
        tag: 'generated',
        label: '<%= count %> matches generated',
        detail: '<%= username %>'
    });

    matches_acknowledged = new EventGroup({
        tag: 'match_ack',
        label: '<%= count %> matches acknowledged',
        detail: '<%= username %>'
    });

    matches_complete = new EventGroup({
        tag: 'complete',
        label: '<%= count %> matches completed',
        detail: '<%= username %>'
    });

    tournament_events = new NestedGroup({
        tag: 'tournament',
        label: 'Tournament',
    });

    round_group = new NestedGroup({
        label: 'Round <%= id %>'
    });

    round_group.get('groups').add([
        matches_generated,
        matches_acknowledged,
        matches_complete
    ]);

    round_iterator = new EventGroupIterator({
        key: 'round_num',
        template: round_group,
        label: 'Rounds',
    });

    online_group = new EventGroup({
        tag: 'online',
        label: '<%= count %> online',
        detail: '<%= username %>'
    });

    tournament_group = new NestedGroup({
        label: '<%= id %>'
    });

    tournament_group.get('groups').add([
        online_group,
        round_iterator,

    ]);

    tournament_iterator = new EventGroupIterator({
        key: 'tournament_id',
        template: tournament_group,
        label: 'Tournaments'
    });

    view = new NestedGroupView({ model: tournament_iterator });
    $('#main_tree').append(view.el);
    view.render();

    error_group = new EventGroup({
        tag: 'ajaxError',
        label: '<%= count %> errors logged',
        detail: '<span class="error_code"><%= status %></span><span class="error_url"><%= url %></span><span class="error_details"><%= username %> <%= date %></span><% if (typeof(data) != "undefined") { %><div class="error_data"><%= decodeURIComponent(data).substring(5) %><% } %></div>'
    });

    error_view = new EventGroupView({ model: error_group })
    $('#error_tree').append(error_view.el);
    error_view.render();
    error_event = new Event({"timestamp":1350582340605,"tags":["error"],"data":{"error": "xhr:", "status":500,"username":"anonymous_KWiXNH","message":"NameError at /epublisher/\nglobal name 'asdfasdfadsfadsf' is not defined\n\nRequest Method: POST\nReques"},"_id":"5080404469190980480000f0"})
})

var newEvent = function (event) {
    // var eventEl = $('<div></div>').text(JSON.stringify(event));
    // eventEl.addClass('event');
    // eventEl.attr('tags', event.tags.join(','));
    // $('#chart').prepend(eventEl)
    // highlight(eventEl);
    var event_obj = new Event(event);
    if (event_obj.tags[0] == 'ajaxError') {
        error_group.add(event_obj);
    } else {
        tournament_iterator.add(event_obj);
    }
}

var highlight = function (event) {
    var eventTags = $(event).attr('tags').split(',');
    var highlightedTags = $('#highlight').val().split(',');

    $(event).removeClass('quiet').removeClass('loud');
    
    if (highlightedTags.length == 0) { 
        return;
    }

    // if none of the highlighted tags are present, add the 'quiet' class
    // if all of the highlighted tags are present, add the 'loud' class
    var loud = true, quiet = true;
    _.each(highlightedTags, function(tag) {
        if (!_.include(eventTags, tag)) {
            loud = false;
        } else {
            quiet = false;
        }
    });

    if (quiet) {
        $(event).addClass('quiet');
    } else if (loud) {
        $(event).addClass('loud');
    }
}