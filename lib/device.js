var stream = require('stream')
  , util = require('util');

// Give our device a stream interface
util.inherits(Device,stream);

module.exports = Device;

function Device(opts, app, lms, mac, emitter) {

  var self = this;
  self.mac = mac;

  this.app = app;
  this.host = opts.lmsip;
  this.port = opts.lmsport;
  this.name = opts.lmsname;

  // set this collection of devices to a unique squeezebox
  player = lms.players[mac];

  // set subscriptions to each of the events
  // these events are captured in the squeezeplayer.js controller in the logitechmediaserver node_module
  // property - not listening for 
  // 'logitech_event,property'
  // .split(',').forEach(  function listenToNotification(eventName) {
  //   player.on(eventName, function(e) {
  //     self.app.log.debug('(Squeezebox) : Got %s in ninja',eventName);
  //     self.app.log.debug('(Squeezebox) : Using these options: %s',JSON.stringify(opts));
  //   });
  // });

  //name is what it says - name of the player
  //use the name event to create the devices, so that we can set the name correctly first time
  'name'
  .split(',').forEach(  function listenToNotification(eventName) {
    //self.app.log.debug('listening to %s on %s',eventName,mac.toUpperCase());
    player.on(eventName, function(e) {
      if (self.name != e) {
        Object.keys(self.devices).forEach(function(id) {
          self.app.log.debug('(Squeezebox) : Adding sub-device',this.host, self.devices[id]._name, id, self.devices[id].G);
          self.devices[id].name = self.name+self.devices[id]._name;
          emitter.emit('register', self.devices[id]);
          self.name = e;
        });
        self.devices.mediaObject._data.state.player_name = self.name;
        self.devices.mediaObject.emit('data',self.devices.mediaObject._data)
        player.getPlayerSong();
      } else
      { 
          self.app.log.debug('In this part of the code for LMS - I shouldnt be here');
      }
    });
  });

  //songinfo has all the track details
  'songinfo,song_details'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Squeezebox) : Got %s in ninja',eventName);
      //self.app.log.debug('(Squeezebox) : Using these options: %s',JSON.stringify(opts));
      //This is the track details for a file
      self.devices.mediaObject._data.track.name = e.title;
      self.devices.mediaObject._data.track.artist = e.artist;
      self.devices.mediaObject._data.track.album = e.album;
      self.devices.mediaObject._data.track.disc_number = e.disc;
      self.devices.mediaObject._data.track.track_number = e.tracknum;
      self.devices.mediaObject._data.track.duration = e.duration;
      self.devices.mediaObject._data.track.id = e.id;
      self.devices.mediaObject._data.state.track_id = e.id;
      self.devices.mediaObject._data.track.album_artist = e.artist;
      self.devices.mediaObject._data.track.squeeze_url = e.file;
      self.devices.mediaObject._data.track.spotify_url = '';
      self.devices.mediaObject._data.image = 'http://' + opts.remote_url + ':'+this.port+'/music/' + e.coverid + '/cover_375x375_p.jpg';
      //
      self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);
      // uncomment to see the media object being sent
      // self.app.log.debug('(Squeezebox) : object : %s',JSON.stringify(self.devices.mediaObject._data));
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data)
    });
  });

  //songinfo has all the track details
  'radio_details'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Squeezebox) : Got %s in ninja',eventName);
      //self.app.log.debug('(Squeezebox) : Using these options: %s',JSON.stringify(opts));
      //This is the track details for Radio
      self.devices.mediaObject._data.track.name = '';
      self.devices.mediaObject._data.track.artist = 'Radio';
      self.devices.mediaObject._data.track.album = '';
      self.devices.mediaObject._data.track.disc_number = '';
      self.devices.mediaObject._data.track.track_number = '';
      self.devices.mediaObject._data.track.duration = '';
      self.devices.mediaObject._data.track.id = e.id;
      self.devices.mediaObject._data.state.track_id = e.id;
      self.devices.mediaObject._data.track.album_artist = '';
      self.devices.mediaObject._data.track.squeeze_url = e.radio_path;
      self.devices.mediaObject._data.track.source = e.source;
      self.devices.mediaObject._data.track.spotify_url = '';
      self.devices.mediaObject._data.image = ' ';

      self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);
      // uncomment to see the media object being sent
      // self.app.log.debug('(Squeezebox) : object : %s',JSON.stringify(self.devices.mediaObject._data));
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data)
    });
  });

  //songinfo has all the track details
  'current_details'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Squeezebox) : Got %s in ninja',eventName);
      //self.app.log.debug('(Squeezebox) : Using these options: %s',JSON.stringify(opts));
      if (self.devices.mediaObject._data.track.source === 'radio') {
        self.devices.mediaObject._data.track.name = e;
        self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);
        // uncomment to see the media object being sent
        // self.app.log.debug('(Squeezebox) : object : %s',JSON.stringify(self.devices.mediaObject._data));
        self.devices.mediaObject.emit('data',self.devices.mediaObject._data)
        //self.devices.coverArt.write(e);
      }
    });
  });

  //songinfo has all the track details
  'spotify_details'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      //self.app.log.debug('(Squeezebox) : Got %s in ninja',eventName);
      //self.app.log.debug('(Squeezebox) : Using these options: %s',JSON.stringify(opts));
      self.app.log.debug('(Squeezebox) : spotify URL is %s',spotify_host+spotify_url_start+e.id);
      //Have to go out to spotify to get the track details
      var get_options = {
        hostname: spotify_host,
        path: spotify_url_start+e.id,
        method: 'GET'
      };

      var req = https.get(get_options, function(res) {
        //console.log("Got response: " + res.statusCode);
        //console.log(res);
        res.on('data',function(chunk){
          var _spotData = JSON.parse(chunk);
          //set track details for spotify - not many
          self.devices.mediaObject._data.track.name = _spotData.title;
          self.devices.mediaObject._data.track.artist = '';
          self.devices.mediaObject._data.track.album = '';
          self.devices.mediaObject._data.track.disc_number = '';
          self.devices.mediaObject._data.track.track_number = '';
          self.devices.mediaObject._data.track.duration = '';
          self.devices.mediaObject._data.track.id = e.id;
          self.devices.mediaObject._data.state.track_id = e.id;
          self.devices.mediaObject._data.track.album_artist = e.artist;
          self.devices.mediaObject._data.track.squeeze_url = '';
          self.devices.mediaObject._data.track.source = e.source;
          self.devices.mediaObject._data.track.spotify_url = spotify_host+spotify_url_start+e.id;
          self.devices.mediaObject._data.image = _spotData.thumbnail_url;

          self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);
          // uncomment to see the media object being sent
         //self.app.log.debug('(Squeezebox) : object : %s',JSON.stringify(self.devices.mediaObject._data));
         self.devices.mediaObject.emit('data',self.devices.mediaObject._data)

        });
      });
      req.on('error', function(e) {
        self.app.log.error('(Squeezebox) : Got error: ' + e.message);
      });
    });
  });

  //playlist tells us the track has changed - we only listen to playlist open
  //and then trigger us to get the track details
  'playlist'
  .split(',').forEach(  function listenToNotification(eventName) {
    _lastevent = '';
    player.on(eventName, function(e) {
      //console.log('playlist event payload is: %s',e);
      if (e != _lastevent) {
        if (e === 'playlist pause 0') {
          //self.devices.displayPlay.emit('data', 'playlist is '+e);
        } else if (startsWith("playlist newsong", e)) {
          self.app.log.debug('(Squeezebox) : Playlist song');
          player.getPlayerSong();
        } else if (startsWith("playlist play", e)) {
          self.app.log.debug('(Squeezebox) : Playlist play');
          player.getPlayerSong();
        } else if (startsWith("playlist open", e)) {
          self.app.log.debug('(Squeezebox) : New Playlist');
          var mediaFileName = e.substr(14,(e.length-14));
          //console.log('*** about to get playlist openfile songinfo for %s', mediaFileName);
          player.getSongInfo(mediaFileName);
        } else {
          //console.log('**** nb emit logitech playlist on %s for %s with value %s',mac.toUpperCase()+'-*-'+self.name,eventName,e);
          //self.devices.mediaObject._data.state.track_id = e;
          //self.devices.mediaObject.emit('data',self.devices.mediaObject._data)
          //self.devices.displayPlay.emit('data', 'playlist is '+e);
        }
      }
    });
  });

  // this is the path for the track
  // when you get this, just fire back a request for specific details
  'song_path,path'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      //self.app.log.debug('**** nb emit logitech path for %s with value %s',eventName,JSON.stringify(e));
      //self.app.log.debug('(Squeezebox) : Got Event %s with filename %s',eventName,e.file);
      player.getSongInfo('file:'+e.file);
    });
  });

  // this is the playing mode
  'mode'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      //self.app.log.debug('**** nb emit logitech path for %s with value %s',eventName,JSON.stringify(e));
      self.app.log.debug('(Squeezebox) : Got Event %s with mode as %s',eventName,e);
      self.devices.mediaObject._data.state.mode = e
      if (e === 'play') {
        self.devices.mediaObject._data.state.nextmode = 'Pause'
        if (self.devices.mediaObject._data.state.state === 'off') {
          self.devices.mediaObject._data.state.nextmode = '-'
        } 
      } else {
        self.devices.mediaObject._data.state.nextmode = 'Play'          
      }
      self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
      //player.getSongInfo('file:'+e.file);
    });
  });

  // does what it says
  'volume'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.devices.mediaObject._data.state.volume = player.getNoiseLevel();
      self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);      
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
      self.app.log.debug('(Squeezebox) : Volumes is %s',self.devices.mediaObject._data.state.volume);
      //self.devices.mediaObject.write('data',self.devices.mediaObject._data)
    });
  });

  // set subscriptions to each of the events
  'power'//State,power'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      //console.log('e for %s is this: %s',eventName, e);
      var _state = e==1 ? 'on' : 'off';
      //console.log('old is %s : new is %s',e,_state);
      self.app.log.debug('(Squeezebox) : Power old is %s : new is %s',e,_state);
      // if switched off - reset everything
      if (!e) {
        //console.log('switching off...');
        self.devices.mediaObject._data.state.track_id = null;
        self.devices.mediaObject._data.state.volume = 0;
        self.devices.mediaObject._data.state.position = null;
        self.devices.mediaObject._data.state.state = "off";
        self.devices.mediaObject._data.state.nextstate = "On";
        self.devices.mediaObject._data.track.duration = 0;
        self.devices.mediaObject._data.state.mode = "off"
        self.devices.mediaObject._data.state.nextmode = "-"

        self.devices.mediaObject._data.track.name = 'Player is off';
        self.devices.mediaObject._data.track.artist = '';
        self.devices.mediaObject._data.track.album = '';
        self.devices.mediaObject._data.track.disc_number = '';
        self.devices.mediaObject._data.track.track_number = '';
        self.devices.mediaObject._data.track.id = '';
        self.devices.mediaObject._data.state.track_id = '';
        self.devices.mediaObject._data.track.album_artist = null;
        self.devices.mediaObject._data.track.squeeze_url = null;
        self.devices.mediaObject._data.track.spotify_url = null;
        self.devices.mediaObject._data.track.source = null;

        self.devices.mediaObject._data.image = 'null';

        self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);
        self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
        //  self.devices.mediaObject.write('data',self.devices.mediaObject._data)
        //self.devices.coverArt.write(e);
        //
       } else {
        self.devices.mediaObject._data.state.state = 'on';
        self.devices.mediaObject._data.state.nextstate = 'Off';        
        self.devices.mediaObject._data.state.volume = player.getNoiseLevel()
       player.getPlayerSong();

       }
      //console.log('about to send media object with %s',self.devices.mediaObject._data);
      //self.devices.powerState.emit('data',_state);
    });
  });


