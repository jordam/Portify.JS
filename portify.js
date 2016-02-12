//Portify.JS V0.07


function addscript(url, cbname){  //Inject a javascript script into the dom
	var script = document.createElement('script');
	script.src = url;
	script.type = 'text/javascript';
	script.onload =function(){cbname()};
	document.getElementsByTagName('head')[0].appendChild(script);
}
function addstyle(url){ //Inject a css stylesheet into the dom
	var style = document.createElement('link');
	style.rel = 'stylesheet';
	style.href = url;
	style.type = 'text/css';
	document.getElementsByTagName('head')[0].appendChild(style);
}

function removejscssfile(filename, filetype){ //Remove a javascript or css element from the dom
    var targetelement=(filetype=="js")? "script" : (filetype=="css")? "link" : "none"; //determine element type to create nodelist from
    var targetattr=(filetype=="js")? "src" : (filetype=="css")? "href" : "none" ; //determine corresponding attribute to test for
    var allsuspects=document.getElementsByTagName(targetelement);
    for (var i=allsuspects.length; i>=0; i--){ //search backwards within nodelist for matching elements to remove
		if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr).indexOf(filename)!=-1){
			allsuspects[i].parentNode.removeChild(allsuspects[i]); //remove element by calling parentNode.removeChild()
		}
	}
}

