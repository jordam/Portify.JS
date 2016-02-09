# Portify.JS

Transfer all of your spotify playlists to google play without downloading anything at all!

Runs in your browser independant of your operating system.

### Instructions

1. Drag this link to your bookmarks bar -> <a class="bookmarklet" href="javascript:(function()%7Bfunction%20callback()%7B%7Dvar%20s%3Ddocument.createElement(%22script%22)%3Bs.src%3D%22https%3A%2F%2Frawgit.com%2Fjordam%2FPortify.JS%2Fmaster%2Fportify.js%22%3Bif(s.addEventListener)%7Bs.addEventListener(%22load%22%2Ccallback%2Cfalse)%7Delse%20if(s.readyState)%7Bs.onreadystatechange%3Dcallback%7Ddocument.body.appendChild(s)%3B%7D)()">Portify.JS</a>

2. Open https://play.google.com/music/listen in its own window in chrome.

3. Click <code>Portify.JS</code> in on your bookmarks bar

You might need to press CTRL-SHIFT-B to pop open your bookmarks bar if its hidden.

The script will start by pulling in the data from spotify, it will then create all of your playlists and begin populating them with tracks.

This will occour realtime, do not inturrupt the process. This process can take a LONG time! It depends on the number of songs, but do not run this if you will need to disconnect your computer from the internet anytime remotely soon.

This script is EXPERIMENTAL! I had some recent success with it though and wanted to put the concept out there. I will be working to improve the script as time goes on.

By using Portify.JS you may violate both Spotify's and Google's Terms of Service. You agree that you are using Portify.JS on your own risk. The author does not accept liability (as far as permitted by law) for any loss arising from any use of this tool. If you choose not to agree to these terms, then you may not use this tool.