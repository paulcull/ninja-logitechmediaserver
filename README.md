ninja-logitechmediaserver
=========================

Author: Paul Cullender
Version: 1.0
Status: alpha
License: BSD
=====================

###What
Ninja Blocks Module for the Logitech Media Server / Squeezebox server. 
This version shows the names and what the status of the LMS Players are.

This borrows alot from the ninjablock XMBC module found here: https://github.com/elliots/ninja-xbmc


###Features
1. Detects each Squeeze player attached to the server
2. Shows the status of each play
3. Displays the volume level for each one.

###Wiki Entry
[TBD]

###Forum Post
[TBD]

###Installation

Install this Driver with:

ninja_install -g git@github.com:paulcull/ninja-logitechmediaserver.git (Requires ninja toolbelt)

####Manual Installation

1. cd into your drivers directory (/opt/ninja/drivers on your Ninja Block)
2. git clone git://github.com/paulcull/ninja-logitechmediaserver.git
3. cd ninja-logitechmediaserver && npm install

###History

v0.0.1


Drivers cannot (yet) set the device name when registering, so the nickname is only used in the guid. @dan has promised to see if he can make it happen "soon" though =)

Give it a go, tell me if works for you and I'll get onto writing the part to actuate the players.


###Contributions

Very happy to accept patches/forks/complete rewrites. Be aware I don't really know how git works yet, so no promises that I know what i've done here

