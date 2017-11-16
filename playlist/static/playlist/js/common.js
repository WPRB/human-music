// common.js

// This comes straight from the docs, needed for post-forms 
// Check https://docs.djangoproject.com/en/1.11/ref/csrf/
//------------------------------------------------------------------

/** 
 * Return a cookie by name
 */
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Check if a given HTTP method is exempt from csrf protection
 */
function csrfSafeMethod(method) {
   // these HTTP methods do not require CSRF protection
   return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

console.log('common included');

//----------------------------------------------------------------------

// function invalidFormException(message) {
// 	return {
// 		name: "Invalid Form Error",
// 		message: message
// 	}
// };