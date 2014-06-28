ninja-logitechmediaserver
=========================

Author: Paul Cullender
Version: 0.2.1
Status: beta
License: BSD


###Overview
Ninja Blocks Module for the Logitech Media Server / Squeezebox server. 
This version shows the names and what the status of the LMS Players are.


###Features
1. Detects each Squeeze player attached to the server
2. Shows the status of each play
3. Displays the volume level for each one.
4. Provides a media profile back to the ninja cloud to show details of what's playing (see note below)
5. Allows the player to be actuated for Volume up and down, on/off fwd & back tracks

New dashboard widget gist is here
https://gist.github.com/paulcull/e41250e68a6146d32052

###Wiki Entry
[TBD]


###Forum Post
[TBD]

###Notes / Conflicts
QNAP - Installation of Squeezeserver on QNAP defaults to http port 9001
XMBC - clashes with XMBC mean you should change the port for the Squeezeserver Command Line Interface (cli) port. Tested on 9095


###Installation

Install this Driver with:

ninja_install -g git@github.com:paulcull/ninja-logitechmediaserver.git (Requires ninja toolbelt)

####Manual Installation

1. cd into your drivers directory (/opt/ninja/drivers on your Ninja Block)
2. git clone git://github.com/paulcull/ninja-logitechmediaserver.git
3. cd ninja-logitechmediaserver && npm install

Note: if you want the coverart to show, you will need to expose the logitech server directly to the web. Port 9000 on the host machine mapped on you router.

###History

v0.2.1
======
Added multiple simple devices to work with rules
**NOTE** - re update the npm dependancies, if previous version installed

v0.2
======

Completely changed the devices approach for this version. Now only has a main media device. This is updated and published to the cloud on the changes to states of the players. May be a bit 'chatty' but seems responsive enough. Would appreciate any feedback on larger installation.

Coverart is a 'pull' from the cloud. I've left in a stub for a 'push' which would remove the need for the server being opened up to the internet, but not got it working yet.

I've forked the node-logitechmediaserver to add more interactions, but not significantly changed anything else.

I've got a couple of Rasperry Pi's running the software squeezeplayer, and they are working fine with this.

Give it a go, tell me if works for you and I'll get onto writing the part to actuate the players.


Community
=========

###Borrowing from...

This borrows alot from the ninjablock XMBC module found here: https://github.com/elliots/ninja-xbmc
The squeezebox communication is using the good work from here https://github.com/mozz100/node-logitechmediaserver


###Contributions to...

Very happy to accept patches/forks/complete rewrites. 

