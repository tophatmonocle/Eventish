
var subscription;

$(document).ready(function() {
	subscription = new Subscription();
	
	if(localStorage) {
		$('#tags').val(localStorage.getItem('tags'));
	}
	
	$('#tags').select2({ tags:[] }).bind('change', function() {
		var tags = $(this).val().split(',');
		subscription.set({ tags: tags });
		if(localStorage) {
			localStorage.setItem('tags', tags);
		}
	});

})