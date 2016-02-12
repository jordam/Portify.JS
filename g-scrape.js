// Jeremie Miserez <jeremie@miserez.org>, 2015
// FROM https://gist.github.com/jmiserez/c9a9a0f41e867e5ebb75
//
// A little bit of Javascript to let you export your Google Music library, playlists, and album track lists :)
//
// Modified 2-11-2016 by jordam@github
//
// https://gist.githubusercontent.com/jmiserez/c9a9a0f41e867e5ebb75/raw/969ca65c78401f4e6b68aa20e57379d5ff6bc4e8/export_google_music.js before modifications

window.scrapeSongs = function(cback){
  if (document.querySelectorAll(".empty").length > 0){
	cback([]);
	return;
  }
  window.scrollTo(0,0);//Scroll to top
  var intervalms = 100; //in ms
  var timeoutms = 3000; //in ms
  var retries = timeoutms / intervalms;
  var total = [];
  var seen = {};
  var topId = "";
  var interval = setInterval(function(){
    var songs = document.querySelectorAll("table.song-table tbody tr.song-row");
    if (songs.length > 0) {
      // detect order
      var colNames = {
        index: -1,
        title: -1,
        duration: -1,
        artist: -1,
        album: -1,
        playcount: -1,
        rating: -1
        };
      for (var i = 0; i < songs[0].childNodes.length; i++) {
        colNames.index = songs[0].childNodes[i].getAttribute("data-col") == "index" ? i : colNames.index;
        colNames.title = songs[0].childNodes[i].getAttribute("data-col") == "title" ? i : colNames.title;
        colNames.duration = songs[0].childNodes[i].getAttribute("data-col") == "duration" ? i : colNames.duration;
        colNames.artist = songs[0].childNodes[i].getAttribute("data-col") == "artist" ? i : colNames.artist;
        colNames.album = songs[0].childNodes[i].getAttribute("data-col") == "album" ? i : colNames.album;
        colNames.playcount = songs[0].childNodes[i].getAttribute("data-col") == "playcount" ? i : colNames.playcount;
        colNames.rating = songs[0].childNodes[i].getAttribute("data-col") == "rating" ? i : colNames.rating;
      }
      // check if page has updated/scrolled
      var currId = songs[0].getAttribute("data-id");
      if (currId == topId){ // page has not yet changed
        retries--;
        scrollDiv = document.querySelector("#mainContainer");
        isAtBottom = scrollDiv.scrollTop == (scrollDiv.scrollHeight - scrollDiv.offsetHeight)
        if (isAtBottom || retries <= 0) {
          clearInterval(interval); //done
		  window.scrollTo(0,0);//Scroll to top
          cback(total); //Callback
        }
      } else {
        retries = timeoutms / intervalms;
        topId = currId;
        // read page
        for (var i = 0; i < songs.length; i++) {
          var curr = {
            dataid: songs[i].getAttribute("data-id"),
            index: (colNames.index != -1 ? songs[i].childNodes[colNames.index].textContent : ""),
            title: (colNames.title != -1 ? songs[i].childNodes[colNames.title].textContent : ""),
            duration: (colNames.duration != -1 ? songs[i].childNodes[colNames.duration].textContent : ""),
            artist: (colNames.artist != -1 ? songs[i].childNodes[colNames.artist].textContent : ""),
            album: (colNames.album != -1 ? songs[i].childNodes[colNames.album].textContent : ""),
            playcount: (colNames.playcount != -1 ? songs[i].childNodes[colNames.playcount].textContent : ""),
            rating: (colNames.rating != -1 ? songs[i].childNodes[colNames.rating].textContent : ""),
            }
          if (!seen.hasOwnProperty(curr.index)){ // hashset
            total.push(curr);
            seen[curr.index] = true;
          }
        }
        songs[songs.length-1].scrollIntoView(true); // go to next page
      }
    }
  }, intervalms);
};