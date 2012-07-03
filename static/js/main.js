
var subscription;

$(document).ready(function() {
	var tags = localStorage ? localStorage.getItem('tags').split(',') : [];
	subscription = new Subscription({ tags: tags });
	
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

})