function doclick(el){ // Fake a click on an element the fancy way
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

function doloadstep(){ // Load in the required libraries in the proper order
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


function newPlaylist(name){ // Create new playlist by name.
	$('#new-playlist').click();
	$("paper-input.playlist-name").val(name);
	$("paper-button[data-action='save']").click();
	setTimeout(runPLPause, 1000);
}
function runPLPause(){ // Indicates that we can create the next playlist
	window.plinfo['RunPL'] = true;
}

function addSongToPlaylist(search, playlist){ // Add a song to a playlist. Fires a search query and sets up pollfornewsong to poll for the search to complete
	$("button[name='add-duplicate-songs']").click();

	clearwaves();
	$("sj-search-box")[0].fire('query', {query: search});
	setTimeout(function() {
		pollfornewsong(playlist);
	}, 100);
	window.pollcount = 0;
	window.pollstart = new Date().getTime();
}
function pollfornewsong(playlist){ // Check if search has completed, call addSongCallback when it has
	window.pollcount = window.pollcount + 1; // Add one to the poll count (used to timeout)
	var repoll = true;
	if ($("paper-spinner:visible").length == 0){ // If our loading spinner not visible
		addSongCallback(playlist); //Run the next step in the automation, clicking the song and adding it to the playlist
		repoll = false; // Dont recheck anymore
	}
	if (window.pollcount > 59 || ((new Date().getTime() - pollstart)/1000) > 6){ //If we have waited too long
		repoll = false; //Dont recheck
		addSongCallback(playlist); //Try with whats on the page now
	}
	if (repoll == true){ // If we need to recheck
		setTimeout(function() { //Recheck in a half sec
			pollfornewsong(playlist);
		}, 500);
	}
}
function addSongCallback(playlist){ // Add the first song in a songlist-container on the page to a playlist
	try{
		$("div.songlist-container").find("paper-icon-button[icon='more-vert']")[0].click(); //Click the more button on the song
		$("div.songlist-container").find("paper-icon-button[icon='more-vert']")[0].click(); //Run twice to fix buggyness
		doclick($("div[class='goog-menuitem-content']:contains('Add to playlist')")[0]);    //Click add to playlist on the submenu
		doclick($("div.playlist-menu").find("div[role='menuitem']:contains('" + playlist + "')")[0]); //Click on the playlist that it needs to add to
	} catch(err){
	}
	window.plinfo['RunSong'] = true; // Run the next song
}

function loadpls(){ // Grabs a playlist from plinfo['lists'] and loads the tracks for it. Runs startRunning() if all playlists have been loaded.
	for(i in window.plinfo['lists']){ // Check our playlist list
		pl = window.plinfo['lists'][i];
		if (pl['loaded'] == false){ //If a playlist has not had its tracks loaded
			switch (pl['mode']){ //Check its mode
				case "link": //If its a link type playlist
					loadPlByLink(pl); //Load the tracks for the playlist
					break;
			}
			return; //Drop out of loadpls
		}
	}
	startRunning(); //If all playlists are loaded, startRunning the automation
}

function loadPlByLink(i){ // Load a playlist by its url
	getItems(i['link'], i['link'], plComplete, []);
}

function plComplete(dat, pllink){ // Called when a url loaded playlist has completed loading. Will set the tracks on the proper object in plinfo['lists'] and rerun loadpls()
	for(i in window.plinfo['lists']){
		pl = window.plinfo['lists'][i];
		if (pl['link'] == pllink){
			pl['loaded'] = true;
			pl['tracks'] = dat;
		}
	}
	loadpls();
}

function getItems(url, donevar, donecb, build) { // Load in items from a spotify api endpoint. Automatically follows next links, compiles data, and pushes donecb(data, donevar) in the end
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


function itemCB(resp, donevar, donecb, build){ // Callback for getItems. Gets data from spotify response, parses, and loads next or goes to donecb depending on response.
	if (resp.tracks == undefined){ // If we dont have tracks
		ritems = resp.items; //We want the .items property
		rnext = resp.next;
	} else { //If we have a tracks property
		ritems = resp.tracks.items; //We want the .tracks.items property
		rnext = resp.tracks.next;
	}
	if (rnext != undefined){ // If we have a next link
		getItems(rnext, donevar, donecb, build.concat(ritems)); //Pull in more items
	} else { //If we dont have a next link
		donecb(build.concat(ritems), donevar); //We are done, call callback
	}
}

function startRunning(){ // Kicks off the timer that manages the actuall import process and starts importing
	window.plinfo['RunSong'] = false;
	window.plinfo['RunPL'] = true;
	window.plinfo['ticker']=setInterval(tickLauncher,200);
}
function endPortifyRun(){ // Shown to the user on completion. Simple stats and reset code.
	var end = new Date().getTime();
	var time = end - window.portifystart;
	alert("Import Completed ");
	alert('Runtime: ' + time/1000);
	window.canImage = true;
	window.portifyWorking = false;
	clearInterval(window.plinfo['ticker']);
}
function tickLauncher(){ // This function is called regularly on a timer to kick off playlist and song operations. It handles the state of the import process and what is happening moment to moment
	if (window.plinfo['RunSong'] == true){ // If we set to run song automation
		window.plinfo['RunSong'] = false; // We have handled the request, set it to false to mark that
		if (window.plinfo['lists'].length){ // If we have playlists that have not completed
			dosong = window.plinfo['lists'][0]['tracks'].shift(); // Grab a song from the playlist we are working on
			plname = window.plinfo['lists'][0]['name'];
			if (dosong === undefined){ //If our playlist didnt have any songs left to do
				window.plinfo['lists'].shift(); // Delete the playlist from the list
				if (window.plinfo['lists'].length == 0){ // If the list is blank now
					endPortifyRun(); // We are done
				} else { // If the list is not blank
					window.plinfo['RunSong'] = true; // Run the next song
				}
			} else { // If our playlist had songs
				if (window.plinfo['lists']['mode'] != 'string'){ //Check the mode the playlist is set to. string mode is a special mode in development so if the mode is not string
					tname = dosong['track']['name']; 
					if (dosong['track']['artists'] != undefined){ //If we have an artist for the track we are working on
						if (dosong['track']['artists'].length > 0){
							addSongToPlaylist(tname+ ' - ' +dosong['track']['artists'][0]['name'], plname); // Run the automation to add the song to the playlist. Has artist name included
						} else {
							addSongToPlaylist(tname, plname);
						}
					} else { // No artist on the track
						addSongToPlaylist(tname, plname); //Run add song automation, no artist though.
					}
				}
			}
		}
	}
	if (window.plinfo['RunPL'] == true){// If we are set to run playlist automation
		window.plinfo['RunPL'] = false; // We have handled the request, set it to false to mark that
		for(i in window.plinfo['lists']){ //Check the playlists
			var plist = window.plinfo['lists'][i];
			if (plist['createdpl']  == false){ //If a playlist has not been created
				plist['createdpl'] = true; //Say we are handling it
				plist['name'] = plist['prefix'] + plist['name']; //Update the name based on the prefix
				plist['prefix'] = ''; //Blank the prefix as we have handled it
				newPlaylist(plist['name']); // Run the automation to create a new playlist
				return; // Drop out of this tick
			}
		}
		window.plinfo['RunSong'] = true; //All playlists have been created, run songs now.
	}
}


function gotPlaylists(playlists, rstr){ // Callback for when users personal playlists are loaded
	window.plinfo['mypls'] = playlists;
	doprompt();
}

function confirmPlaylists(){ // Used to copy the playlists from mypls into the lists array in the proper format. Called once playlist selection is confirmed.
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


function playlistToggle(source) { // Toggle all checkboxes on the playlist selection dialog
  checkboxes = document.getElementsByName('playlist');
  for (var i = 0; i < checkboxes.length; i++) {
    checkboxes[i].checked = source.checked;
  }
}

function initmodal(){ // Initial questions
	mds = window.modalstage;
	switch (mds) {
		case 0: // Oauth token instructions
			bootbox.alert('Go --&gt <a target="_blank" href="https://developer.spotify.com/web-api/console/get-current-user-playlists/">HERE</a> &lt--. Click GET OAUTH TOKEN. Check the checkbox at the top. Then REQUEST TOKEN. Finally, copy the stuff in the OAuth Token text box to your clipboard and hit OK back over here.', doprompt);
			break;
		case 1: // Oauth token input page
			bootbox.prompt("Enter the OAUTH token here", function(result) {
			  if (result === null) {
				window.location.reload();
			  } else {
				window.spotifyoauth = result;
				doprompt();
			  }
			});
			break;
		case 2: // What are you importing?
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
						// Importing my playlists
						window.modalGo('MyPL', true);
					} else {
						// Importing playlist from link
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
		case 0: // Enter playlist Name
			bootbox.prompt("Name the playlist", function(result) {
			  if (result === null || result == "") {
				window.location.reload();
			  } else {
				//Create playlist object with name set
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
		case 1: // Enter playlist link
			bootbox.prompt("Paste the link in here", function(result) {
			  if (result === null) {
				window.location.reload();
			  } else {
				//Get user name and playlist name fron string, put it inot aaray
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
				// If we got the user and playlist correctly then set the link value on our playlist object from the prior stage and run the confirm dialog
				if(aaray.length == 2){
					window.plinfo['lists'][0]['link'] = "https://api.spotify.com/v1/users/" + aaray[0] + "/playlists/" + aaray[1];
					window.modalGo('confirm', true);;
				}
			  }
			});
			break;
	}
}

function MyPLmodal(){ // Get Playlists From Self
	mds = window.modalstage;
	switch (mds){
		case 0: // Enter playlist prefix
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
		case 1: // Fire off request to get self playlists from spotify, no dialog
			window.plinfo['mypls'] = [];
			getItems('https://api.spotify.com/v1/me/playlists', 'gotpl', gotPlaylists, []);
			break;
		case 2: // Self Playlist state number of playlists and ask if import all or import some
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
		case 3:  // Self Playlist selection detail dialog
			if (window.plinfo['mypls'].length > 0){
				// Generate checkbox playlist selection elements
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
				//Dialog
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
								window.confirmPlaylists(); //Lock in picked playlists
								window.modalGo('confirm', true); // Go to the confirm diag
							}
						}
					}
				});
			}
			break;
	
	}
}

function confirmmodal(){ // Final Confirm
	bootbox.confirm("This can take quite a while, are you sure your ready?", function(result) {
		if (result == true){
			//Unload script files (mainly css)
			blankscriptfiles();
			//Set start time to time run
			window.portifystart = new Date().getTime();
			//Start loading
			window.loadpls();
		} else{
			window.location.reload();
		}
	});
}

function modalGo(type, doprompts){ // Pop into another dialog branch.
	window.modalstage = 0;
	window.modalmode = type;
	if (doprompts === true){
		doprompt();
	}
}

function doprompt(){ // Dialog master router
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
function blankscriptfiles(){ // Remove scripts and css files we have loaded.
	removejscssfile("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css", "css");
	removejscssfile('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js', "js");
	removejscssfile('https://cdnjs.cloudflare.com/ajax/libs/bootbox.js/4.4.0/bootbox.min.js', "js");
}

function clearwaves(){ // Clear ripple animations, they build up if we dont.
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

function dospotimport(){ // Launches internally once scripts are loaded.
	window.canImage = false;
	doprompt();
}
function setupPlInfo(){ // Init plinfo requirements
	window.plinfo = {};
	window.plinfo['lists'] = [];
	window.plinfo['prefix'] = "";
}
function portifyjs(mstage){ // Launch portify at init modal with stage mstage
	window.loadstep = 0;
	window.modalstage = mstage;
	window.modalmode = "init";
	window.items = {};
	setupPlInfo();
	doloadstep();
}
if (window.location.host != "play.google.com"){
	window.location = "https://play.google.com/music/listen";
}
if (window.portifyWorking != true){
	window.portifyWorking = true;
	if (window.spotifyoauth === undefined){
		portifyjs(0);
	} else {
		portifyjs(2)
	}
}