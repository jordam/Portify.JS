//Portify.JS V0.07


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
	$('#new-playlist').click();
	$("paper-input.playlist-name").val(name);
	$("paper-button[data-action='save']").click();
	setTimeout(runPLPause, 1000);
}
function runPLPause(){
	window.plinfo['RunPL'] = true;
}

function addSongToPlaylist(search, playlist){
	$("button[name='add-duplicate-songs']").click();

	clearwaves();
	$("sj-search-box")[0].fire('query', {query: search});
	setTimeout(function() {
		pollfornewsong(playlist);
	}, 100);
	window.pollcount = 0;
	window.pollstart = new Date().getTime();
}
function pollfornewsong(playlist){
	window.pollcount = window.pollcount + 1;
	var repoll = true;
	if ($("paper-spinner:visible").length == 0){
		addSongCallback(playlist);
		repoll = false;
	}
	if (window.pollcount > 59 || ((new Date().getTime() - pollstart)/1000) > 6){
		repoll = false;
		addSongCallback(playlist);
	}
	if (repoll == true){
		setTimeout(function() {
			pollfornewsong(playlist);
		}, 500);
	}
}
function addSongCallback(playlist){
	try{
		$("div.songlist-container").find("paper-icon-button[icon='more-vert']")[0].click();
		$("div.songlist-container").find("paper-icon-button[icon='more-vert']")[0].click();

		doclick($("div[class='goog-menuitem-content']:contains('Add to playlist')")[0]);
		doclick($("div.playlist-menu").find("div[role='menuitem']:contains('" + playlist + "')")[0]);
		//doclick() Click dupe confirm?
	} catch(err){
	}
	window.plinfo['RunSong'] = true;
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

function loadpls(){
	for(i in window.plinfo['lists']){
		pl = window.plinfo['lists'][i];
		if (pl['loaded'] == false){
			switch (pl['mode']){
				case "link":
					loadPlByLink(pl);
					break;
			}
			return;
		}
	}
	startRunning();
}

function loadPlByLink(i){
	getItems(i['link'], i['link'], plComplete, []);
}

function plComplete(dat, pllink){
	for(i in window.plinfo['lists']){
		pl = window.plinfo['lists'][i];
		if (pl['link'] == pllink){
			pl['loaded'] = true;
			pl['tracks'] = dat;
		}
	}
	loadpls();
}

function getItems(url, donevar, donecb, build) {
	$.ajax(url, {
		dataType: 'json',
		headers: {
			'Authorization': 'Bearer ' + spotifyoauth
		},
		success: function(r) {
			itemCB(r, donevar, donecb, build);
		},
		error: function(r) {
			bootbox.alert('Spotify Error (most likely an invalid or expired oauth token.)', function() {
				blankscriptfiles();
			});
		}
	});
}


function itemCB(resp, donevar, donecb, build){
	if (resp.tracks == undefined){
		ritems = resp.items;
		rnext = resp.next;
	} else {
		ritems = resp.tracks.items;
		rnext = resp.tracks.next;
	}
	if (rnext != undefined){
		getItems(rnext, donevar, donecb, build.concat(ritems));
	} else {
		donecb(build.concat(ritems), donevar);
	}
}

function startRunning(){
	window.plinfo['RunSong'] = false;
	window.plinfo['RunPL'] = true;
	window.plinfo['ticker']=setInterval(tickLauncher,200);
}
function endPortifyRun(){
	var end = new Date().getTime();
	var time = end - window.portifystart;
	alert("Import Completed ");
	alert('Runtime: ' + time/1000);
	window.canImage = true;
	window.portifyWorking = false;
	clearInterval(window.plinfo['ticker']);
}
function tickLauncher(){
	if (window.plinfo['RunSong'] == true){
		window.plinfo['RunSong'] = false;
		if (window.plinfo['lists'].length){
			dosong = window.plinfo['lists'][0]['tracks'].shift();
			plname = window.plinfo['lists'][0]['name'];
			if (dosong === undefined){
				window.plinfo['lists'].shift();
				if (window.plinfo['lists'].length == 0){
					endPortifyRun();
				} else {
					window.plinfo['RunSong'] = true;
				}
			} else {
				if (window.plinfo['lists']['mode'] != 'string'){
					tname = dosong['track']['name'];
					if (dosong['track']['artists'] != undefined){
						if (dosong['track']['artists'].length > 0){
							addSongToPlaylist(tname+ ' - ' +dosong['track']['artists'][0]['name'], plname);
						} else {
							addSongToPlaylist(tname, plname);
						}
					} else {
						addSongToPlaylist(tname, plname);
					}
				}
			}
		}
	}
	if (window.plinfo['RunPL'] == true){
		window.plinfo['RunPL'] = false;
		for(i in window.plinfo['lists']){
			var plist = window.plinfo['lists'][i];
			if (plist['createdpl']  == false){
				plist['createdpl'] = true;
				plist['name'] = plist['prefix'] + plist['name'];
				plist['prefix'] = '';
				newPlaylist(plist['name']);
				return;
			}
		}
		window.plinfo['RunSong'] = true;
	}
}


function gotPlaylists(playlists, rstr){
	window.plinfo['mypls'] = playlists;
	window.returncount = 0;
	doprompt();
}

function confirmPlaylists(){
	for (var i = 0; i < window.plinfo['mypls'].length; i++) {
		newpl = {};
		newpl['name'] = window.plinfo['mypls'][i]['name'];
		newpl['mode'] = 'link';
		newpl['prefix'] = window.plinfo['prefix'];
		newpl['createdpl'] = false
		newpl['loaded'] = false;
		newpl['link'] = window.plinfo['mypls'][i]['href']
		window.plinfo['lists'].push(newpl);
	}
}


function playlistToggle(source) {
  checkboxes = document.getElementsByName('playlist');
  for (var i = 0; i < checkboxes.length; i++) {
    checkboxes[i].checked = source.checked;
  }
}

function initmodal(){ // Initial questions
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
						window.modalGo('MyPL', true);
					} else {
						window.modalGo('PlLink', true);
					}
				}
			});
			break;
	}
}

