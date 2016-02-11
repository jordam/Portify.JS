//Portify.JS V0.05
function addscript(url, cbname){
	var script = document.createElement('script');
	script.src = url;
	script.type = 'text/javascript';
	script.onload =function(){cbname()};
	document.getElementsByTagName('head')[0].appendChild(script);
}
function addstyle(url){
	var style = document.createElement('link');
	style.rel = 'stylesheet';
	style.href = url;
	style.type = 'text/css';
	document.getElementsByTagName('head')[0].appendChild(style);
}

function removejscssfile(filename, filetype){
    var targetelement=(filetype=="js")? "script" : (filetype=="css")? "link" : "none"; //determine element type to create nodelist from
    var targetattr=(filetype=="js")? "src" : (filetype=="css")? "href" : "none" ; //determine corresponding attribute to test for
    var allsuspects=document.getElementsByTagName(targetelement);
    for (var i=allsuspects.length; i>=0; i--){ //search backwards within nodelist for matching elements to remove
		if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr).indexOf(filename)!=-1){
			allsuspects[i].parentNode.removeChild(allsuspects[i]); //remove element by calling parentNode.removeChild()
		}
	}
}

function doloadstep(){
	switch (window.loadstep) {
		case 0:
			addstyle("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css");
			addscript('https://code.jquery.com/jquery-1.11.0.min.js', doloadstep);
			break;
		case 1:
			addscript('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js', doloadstep);
			$.extend($.expr[":"], {
			  "containsNC": function(elem, i, match, array) {
				return (elem.textContent || elem.innerText || "").toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
			  }
			});
			break;
		case 2:
			addscript('https://cdnjs.cloudflare.com/ajax/libs/bootbox.js/4.4.0/bootbox.min.js', dospotimport);
			break;
	}
	window.loadstep = window.loadstep + 1;
}


function newPlaylist(name){
	console.log(name);
	$('#new-playlist').click();
	$("paper-input.playlist-name").val(name);
	$("paper-button[data-action='save']").click();
	setTimeout(runPLPause, 1000);
}
function runPLPause(){
	window.RunPL = true;
}

