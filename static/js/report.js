if (!("MyApp" in window)) MyApp = {}
if (!("Models" in MyApp)) MyApp.Models = {}
if (!("Views" in MyApp)) MyApp.Views = {}

MyApp.Models.EventList = Backbone.Collection.extend({
	url: "/event",
	fetch: function(params) {
		return $.ajax(this.url, {type: "GET", data: $.param(params)})
	},
	fetchMetadata: function(params) {
		return $.ajax(this.url, {type: "HEAD", data: $.param(params)})
	}
})

MyApp.Views.EventCount = Backbone.View.extend({
	el: $("#event-count"),
	initialize: function() {
		_.bindAll(this, "getReport")
		
		$("#count-start-date,#count-end-date").datepicker()
		$("#count-tags").select2({tags: []}).on("change", function() {
			var self = $(this)
			self.select2({tags: self.val().split(",")})
		})
	},
	events: {
		"click #get-event-count": "getReport"
	},
	getReport: function() {
		var startDate = $("#count-start-date").val()
		var endDate = $("#count-end-date").val()
		var tags = $("#count-tags").val().split(",")
		
		var params = {}
		if (startDate) params.start_date =  new Date(startDate).getTime()
		if (endDate) params.end_date =  new Date(endDate).getTime()
		if (tags) params.tags =  tags
		
		var table = this.$el.find("#count-report")
		
		var events = new MyApp.Models.EventList()
		events.fetchMetadata(params)
			.success(function(data, status, xhr) {
				var count = xhr.getResponseHeader("X-Result-Count")
				$("<tr><td>" + escape(startDate) + "</td><td>" + escape(endDate) + "</td><td>" + escape(tags) + "</td><td>" + escape(count) + "</td></tr>").appendTo(table)
			})
		function escape(text) {return $("<div></div>").text(text).html()}
	}
})

MyApp.Views.EventTimespans = Backbone.View.extend({
	el: $("#event-timespans"),
	initialize: function() {
		_.bindAll(this, "getReport")
		
		$("#timespans-start-date,#timespans-end-date").datepicker()
		$("#timespans-leading-tag,#timespans-trailing-tag").select2({tags: []}).on("change", function() {
			var self = $(this)
			self.select2({tags: self.val().split(",")})
		})
	},
	events: {
		"click #get-event-timespans": "getReport"
	},
	getReport: function() {
		//the report calculates fastest/slowest/average timespans between the first two events w/ the leading tag in a period (or up until now, if there's only one event w/ the leading tag
		var startDate = $("#timespans-start-date").val()
		var endDate = $("#timespans-end-date").val()
		
		var params = {}
		if (startDate) params.start_date = new Date(startDate).getTime()
		if (endDate) params.end_date = new Date(endDate).getTime()
		params.tags = $("#timespans-leading-tag").val().split(",")
		
		var table = this.$el.find("#timespans-report")
		var leadingTimestamp
		
		var events = new MyApp.Models.EventList()
		events.fetch(params).success(getTrailingEvents)
		
		function getTrailingEvents(data) {
			var params = {}
			if (data[0]) leadingTimestamp = params.start_date = data[0].timestamp
			if (data[1]) params.end_date = data[1].timestamp
			params.tags = $("#timespans-trailing-tag").val().split(",")
			
			events.fetch(params).success(renderReport)
		}
		function renderReport(data) {
			var timespans = _(data).map(function(event) {return event.timestamp - leadingTimestamp}).sort()
			var fastest = timespans[0] || 0
			var slowest = timespans[timespans.length - 1] || 0
			var average = _(timespans).reduce(function(mem, n) {return mem + n}, 0) / timespans.length //avg = sum / count
			$("<tr><td>" + format(fastest) + " seconds</td><td>" + format(slowest) + " seconds</td><td>" + format(average) + " seconds</td></tr>").appendTo(table)
			
		}
		function format(n) {
			return (n / 1000).toFixed(2)
		}
	}
})