// these the device types

  function mediaObject() {
    this.readable = true;
    this.writeable = false;
    this.V = 0;
    this.D = 280;
    this.G = 'LMSMO'+self.mac.replace(/[^a-zA-Z0-9]/g, '');
    //this.G = self.mac;
    this._name = ' - MediaObject';
     this._features = {
      "play":true,
      "pause":true,
      "rew":true,
      "ffd":true,
      "onoff":true,
      "volup":true,
      "voldown":true 
    },
    this._data = {
      "state":{
        "player_name":"",
        "track_id":"",
        "volume":0,
        "position":0,
        "state":"off",
        "nextstate": "on",
        "mode":"off",
        "nextmode":"-"
      },
      "track":{
        "artist":"",
        "album":"",
        "disc_number":0,
        "duration":0,
        "played_count":0,
        "track_number":0,
        "starred":false,
        "popularity":0,
        "id":"",
        "name":"",
        "album_artist":"",
        "spotify_url":"",
        "source":""
      },
      "image":"."
    };
//    console.log(this._data);
  }
  util.inherits(mediaObject, stream);
  mediaObject.prototype.write = function(data) {
    self.app.log.debug('Squeezebox - media object command received for %s : %s', this.G, JSON.stringify(data));
    if (data.command) {
      switch(data.command)
      {
      case 'onoff':
        self.app.log.debug('Squeezebox - Toggle on/off');
        if (self.devices.mediaObject._data.state.state === 'off') {
          player.switchOn();
        } else {
          player.switchOff();
        }
        break;
      case 'volup':
        self.app.log.debug('Squeezebox - Volume Up');
        player.volup();
        break;
      case 'voldown':
        self.app.log.debug('Squeezebox - Volume Down');
        player.voldown();
        break;
      case 'fwd':
        self.app.log.debug('Squeezebox - Jump Forward');
        player.jumpfwd();
        break;
      case 'rew':
        self.app.log.debug('Squeezebox - Jump Rewind');
        player.jumprew();
        break;
       case 'playPause':
        self.app.log.debug('Squeezebox - Play Pause');
        if (self.devices.mediaObject._data.state.mode === 'pause') {
          player.play();
        } else {
          player.pause();
        }
      }
    }
    //self._app.log.debug('see the image at %s',self.devices.mediaObject._data.image);
    return true;
  };

// These are the devices created from device types

  this.devices = {
    mediaObject: new mediaObject()
  };
}


// a couple of helpers

function startsWith(search, s) {
    return s.substr(0,search.length) == search;
}

Device.prototype.end = function() {};
Device.prototype.close = function() {};


