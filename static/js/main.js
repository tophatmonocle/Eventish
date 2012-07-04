
var subscription;
var chart;
var eventData = [];
var active_tags = [];

$(document).ready(function() {
	var tags = localStorage ? localStorage.getItem('tags').split(',') : [];
	subscription = new Subscription({ tags: tags });

	_.each(tags, function(tag) {
		eventData.push({ key: tag, values: [] });
	});
	
	if(localStorage) {
		$('#tags').val(tags.join(','));
	}
	
	$('#tags').select2({ tags:[] }).bind('change', function() {
		var tags = $(this).val().split(',');
		subscription.set({ tags: tags });
		if(localStorage) {
			localStorage.setItem('tags', tags);
		}
		setupButtons(tags);
	});

	subscription.bind('event', newEvent);
	setInterval(newBucket, 1000);
	setupButtons(tags);
})

var setupButtons = function(tags) {
	var buttons = $('#highlight-buttons');
	buttons.children().each(function() {
		$(this).attr('remove', 'true');
	})
	_.each(tags, function(tag) {
		if($('[tag="'+tag+'"]', buttons).length) {
			$('[tag="'+tag+'"]', buttons).removeAttr('remove');
		} else {
			var newButton = $('<button>');
			newButton.text(tag);
			newButton.addClass('btn');
			newButton.attr('data-toggle', 'button');
			newButton.attr('tag', tag);
			newButton.click(function(e) {
				event.preventDefault();
				$(this).toggleClass('active');
				active_tags = [];
				$('button.active').each(function() {
					active_tags.push($(this).attr('tag'));
				})
				setupHighlights();
				return false;
			})
			buttons.append(newButton);
			newButton.button();
		}
	})
	$('button[remove=true]').remove()
	setupHighlights();
}

var setupHighlights = function() {
	var events = $('.event');
	events.removeClass('loud').removeClass('quiet');
	if(active_tags.length) {
		events.addClass('quiet');
		_.each(active_tags, function(tag) {
			$('.event[tags*="'+tag+'"]').removeClass('quiet');
		});
		_.each(events, function(event) {
			var tags = $(event).attr('tags').split(',');
			var loud = true;
			_.each(active_tags, function(tag) {
				// if any of the highlighted tags are not present, make it not loud
				if(!_.include(tags, tag)) {
					loud = false;
				}
			});
			if(loud) {
				$(event).addClass('loud');
			}
		})
	} else {
		events.removeAttr('quiet');
	}
}

var to_bucket = function(timestamp) {
	// convert a timestamp to a bucket
	// for now the bucket size is 1s
	return Math.round(timestamp/1000);
}

var newBucket = function() {
	// make sure there's a bucket for the current timestamp
	var bucket = to_bucket(new Date().getTime());
	_.each(eventData, function(data) {
		var dataPoint = _.find(data.values, function(value) { return value[0] == bucket });
		if(!dataPoint) {
			data.values.push([bucket, 0]);
		}
	})
	// updateGraph();
}

var newEvent = function(event) {
	_.each(event.tags, function(tag) {
		var dataList = _.find(eventData, function(data) { return data.key == tag });
		if(!dataList) {
			dataList = { key: tag, values: [] }
			eventData.push(dataList);
		}

		var bucket = to_bucket(event.timestamp);

		var dataPoint = _.find(dataList.values, function(value) { return value[0] == bucket });
		if(dataPoint) {
			dataPoint[1] += 1;
		} else {
			dataList.values.push([bucket, 1]);
		}
	})
	console.log(event, eventData);
	var eventEl = $('<div></div>').text(JSON.stringify(event));
	eventEl.addClass('event');
	eventEl.attr('tags', event.tags.join(','));
	$('#chart').prepend(eventEl)
}
