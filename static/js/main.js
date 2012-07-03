
var subscription;

$(document).ready(function() {
	subscription = new Subscription();
	$('#tags').select2({tags:[]}).bind('change', function() {
		subscription.set({ tags: $(this).val().split(',') });
	});
})