MyApp.Views.EventDiff = Backbone.View.extend({
	el: $("#event-diff"),
	initialize: function() {
		_.bindAll(this, "getReport")
		
		$("#diff-tags").select2({tags: []}).on("change", function() {
			var self = $(this)
			self.select2({tags: self.val().split(",")})
		})
	},
	events: {
		"click #get-event-diff": "getReport"
	},
	getReport: function() {
		var events = new MyApp.Models.EventList()
		var tags = $("#diff-tags").val().split(",")
		var reqs = _(tags).map(function(tag) {
			var params = {tags: [tag]}
			return events.fetch(params)
		})
		var container = this.$el.find("#diff-report")
		$.when.apply($, reqs).done(function() {
			var headerContainer = $("<div class='row-fluid'></div>").appendTo(container)
			var dataContainer = $("<div class='row-fluid'></div>").appendTo(container)
			var args = $.makeArray(arguments)
			_(args).each(function(arg, i) {
				var data = arg[0]
				var tag = tags[i]
				
				$("<h4 class='span2'></h4>").appendTo(headerContainer).text("Tagged: " + tag)
				var listContainer = $("<div class='span2'></div>").appendTo(dataContainer)
				var list = $("<ul></ul>").appendTo(listContainer)
				var blacklist = _(tags).without(tag)
				var filtered = _(data).filter(function(event) {
					return _(blacklist).intersection(event.tags).length == 0
				})
				_(filtered).each(function(event) {
					if (event.data && event.data.user) $("<li></li>").appendTo(list).text(event.data.user)
				})
			})
		})
	}
})

MyApp.Views.EventVolume = Backbone.View.extend({
	el: $("#event-volume"),
	initialize: function() {
		_.bindAll(this, "getReport")
		
		$("#volume-tags").select2({tags: []}).on("change", function() {
			var self = $(this)
			self.select2({tags: self.val().split(",")})
		})
	},
	events: {
		"click #get-event-volume": "getReport"
	},
	getReport: function() {
		var today = new Date()
		var yesterday = today.setDate(today.getDate() - 1)
		
		var params = {}
		params.start_date = yesterday
		params.end_date = new Date().getTime()
		params.tags = $("#volume-tags").val().split(",")
		
		var container = this.$el.find("#volume-report")
		var events = new MyApp.Models.EventList()
		events.fetch(params).success(function(data) {
			$("<div class='row-fluid'><h4 class='span12'>Tags: " + escape($("#volume-tags").val()) + "</h4></div>").appendTo(container)
			
			var chartContainer = $("<div class='row-fluid'></div>").appendTo(container).get(0)
			var counts = _(data).reduce(function(memory, event) {
				var index = new Date(event.timestamp).getHours()
				if (!memory[index]) memory[index] = 0
				memory[index]++
				return memory
			}, [])
			
			if (data.length > 0) renderChart(chartContainer, counts)
			else $("<p>No events with that tag were found within the last 24 hours</p>").appendTo(chartContainer)
		})
		
		function renderChart(container, data) {
			var width = 400
			var chart = d3.select(container).append("svg")
				.attr("class", "chart")
				.attr("width", width + 100)
				.attr("height", 20 * data.length + 20)
				.append("g")
					.attr("transform", "translate(80,10)")
			var x = d3.scale.linear()
				.domain([0, d3.max(data)])
				.range([0, width])
			var day = 60 * 60 * 1000
			var format = d3.time.format("%m/%d %H:%M")
			chart.selectAll("rect")
				.data(data)
				.enter().append("rect")
					.attr("width", x)
					.attr("height", 20)
					.attr("y", function(d, i) {return i * 20})
			chart.selectAll(".value")
				.data(data)
				.enter().append("text")
					.attr("class", "value")
					.attr("x", x)
					.attr("y", function(d, i) {return i * 20 + 10})
					.attr("dx", ".35em")
					.attr("dy", ".35em")
					.text(String)
			chart.selectAll(".label")
				.data(data.concat(null))
				.enter().append("text")
					.attr("class", "value")
					.attr("x", -5)
					.attr("y", function(d, i) {return i * 20})
					.attr("dx", "-.35em")
					.attr("dy", ".35em")
					.attr("text-anchor", "end")
					.text(function(d, i) {return format(new Date(yesterday + i * day))})
		}
		function escape(text) {return $("<div></div>").text(text).html()}
	}
})

new MyApp.Views.EventCount()
new MyApp.Views.EventTimespans()
new MyApp.Views.EventDiff()
new MyApp.Views.EventVolume()

