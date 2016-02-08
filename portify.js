function addscript(url){
	var script = document.createElement('script');
	script.src = url;
	script.type = 'text/javascript';
	document.getElementsByTagName('head')[0].appendChild(script);
}
function addstyle(url){
	var style = document.createElement('link');
	style.rel = 'stylesheet'
	style.href = url;
	style.type = 'text/css';
	document.getElementsByTagName('head')[0].appendChild(style);
}

function removejscssfile(filename, filetype){
    var targetelement=(filetype=="js")? "script" : (filetype=="css")? "link" : "none" //determine element type to create nodelist from
    var targetattr=(filetype=="js")? "src" : (filetype=="css")? "href" : "none" //determine corresponding attribute to test for
    var allsuspects=document.getElementsByTagName(targetelement)
    for (var i=allsuspects.length; i>=0; i--){ //search backwards within nodelist for matching elements to remove
    if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr).indexOf(filename)!=-1)
        allsuspects[i].parentNode.removeChild(allsuspects[i]) //remove element by calling parentNode.removeChild()
    }
}

addstyle("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css")
addscript('https://code.jquery.com/jquery-1.11.0.min.js');
setTimeout(function() {
		addscript('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js');
}, 500);
setTimeout(function() {
		addscript('https://cdnjs.cloudflare.com/ajax/libs/bootbox.js/4.4.0/bootbox.min.js');
}, 1000);

function newPlaylist(name){
	console.log(name);
	$('#new-playlist').click();
	$("paper-input[label='Name']").val(name);
	$("paper-button[data-action='save']").click();
	setTimeout(runPLPause, 1000);
}
function runPLPause(){
	window.RunPL = true;
}

function addSongToPlaylist(song, artist, playlist){
	$("button[name='add-duplicate-songs']").click();
	window.lastartist = window.currartist;
	window.currartist = artist;
	window.location='https://play.google.com/music/listen?u=0#/sr/' + encodeURIComponent(song + ' - ' + artist);
	setTimeout(function() {
		pollfornewsong(song, artist, playlist);
	}, 500);
	window.pollcount = 0;
}
function pollfornewsong(song, artist, playlist){
	window.pollcount = window.pollcount + 1;
	repoll = true;
	if($(".search-view:contains('" + artist + "')").length > 0){
		if($(".search-view:contains('" + song + "')").length > 0 || window.lastartist != window.currartist){
			addSongCallback(song, artist, playlist);
			repoll = false;
		} else {
			if (window.pollcount > 8){
				addSongCallback(song, artist, playlist);
				repoll = false;
			}
		}
	} else {
		if ($(".g-content:contains('No results found')").length && pollcount > 6){
			addSongCallback(song, artist, playlist);
			repoll = false
		} else{
			if (window.pollcount > 12){
				repoll = false
				addSongCallback(song, artist, playlist);
			}
		}
	}
	if (repoll == true){
		setTimeout(function() {
			pollfornewsong(song, artist, playlist);
		}, 500);
	}
}
function addSongCallback(song, artist, playlist){
	try{
		$("div.songlist-container").find("paper-icon-button[icon='more-vert']")[0].click();
		$("div.songlist-container").find("paper-icon-button[icon='more-vert']")[0].click();
		
		doclick($("div[class='goog-menuitem-content']:contains('Add to playlist')")[0]);
		doclick($("div.playlist-menu").find("div[role='menuitem']:contains('" + playlist + "')")[0]);
		//doclick() Click dupe confirm?
	} catch(err){
	}
	window.RunSong = true;
}

function doclick(el){
	var ev = document.createEvent("MouseEvent");
    ev.initMouseEvent(
        "mousedown",
        true /* bubble */, true /* cancelable */,
        window, null,
        el.x+10, el.y+10, 0, 0, /* coordinates */
        false, false, false, false, /* modifier keys */
        0 /*left*/, null
    );
	el.dispatchEvent(ev);

	var ev = document.createEvent("MouseEvent");
	ev.initMouseEvent(
		"mouseup",
		true /* bubble */, true /* cancelable */,
		window, null,
		el.x+10, el.y+10, 0, 0, /* coordinates */
		false, false, false, false, /* modifier keys */
		0 /*left*/, null
	);
	el.dispatchEvent(ev);
}
window.items = {};
function itemCB(resp, vardump, donecb){
	console.log(resp);
	console.log(vardump);
	window.resp = resp;
	if (window.items[vardump] == undefined){
		window.items[vardump] = [];
	}
	if (resp.tracks == undefined){
		ritems = resp.items;
		rnext = resp.next;
	} else {
		ritems = resp.tracks.items;
		rnext = resp.tracks.next;
	}
	window.items[vardump] = window.items[vardump].concat(ritems);
	if (rnext != undefined){
		getItems(rnext, vardump, donecb)
	} else {
		console.log(donecb);
		donecb(window.items[vardump]);
	}
}

