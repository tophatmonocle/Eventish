
var subscription;
var chart;
var eventData = [];

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
	});

	subscription.bind('event', newEvent);
	setInterval(newBucket, 1000);
})


var to_bucket = function(timestamp) {
	// convert a timestamp to a bucket
	// for now the bucket size is 1s so just return the timestamp
	return timestamp
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
	$('#chart').append($('<div></div>').text(JSON.stringify(event)))
}
