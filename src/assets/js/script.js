$(function(){
	
	var dropbox = $('#dropbox'),
		message = $('.message', dropbox);
	
	dropbox.filedrop({
		// The name of the $_FILES entry:
		paramname:'pic',
		
		maxfiles: 15,
    	maxfilesize: 10,
		url: 'upload',
		drop: function() {	// scroll to bottom
		    $("html, body").animate({ scrollTop: $(document).height() }, 'slow');  
		},
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
	

    	var template = '<div class="preview">' 
    	    + '<span class="imageHolder">'
    	      + '<img />'
	      + '<span class="uploaded"></span>'
	    + '</span>'
	    + '<div class="progressHolder">' 
	      + '<div class="progress"></div>'
	      + '</div>' 
	  + '</div>'; 
	
	
	function createImage(file){

		var preview = $(template), 
		    image = $('img', preview);
			
		var reader = new FileReader();
				
		reader.onload = function(e){
			
			// e.target.result holds the DataURL which
			// can be used as a source of the image:
			
			image.attr('src',e.target.result)
			     .one('load', function() { //fires (only once) when loaded
				 var w = $(this).width();
				 var h = $(this).height();
				 var tw = $(this).parent().width();
				 var th = $(this).parent().height();
				 
				 // compute the new size and offsets
				 var result = ScaleImage(w, h, tw, th, false);

				 // adjust the image coordinates and size
				 $(this).css("left", result.targetleft);
				 $(this).css("top", result.targettop);
				    
				 if (w > h) {
					$(this).css('height', '200px');
				 } else {
					$(this).css('width', '200px');
				 }
			     });
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
  
  // Zoom and crop image (make thumbnail)
  function ScaleImage(srcwidth, srcheight, targetwidth, targetheight, fLetterBox) {

      var result = { width: 0, height: 0, fScaleToTargetWidth: true };

      if ((srcwidth <= 0) || (srcheight <= 0) || (targetwidth <= 0) || (targetheight <= 0)) {
          return result;
      }

      // scale to the target width
      var scaleX1 = targetwidth;
      var scaleY1 = (srcheight * targetwidth) / srcwidth;

      // scale to the target height
      var scaleX2 = (srcwidth * targetheight) / srcheight;
      var scaleY2 = targetheight;

      // now figure out which one we should use
      var fScaleOnWidth = (scaleX2 > targetwidth);
      if (fScaleOnWidth) {
          fScaleOnWidth = fLetterBox;
      }
      else {
         fScaleOnWidth = !fLetterBox;
      }

      if (fScaleOnWidth) {
          result.width = Math.floor(scaleX1);
          result.height = Math.floor(scaleY1);
          result.fScaleToTargetWidth = true;
      }
      else {
          result.width = Math.floor(scaleX2);
          result.height = Math.floor(scaleY2);
          result.fScaleToTargetWidth = false;
      }
      result.targetleft = Math.floor((targetwidth - result.width) / 2);
      result.targettop = Math.floor((targetheight - result.height) / 2);

      return result;
  }
  
  // Confirm dialog the Fancybox way
  
  function fancyConfirm(msg,callback) {
      var ret;
      jQuery.fancybox({
          modal : true,
          content : "<div class='confirm'>" 
              	    + '<i class="alert"></i>'
                    + msg 
                    + '<div class="actions"><input class="fancyConfirm_cancel" type="button" value="Cancel">' 
                    + '<input class="fancyConfirm_ok" type="button" value="Delete">' 
                    + '</div></div>',
          onComplete : function() {
              jQuery(".fancyConfirm_cancel").click(function() {
                  ret = false; 
                  jQuery.fancybox.close();
              })
              jQuery(".fancyConfirm_ok").click(function() {
                  ret = true; 
                  jQuery.fancybox.close();
              })
          },
          onClosed : function() {
              //callback.call(this,ret);
          },
          'padding': 5,
          'transitionIn'  : 'elastic',
          'transitionOut' : 'elastic',
          'easingIn'      : 'easeOutBack',
          'easingOut'     : 'easeInBack',
          'overlayColor'  : '#000',
          'centerOnScroll': true,
      });
  }
  

  // Load on ready
  $(document).ready(function() {
    $("html, body").animate({ scrollTop: $(document).height() }, 'slow');
    
    $('.preview').live('mouseover mouseout', function(e) {
	if (e.type == 'mouseover') {
		$('a.remove', this).show();
	} else {
	    	$('a.remove', this).hide();
	}
    });
    
    $('a.remove').live('click', function() {
	var fid = $(this).attr('fid');
	var filename = $(this).attr('filename');
	//fancyConfirm('Remove this image?', null)
	fancyConfirm('<h3>Are you sure you want to delete "' + filename + '"?<h3><p>This item will be deleted immediately. You can\'t undo this action.</p>');
	return false;
    });
  });
  
});