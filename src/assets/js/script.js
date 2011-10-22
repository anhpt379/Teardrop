$(function(){
	
	var dropbox = $('#dropbox'),
		message = $('.message', dropbox);
	
	dropbox.filedrop({
		// The name of the $_FILES entry:
		paramname:'pic',
		
		maxfiles: 15,
    	maxfilesize: 10,
		url: 'upload',
		
		uploadFinished:function(i,file,response){
			$.data(file).addClass('done');
			$.data(file).find('.progress').replaceWith("<input readonly onclick='this.focus();this.select()' value='http://share.soha.vn/i" + response.fid + ".png?width=800'>");
			$.data(file).find('.uploaded').replaceWith('' + 
			           '<a id="' + response.fid + '" class="popup" rel="popup" href="/p' + response.fid + '.png" target="_blank" title="' + response.fid + '"></a>' + 
                   '<div id="' + response.fid + '" class="hidden">' + 
                   + response.fid + '<br>' + 
                   '  <span>Size (width): </span>' + 
                   '  <a href="#">640px</a> | ' + 
                   '  <a href="#" class="active">800px</a> | ' + 
                   '  <a href="#">1024px</a> | ' + 
                   '  <a href="#">Original</a><br>' + 
                   '  <input readonly onclick="this.focus();this.select()" value="http://share.soha.vn/i' + response.fid + '.png?width=800"> ' + 
                  ' </div>');


      $("a[rel=popup]").fancybox({
            'titleShow'     : true,
            'titlePosition' : 'inside',
            'titleFormat'   : formatTitle,
            'transitionIn'  : 'elastic',
            'transitionOut' : 'elastic',
            'easingIn'      : 'easeOutBack',
            'easingOut'     : 'easeInBack',
            'overlayColor'  : '#000',
            'centerOnScroll': true,
            'minWidth'      : 250,
     //       'showCloseButton': false
        });
      
      // $('a#' + response.fid).trigger('click');
			// response is the JSON object that post_file.php returns
		},
		
    	error: function(err, file) {
			switch(err) {
				case 'BrowserNotSupported':
					showMessage('Your browser does not support HTML5 file uploads!');
					break;
				case 'TooManyFiles':
					alert('Too many files! Please select 5 at most! (configurable)');
					break;
				case 'FileTooLarge':
					alert(file.name+' is too large! Please upload files up to 2mb (configurable).');
					break;
				default:
					break;
			}
		},
		
		// Called before each upload is started
		beforeEach: function(file){
			if(!file.type.match(/^image\//)){
				alert('Only images are allowed!');
				
				// Returning false will cause the
				// file to be rejected
				return false;
			}
		},
		
		uploadStarted:function(i, file, len){
			createImage(file);
		},
		
		progressUpdated: function(i, file, progress) {
        $.data(file).find('.progress').width(progress);
		}
    	 
	});
	
	var template = '<div class="preview">'+
						'<span class="imageHolder">'+
							'<img />'+
							'<span class="uploaded"></span>'+
						'</span>'+
						'<div class="progressHolder">'+
							'<div class="progress"></div>'+
						'</div>'+
					'</div>'; 
	
	
	function createImage(file){

		var preview = $(template), 
			image = $('img', preview);
			
		var reader = new FileReader();
		
		image.width = 100;
		image.height = 100;
		
		reader.onload = function(e){
			
			// e.target.result holds the DataURL which
			// can be used as a source of the image:
			
			image.attr('src',e.target.result);
		};
		
		// Reading the file as a DataURL. When finished,
		// this will trigger the onload function above:
		reader.readAsDataURL(file);
		
		message.hide();
		preview.appendTo(dropbox);
		
		// Associating a preview container
		// with the file, using jQuery's $.data():
		
		$.data(file,preview);
	}

	function showMessage(msg){
		message.html(msg);
	}
	
	function formatTitle(title, currentArray, currentIndex, currentOpts) {
	  id = title;
    return $('div#' + id).html();
  }

  $("a[rel=popup]").fancybox({
        'titleShow'     : true,
        'titlePosition' : 'inside',
        'titleFormat'   : formatTitle,
        'transitionIn'  : 'elastic',
        'transitionOut' : 'elastic',
        'easingIn'      : 'easeOutBack',
        'easingOut'     : 'easeInBack',
        'overlayColor'  : '#000',
        'centerOnScroll': true,
        'minWidth'      : 250,
      //  'showCloseButton': false
    });


  $(document).ready(function() {
    $("html, body").animate({ scrollTop: $(document).height() }, 'slow');
  });
  
});