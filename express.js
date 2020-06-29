// Portify.JS Express Chainloader
// Should complete all steps needed to load portify.js
// Also mutates the google listen.js file to selectively block images

window.portifyURL = 'https://rawgit.com/jordam/Portify.JS/master';

function insertBeforeLastOccurrence(strToSearch, strToFind, strToInsert) {
    var n = strToSearch.lastIndexOf(strToFind);
    if (n < 0) return strToSearch;
    return strToSearch.substring(0,n) + strToInsert + strToSearch.substring(n);    
}

function addscript(url, cbname){
	var script = document.createElement('script');
	script.src = url;
	script.type = 'text/javascript';
	script.onload =function(){cbname()};
	document.getElementsByTagName('head')[0].appendChild(script);
}
if ((document.readyState == 'complete' || document.readyState == 'interactive') && window.portifyExpress != true){
	window.portifyExpress = true;
	if (window.jQuery === undefined){
		addscript('https://code.jquery.com/jquery-1.11.0.min.js', locationmapper);
	} else {
		locationmapper();
	}
} else {
	if (window.canImage === true){
		   addstyle("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css");
		   window.modalstage = 2;
		   dospotimport();
	}
}

function locationmapper(){
	if (window.location.pathname == "/music/listen" && window.QueryString && window.QueryString.spotifyoauth) {
		gplayTakeover();
	}
	else if (window.location.pathname == "/console/get-current-user-playlists/") {
		spotifyCode();
	}
	else {
		window.location = "https://developer.spotify.com/console/get-current-user-playlists/";
	}
}

function doScopeSelect(){
	var scopes = ['#scope-playlist-read-private', '#scope-user-library-modify', '#scope-playlist-modify-private', '#scope-user-library-read', '#scope-playlist-modify-public'];
	for (i in scopes){
		if (! document.querySelector(scopes[i]).checked){document.querySelector(scopes[i]).click(); };
	}
}

function clickGetToken(){
	localStorage.setItem('portifyTime', new Date().getTime().toString());
	document.querySelector('.btn-green').click()
	window.setTimeout(function(){
		doScopeSelect()
		window.setTimeout(function(){
			document.querySelector('#oauthRequestToken').click();
		}, 750);
	}, 750);
}

function spotifyCode(){
	if (window.location.pathname.indexOf('authorize') == -1){
		if (document.querySelector('#oauth-input').value.length > 0){
			var lasttime = localStorage.getItem('portifyTime');
			var coclick = false;
			if (lasttime === null){
				clickGetToken();
				coclick = true;
			} else {
				if ((new Date().getTime() - parseInt(lasttime))/1000 > 3600){
					clickGetToken();
					coclick = true;
				}
				else{
					goToGoogle(document.querySelector('#oauth-input').value);
				}
			}
		} else { // no oauth listed
			clickGetToken();
		}
	} else {
		document.querySelector('#auth-accept').click();
	}
}

function goToGoogle(oauth){
	window.location = "https://play.google.com/music/listen?spotifyoauth=" + oauth;
}

function gplayTakeover(){
	window.spotifyoauth = window.QueryString.spotifyoauth;

    jQuery.getScript(window.portifyURL + "/portify.js");
}

window.mutateInput = function(input){
	if (window.canImage !=  true){
		var re = /src=/g;
		return input.replace(re, 'nosrc=');
	} else{
		return input;
	}
}

window.QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  } 
    return query_string;
}();