function PlLinkmodal(){ // Playlist from link
	mds = window.modalstage;
	switch (mds) {
		case 0:
			bootbox.prompt("Name the playlist", function(result) {
			  if (result === null || result == "") {
				window.location.reload();
			  } else {
				window.pllinkname = result
				newpl = {};
				newpl['name'] = result;
				newpl['mode'] = 'link';
				newpl['prefix'] = '';
				newpl['createdpl'] = false
				newpl['loaded'] = false;
				window.plinfo['lists'].push(newpl);
				doprompt();
			  }
			});
			break;
		case 1:
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
					window.returncount = 0;
					window.plinfo['lists'][0]['link'] = "https://api.spotify.com/v1/users/" + aaray[0] + "/playlists/" + aaray[1];
					window.modalGo('confirm', true);
					//window.plarray = [];
					//window.plarray.push(window.pllinkname);
					//window.plarrayFIX = window.plarray;
					//getItems("https://api.spotify.com/v1/users/" + aaray[0] + "/playlists/" + aaray[1], 'pl-' + window.pllinkname, plComplete);
				}
			  }
			});
			break;
	}
}

function MyPLmodal(){
	mds = window.modalstage;
	switch (mds){
		case 0:
			bootbox.prompt("Enter a prefix for your playlists like 'spotify-' (or leave blank to import them without altering their names)", function(result) {
			  if (result === null || result == "") {
				window.plinfo['prefix'] = "";
				doprompt();
			  } else {
				window.plinfo['prefix'] = result;
				doprompt();
			  }
			});
			break;
		case 1:
			window.plinfo['mypls'] = [];
			getItems('https://api.spotify.com/v1/me/playlists', 'gotpl', gotPlaylists, []);
			break;
		case 2:
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
				message: "I see " + window.plinfo['mypls'].length.toString() + " playlists.<br>Do you want to pick which playlists to import or would you rather import everything?",
				callback: function(result) {
					if (result == false){
						window.modalGo('confirm', false);
						window.confirmPlaylists();
						//window.plarrayFIX = window.plarray;
					}
					else{
						//window.plarrayFIX = [];
					}
					//window.plarrayNO = [];
					doprompt();
				}
			});
			break;
		case 3:
			if (window.plinfo['mypls'].length > 0){
				var playlist = $('<div>',{style:"height:300px;overflow:scroll;"});
				var div = $("<div>", {class:"checkbox"})
				var label = $("<label>",{for:"plToggle"});
				var input = $("<input>", {name:"plToggle", id:"plToggle", onclick:"playlistToggle(this);", type:"checkbox", checked:"checked"});
				label.append(input).append('[Check/Uncheck All]');
				div.append(label);
				playlist.append(div);
				for(i in window.plinfo['mypls']){
					var div = $("<div>", {class:"checkbox"})
					var label = $("<label>",{for:"playlist-"+i});
					var input = $("<input>", {name:"playlist", id:"playlist-"+i, value:window.plinfo['mypls'][i]['name'], type:"checkbox", checked:"checked"});
					label.append(input).append(''+window.plinfo['mypls'][i]['name']);
					div.append(label);
					playlist.append(div);
				}
				bootbox.dialog({
					title: "Select Playlist to Include",
					message: playlist.prop('outerHTML'),
					buttons: {
						cancel: {
							label: 'Back',
							className: 'cancel-button-class',
							callback: function () {
								window.modalstage = window.modalstage - 2;
								doprompt();
							}
						},
						confirm: {
							label: 'Go',
							className: 'confirm-button-class',
							callback: function () {
								mypls = window.plinfo['mypls']
								newpls = [];
								$("input[name='playlist']:checked").each(function(){
									for (i in mypls){
										if (mypls[i]['name'] == $(this).val()){
											newpls.push(mypls[i]);
										}
									}
								});
								window.plinfo['mypls'] = newpls;
								window.confirmPlaylists();
								window.modalGo('confirm', true);
							}
						}
					}
				});
			}
			break;
	
	}
}

function confirmmodal(){ // Confirm run
	bootbox.confirm("This can take quite a while, are you sure your ready?", function(result) {
		if (result == true){
			blankscriptfiles();
			window.portifystart = new Date().getTime();
			window.loadpls();
		} else{
			window.location.reload();
		}
	});
}

function modalGo(type, doprompts){
	window.modalstage = 0;
	window.modalmode = type;
	if (doprompts === true){
		doprompt();
	}
}

function doprompt(){
	mds = window.modalstage;
	mdm = window.modalmode;
	switch (mdm){
		case "init":
			initmodal();
			break;
		case "PlLink":
			PlLinkmodal();
			break;
		case "MyPL":
			MyPLmodal();
			break;
		case "confirm":
			confirmmodal();
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
function setupPlInfo(){
	window.plinfo = {};
	window.plinfo['lists'] = [];
	window.plinfo['prefix'] = "";
}
function portifyjs(mstage){
	window.loadstep = 0;
	window.modalstage = mstage;
	window.modalmode = "init";
	window.items = {};
	setupPlInfo();
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