function addSongToPlaylist(song, artist, playlist){
	$("button[name='add-duplicate-songs']").click();

	clearwaves();
	window.lastartist = window.currartist;
	window.currartist = artist;
	$("sj-search-box")[0].fire('query', {query: song + ' - ' + artist});
	// Old school //window.location='https://play.google.com/music/listen?u=0#/sr/' + encodeURIComponent(song + ' - ' + artist);
	setTimeout(function() {
		pollfornewsong(song, artist, playlist);
	}, 100);
	window.pollcount = 0;
	window.pollstart = new Date().getTime();
}
function pollfornewsong(song, artist, playlist){
	window.pollcount = window.pollcount + 1;
	var repoll = true;
	if ($("paper-spinner:visible").length == 0){
		addSongCallback(song, artist, playlist);
		repoll = false;
	}
	if (window.pollcount > 59 || ((new Date().getTime() - pollstart)/1000) > 6){
		repoll = false;
		addSongCallback(song, artist, playlist);
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
		getItems(rnext, vardump, donecb);
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
			bootbox.alert('Spotify Error (most likely an invalid or expired oauth token.)', function() {
				blankscriptfiles();
			});
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
	window.plmake = [];
	for (var i = 0; i < plobject.length; i++) {
		tracks = window.items['pl-' + plobject[i]];
		plname = window.plprefix + plobject[i];
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
		dosong = window.tlmake.shift();
		if (dosong === undefined){
			var end = new Date().getTime();
			var time = end - window.portifystart;
			alert("Import Completed ");
			alert('Runtime: ' + time/1000);
			window.canImage = true;
			window.portifyWorking = false;
			clearInterval(window.ticker);
		} else {
		addSongToPlaylist(dosong[0], dosong[1], dosong[2]);
		}
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

function playlistToggle(source) {
  checkboxes = document.getElementsByName('playlist');
  for (var i = 0; i < checkboxes.length; i++) {
    checkboxes[i].checked = source.checked;
  }
}

function doprompt(){
	mds = window.modalstage;
	switch (mds) {
		case 0:
			if (window.location.hostname.indexOf('play.google.com') === -1){
			bootbox.alert('This is supposed to be ran over on the google music player', function() {
			blankscriptfiles();
			});
			} else {
				bootbox.alert('Go --&gt <a target="_blank" href="https://developer.spotify.com/web-api/console/get-current-user-playlists/">HERE</a> &lt--. Click GET OAUTH TOKEN. Check the checkbox at the top. Then REQUEST TOKEN. Finally, copy the stuff in the OAuth Token text box to your clipboard and hit OK back over here.', doprompt);
			}
			break;
		case 1:
			bootbox.prompt("Enter the OAUTH token here", function(result) {
			  if (result === null) {
				window.location.reload();
			  } else {
				window.spotifyoauth = result;
				doprompt();
			  }
			});
			break;
		case 2:

			bootbox.confirm({
				buttons: {
					confirm: {
						label: 'My Spotify Playlists',
						className: 'confirm-button-class'
					},
					cancel: {
						label: 'A Spotify Playlist Link',
						className: 'cancel-button-class'
					}
				},
				message: "What are you importing today?",
				callback: function(result) {
					if (result == true){
						window.modalstage = window.modalstage + 2;
					}
					doprompt();
				}
			});
			break;
		case 3:
			window.plprefix = "";
			bootbox.prompt("Name the playlist", function(result) {
			  if (result === null || result == "") {
				window.location.reload();
			  } else {
				window.pllinkname = result;
				doprompt();
			  }
			});
			break;
		case 4:
			bootbox.prompt("Paste the link in here", function(result) {
			  if (result === null) {
				window.location.reload();
			  } else {
				var res = result.split("/");
				var atog = false;
				var aaray = [];
				for(var ssplit in res){
					if (atog == true){
						aaray.push(res[ssplit]);
						atog = false;
					}
					if (res[ssplit] == 'user' || res[ssplit] == 'playlist'){
						atog = true;
					}
				}
				if(aaray.length == 2){
					window.modalstage = window.modalstage + 4; // Skip to 9 next
					window.returncount = 0;
					window.plarray = [];
					window.plarray.push(window.pllinkname);
					window.plarrayFIX = window.plarray;
					getItems("https://api.spotify.com/v1/users/" + aaray[0] + "/playlists/" + aaray[1], 'pl-' + window.pllinkname, plComplete);
				}
			  }
			});
			break;
		case 5: //Different route to get here
			bootbox.prompt("Enter a prefix for your playlists like 'spotify-' (or leave blank to import them without altering their names)", function(result) {
			  if (result === null || result == "") {
				window.plprefix = "";
				doprompt();
			  } else {
				window.plprefix = result;
				doprompt();
			  }
			});
			break;
		case 6:
			getItems('https://api.spotify.com/v1/me/playlists', 'playlists', gotPlaylists);
			break;
		case 7:
			bootbox.confirm({
				buttons: {
					confirm: {
						label: 'Pick Playlists',
						className: 'confirm-button-class'
					},
					cancel: {
						label: 'Import Everything',
						className: 'cancel-button-class'
					}
				},
				message: "I see " + window.plarray.length.toString() + " playlists.<br>Do you want to pick which playlists to import or would you rather import everything?",
				callback: function(result) {
					if (result == false){
						window.modalstage = window.modalstage + 1;
						window.plarrayFIX = window.plarray;
					}
					else{
						window.plarrayFIX = [];
					}
					window.plarrayNO = [];
					doprompt();
				}
			});
			break;
		case 8:
			if (window.plarray.length > 0){
				var playlist = $('<div>',{style:"height:300px;overflow:scroll;"});
				var div = $("<div>", {class:"checkbox"})
				var label = $("<label>",{for:"plToggle"});
				var input = $("<input>", {name:"plToggle", id:"plToggle", onclick:"playlistToggle(this);", type:"checkbox", checked:"checked"});
				label.append(input).append('[Check/Uncheck All]');
				div.append(label);
				playlist.append(div);
				for(i in window.plarray){
					var div = $("<div>", {class:"checkbox"})
					var label = $("<label>",{for:"playlist-"+i});
					var input = $("<input>", {name:"playlist", id:"playlist-"+i, value:window.plarray[i], type:"checkbox", checked:"checked"});
					label.append(input).append(''+window.plarray[i]);
					div.append(label);
					playlist.append(div);
				}
				console.log("playlist built"+playlist.length);
				bootbox.dialog({
					title: "Select Playlist to Include",
					message: playlist.prop('outerHTML'),
					buttons: {
						cancel: {
							label: 'Back',
							className: 'cancel-button-class',
							callback: function () {
								window.modalstage = window.modalstage - 1;
								doprompt();
							}
						},
						confirm: {
							label: 'Go',
							className: 'confirm-button-class',
							callback: function () {
								window.plarrayFIX = [];
								$("input[name='playlist']:checked").each(function(){
									window.plarrayFIX.push($(this).val());
								});
								doprompt()
							}
						}
					}
				});
			}
			break;
		case 9:
			window.plarray = window.plarrayFIX;
			bootbox.confirm("This can take quite a while, are you sure your ready?", function(result) {
				if (result == true){
					blankscriptfiles();
					window.portifystart = new Date().getTime();
					doallplaylists(window.plarray);
				} else{
					window.location.reload();
				}
			});
			break;
	}
	window.modalstage = window.modalstage + 1;
}
function blankscriptfiles(){
	removejscssfile("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css", "css");
	removejscssfile('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js', "js");
	removejscssfile('https://cdnjs.cloudflare.com/ajax/libs/bootbox.js/4.4.0/bootbox.min.js', "js");
}

function clearwaves(){
	x = $("div.wave-container").parent().parent()[0];
	if (x !== undefined){
		rl = x.ripples.length;
		for (var i = 0; i < rl; i++) {
			x.removeRipple(x.ripples[0]);
		}
	}
}

function deleteMatchingPlaylists(search){ // Used to undo my test playlists. Will delete all playlists containing the search string
	$('a:contains(' + search + ')').each(function( index ) {
		$(this).find('paper-icon-button').first().click()
		doclick($("div[class='goog-menuitem-content']:contains('Delete playlist')")[0])
		$('button:contains(Delete playlist)').click()
	});
}

function dospotimport(){
	window.canImage = false;
	doprompt();
}
// Need to figure out how to inject
// DP=function(a,b,c,e){var localtxt = (BP(b(c||CP,void 0,e)));var re = /src=/g;var result = localtxt.replace(re, 'nosrc=');a.innerHTML=result;}
// Into the scope of listen.js
function portifyjs(mstage){
	window.loadstep = 0;
	window.modalstage = mstage;
	window.items = {};
	doloadstep();
}
if (window.portifyWorking != true){
	if (window.location.host == "play.google.com"){
		window.portifyWorking = true;
		if (window.spotifyoauth === undefined){
			portifyjs(0);
		} else {
			portifyjs(2)
		}
	} else {
		window.location = "https://play.google.com/music/listen";
	}
}