# Portify.JS

Transfer playlists between Spotify and Google Music both ways!
+ No Downloads
+ No Passwords
+ Copy Your Playlists
+ Copy Others Playlists
+ Spotify Free Compatible
+ No B/S

Setup is fast, go from reading this sentence to importing music in less then 30 seconds.

Basic features fixed as of 6/29/2020 using Chrome.

Select/unselect all broken. playlistToggle(this); in console for workaround.


### Instructions (For Chrome)

1. Drag the big <code>Portify.JS</code> link from [< THIS PAGE >](https://rawgit.com/jordam/Portify.JS/master/helper.html) to your bookmarks.

2. Click the bookmark a few times. It will grab your oauth token from spotify, load up google music, then launch Portify.JS 
  * A 404 page may appear during the process, ignore it and press the button again.


### Instructions (Other Browsers)

1. Drag the big <code>Portify.JS</code> link for other browsers from [< THIS PAGE >](https://rawgit.com/jordam/Portify.JS/master/helper.html) to your bookmarks.

2. Click the bookmark twice. Follow the instructions on the page to get your oauth token.

### Features
+ Transfer your spotify playlists to google music
+ Transfer others spotify playlists to google music
+ Transfer your google music playlists to spotify
+ Export your google music playlists to a csv file (so you can import into other stuff)
+ Bulk delete google music playlists that contain a string or a prefix

### Notes

Portify.JS has been confirmed to work in Chrome, Firefox, and IE (at one point). It should work on most browsers, but try chrome if its not working for you.

The Chrome version is more sophisticated and light weight. It will get your oauth token for you and will disable images and animations in the google music player before running.

The app runs real-time and takes around a second a song to go spotify -> google music. Google music -> spotify is faster. 

If you would like to listen to music while importing your songs you will need two tabs, one for portify.js and one for you to listen to music. Run the GM-DLU bookmark on the listening tab, otherwise your listening tab will freeze trying to keep in sync with your import tab. Alternatively, just wait a few an listen once imported.

An old demo video is availible here -> [Demo Video](http://screencast-o-matic.com/u/VbjP/portify_js)

By using Portify.JS you may violate both Spotify's and Google's Terms of Service. You agree that you are using Portify.JS on your own risk. The author does not accept liability (as far as permitted by law) for any loss arising from any use of this tool. If you choose not to agree to these terms, then you may not use this tool.