function getItems(url, vardump, donecb) {
	$.ajax(url, {
		dataType: 'json',
		headers: {
			'Authorization': 'Bearer ' + spotifyoauth
		},
		success: function(r) {
			itemCB(r, vardump, donecb);
		},
		error: function(r) {
		}
	});
}

function gotPlaylists(playlists){
	window.plarray = [];
	window.returncount = 0;
	for (var i = 0; i < playlists.length; i++) {
		window.plarray.push(playlists[i]['name']);
		getItems(playlists[i]['href'], 'pl-' + playlists[i]['name'], plComplete);
	}
}

function plComplete(items){
	window.returncount = window.returncount + 1;
	if (window.plarray.length == window.returncount){
		doprompt();
	}
}
function doallplaylists(plobject){
	window.tlmake = [];
	window.plmake = []
	for (var i = 0; i < plobject.length; i++) {
		tracks = window.items['pl-' + plobject[i]];
		plname = '' + plobject[i]
		console.log(plobject[i]);
		console.log(tracks);
		window.plmake.push(plname);
		//newPlaylist(plname);
		for (var ib = 0; ib < tracks.length; ib++) {
			try{
				var artist = '';
				if (tracks[ib]['track']['artists'] != undefined){
					if (tracks[ib]['track']['artists'].length > 0){
						artist = tracks[ib]['track']['artists'][0]['name'];
					}
				}
				window.tlmake.push([tracks[ib]['track']['name'], artist, plname]);
			} catch(err){
			}
		}
	}
	startRunning();
}
function startRunning(){
	window.RunSong = false;
	window.RunPL = true;
	window.ticker=setInterval(tickLauncher,200);
}

function tickLauncher(){
	if (window.RunSong == true){
		window.RunSong = false;
		dosong = window.tlmake.shift()
		addSongToPlaylist(dosong[0], dosong[1], dosong[2]);
	}
	if (window.RunPL == true){
		window.RunPL = false;
		if (window.plmake.length > 0){
			newPlaylist(window.plmake.shift());
		} else {
			window.RunSong = true;
		}
	}
}

window.modalstage = 0;

function doprompt(){
	mds = window.modalstage;
	switch (mds) {
		case 0:
			bootbox.alert('Go --&gt <a target="_blank" href="https://developer.spotify.com/web-api/console/get-current-user-playlists/">HERE</a> &lt--. Click GET OAUTH TOKEN. Check the checkbox at the top. Then REQUEST TOKEN. Finally, copy the stuff in the OAuth Token text box to your clipboard and hit OK back over here.', doprompt);
			break;
		case 1:
			bootbox.prompt("Enter the OAUTH token here", function(result) {                
			  if (result === null) {                                             
				window.modalstage = 0;
			  } else {
				window.spotifyoauth = result;
				doprompt();
			  }
			});
			break;
		case 2:
			getItems('https://api.spotify.com/v1/me/playlists', 'playlists', gotPlaylists);
			break;
		case 3:
			bootbox.confirm({
				buttons: {
					confirm: {
						label: 'Yes',
						className: 'confirm-button-class'
					},
					cancel: {
						label: 'No',
						className: 'cancel-button-class'
					}
				},
				message: "Would you like to skip any of the " + window.plarray.length.toString() + " playlists?",
				callback: function(result) {
					if (result == false){
						window.modalstage = window.modalstage + 1;
					}
					window.plarrayFIX = window.plarray;
					window.plarrayNO = [];
					doprompt();
				}
			});
			break;
		case 4:
			if (window.plarray.length > 0){
				localcopy = window.plarray.shift();
				bootbox.confirm({
					buttons: {
						confirm: {
							label: 'Skip It',
							className: 'confirm-button-class'
						},
						cancel: {
							label: 'Copy It',
							className: 'cancel-button-class'
						}
					},
					message: "Skip " + localcopy + "?",
					callback: function(result) {
						if (result == false){
							window.plarrayFIX.push(localcopy);
						} else {
							window.plarrayNO.push(localcopy);
						}
						doprompt();
					}
				});
				if (window.plarray.length > 0){
					window.modalstage = window.modalstage - 1;
				}
			}
			break;
		case 5:
			window.plarray = window.plarrayFIX;
			bootbox.confirm("Confirm Transfer *This can take quite a while and is best setup overnight!*", function(result) {
				if (result == true){
					removejscssfile("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css", "css");
					removejscssfile('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js', "js");
					removejscssfile('https://cdnjs.cloudflare.com/ajax/libs/bootbox.js/4.4.0/bootbox.min.js', "js");
					doallplaylists(window.plarray);
				} else{
					location.reload();
				}
			});
			break;
	}
	window.modalstage = window.modalstage + 1;
}

function dospotimport(){
	doprompt();
}
setTimeout(dospotimport, 3000);