var stream = require('stream'),
  util = require('util'),
  //exec = require('child_process').exec,
  child;

// Give our device a stream interface
util.inherits(Device,stream);

// Export it
module.exports=Device;

/**
 * Creates a new Device Object
 *
 * @property {Boolean} readable Whether the device emits data
 * @property {Boolean} writable Whether the data can be actuated
 *
 * @property {Number} G - the channel of this device
 * @property {Number} V - the vendor ID of this device
 * @property {Number} D - the device ID of this device
 *
 * @property {Function} write Called when data is received from the Ninja Platform
 *
 * @fires data - Emit this when you wish to send data to the Ninja Platform
 */
function Device(opts, app, player, mac) {


  this.app = app;
  this.host = opts.lmsip;
  this.port = opts.lmsport;
  this.cliport = opts.lmscliport;
  this.name = opts.lmsname;
  this.serverName = opts.lmsname;
  this.mac = mac.toUpperCase();

  var self = this;

  // set subscriptions to each of the events
  //name is what it says - name of the player
  'name'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Squeezebox) : Event: %s - Got Player %s and sending to %s with value %s', eventName, player.id, self.devices.mediaObject.mac, e);
      if (self.name != e) {
        self.devices.mediaObject.name = '***'+e+self.devices.mediaObject._name;
        self.name = e;
        self.devices.mediaObject._data.state.player_name = e;
        self.devices.playerName.emit('data',self.serverName +' - '+e);
        self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
        player.getPlayerSong();
      } else
      { 
          self.app.log.debug('In this part of the code for LMS - I shouldnt be here');
      }
    });
  });

  //player_log is what it says - log events of the player
  'player_log'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(logData) {
      //if (player.id !== self.devices.mediaObject.mac) { self.app.log.debug('(Squeezebox) : Event: %s skipped for %s' ,eventName, player.id);return };
      self.app.log.debug('(Squeezebox) : Raw Player %s Log :', self.devices.mediaObject.mac.name, logData);
    });
  });

  //songinfo has all the track details
  'songinfo,song_details'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Squeezebox) : Event: %s - Got Player %s and sending to %s with value %s', eventName, player.id, self.devices.mediaObject.mac, e);
      //self.app.log.debug('(Squeezebox) : Got %s in ninja',eventName);
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
      self.devices.mediaObject._data.image = 'http://' + opts.remote_url + ':'+opts.lmsport+'/music/' + e.coverid + '/cover_375x375_p.jpg';
      //
      self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);
      // uncomment to see the media object being sent
       self.app.log.debug('(Squeezebox) : %s : object : %s',JSON.stringify(eventName), JSON.stringify(self.devices.mediaObject._data));
      if (self.devices.mediaObject._data.state.state === 'on' && self.devices.mediaObject._data.state.mode === 'play') {
        self.devices.nowPlaying.emit('data',self.devices.mediaObject._data.track.album+' - '+self.devices.mediaObject._data.track.name + ' ('+self.devices.mediaObject._data.track.artist+')');
      } else {
        self.devices.nowPlaying.emit('data',''); 
      }
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
    });
  });

  //songinfo has all the track details
  'radio_details'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Squeezebox) : Event: %s - Got Player %s and sending to %s with value %s', eventName, player.id, self.devices.mediaObject.mac, e);
      self.app.log.debug('(Squeezebox) : Got %s in ninja',eventName);
      //This is the track details for Radio
      if (self.devices.mediaObject._data.track.artist !== 'Radio') {
         self.devices.mediaObject._data.track.name = '';
      }
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
      //
      self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);
      // uncomment to see the media object being sent
      // self.app.log.debug('(Squeezebox) : %s : object : %s',JSON.stringify(eventName), JSON.stringify(self.devices.mediaObject._data));
      if (self.devices.mediaObject._data.state.state === 'on' && self.devices.mediaObject._data.state.mode === 'play') {
        self.devices.nowPlaying.emit('data',self.devices.mediaObject._data.track.album+' - '+self.devices.mediaObject._data.track.name + ' ('+self.devices.mediaObject._data.track.artist+')');
      } else {
        self.devices.nowPlaying.emit('data',''); 
      }
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
    });
  });

  //songinfo has all the track details
  'current_title'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Squeezebox) : Event: %s - Got Player %s and sending to %s with value %s', eventName, player.id, self.devices.mediaObject.mac, e);
      self.app.log.debug('(Squeezebox) : Got %s in ninja',eventName);
      if (self.devices.mediaObject._data.track.source === 'radio'||self.devices.mediaObject._data.track.source === 'spotify') {
        self.devices.mediaObject._data.track.name = e;
        self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);
        // uncomment to see the media object being sent
        // self.app.log.debug('(Squeezebox) : %s : object : %s',eventName, JSON.stringify(self.devices.mediaObject._data));
      if (self.devices.mediaObject._data.state.state === 'on' && self.devices.mediaObject._data.state.mode === 'play') {
          self.devices.nowPlaying.emit('data',self.devices.mediaObject._data.track.album+' - '+self.devices.mediaObject._data.track.name + ' ('+self.devices.mediaObject._data.track.artist+')');
        } else {
          self.devices.nowPlaying.emit('data',''); 
        }
        self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
        //self.devices.coverArt.write(e);
      }
    });
  });

  //songinfo has all the track details
  'spotify_details'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Squeezebox) : Event: %s - Got Player %s and sending to %s with value %s', eventName, player.id, self.devices.mediaObject.mac, e);
      //self.app.log.debug('(Squeezebox) : Got %s in ninja',eventName);
      //self.app.log.debug('(Squeezebox) : Using these options: %s',JSON.stringify(opts));
      self.app.log.debug('(Squeezebox) : spotify URL is %s',spotify_host+spotify_url_start+e.id);
      //
      self.devices.mediaObject._data.track.artist = 'Spotify';
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
      //
      self.devices.mediaObject._data.track.name = '';  
      self.devices.mediaObject._data.image = '';
      //
      //Have to go out to spotify to get the track details

      var opts = {};
      opts.method = 'GET';
      opts.headers = {'User-Agent':'ninja-lms'};
      opts.url = 'https://' + spotify_host + '/' + spotify_url_start+e.id +'&format=json';
      opts.json = '{on:true}';
      opts.timeout = 2000;


      request(opts,function(e,r,b) {
        if (e) {
          //console.log('request error')
          //console.log(e);
          self.app.log.error('(Squeezebox) :  Spotify Query error : %s',e);
        }
        else {
            // console.log('request not error');
            // console.log('b:::: %s',JSON.stringify(b));
            //  var _spotData = JSON.parse(b);
            var _spotData = b;
            // console.log('===== ALL SPOT DATA');
            // console.log('Title: %s',_spotData.title);
            // console.log('Coverart: %s',_spotData.thumbnail_url);
            //set track details for spotify - not many
            self.devices.mediaObject._data.track.name = _spotData.title;
            self.devices.mediaObject._data.image = _spotData.thumbnail_url;
            self.app.log.debug('(Squeezebox) : about to send spotify media object for %s...',opts.lmsname);
            //uncomment to see the media object being sent
            //self.app.log.debug('(Squeezebox) : %s : object : %s',eventName, JSON.stringify(self.devices.mediaObject._data));
            if (self.devices.mediaObject._data.state.state === 'on') {
              self.devices.nowPlaying.emit('data',self.devices.mediaObject._data.track.album+' - '+self.devices.mediaObject._data.track.name + ' ('+self.devices.mediaObject._data.track.artist+')');
            } else {
              self.devices.nowPlaying.emit('data',''); 
            }
            self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
        }
      });

      self.app.log.debug('(Squeezebox) : about to send spotify media object for %s...',opts.lmsname);
      //uncomment to see the media object being sent
      //self.app.log.debug('(Squeezebox) : %s : object : %s',eventName, JSON.stringify(self.devices.mediaObject._data));
      if (self.devices.mediaObject._data.state.state === 'on' && self.devices.mediaObject._data.state.mode === 'play') {
        self.devices.nowPlaying.emit('data',self.devices.mediaObject._data.track.album+' - '+self.devices.mediaObject._data.track.name + ' ('+self.devices.mediaObject._data.track.artist+')');
      } else {
        self.devices.nowPlaying.emit('data',''); 
      }
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data);


    });
  });

  //playlist tells us the track has changed - we only listen to playlist open
  //and then trigger us to get the track details
  'playlist'
  .split(',').forEach(  function listenToNotification(eventName) {
    _lastevent = '';
    player.on(eventName, function(e) {
      self.app.log.debug('(Squeezebox) : Event: %s - Got Player %s and sending to %s with value %s', eventName, player.id, self.devices.mediaObject.mac, e);
      if (e != _lastevent) {
        if (e === 'playlist pause 0') {
        } else if (startsWith("playlist newsong", e)) {
          player.getPlayerSong();
        } else if (startsWith("playlist play", e)) {
          player.getPlayerSong();
        } else if (startsWith("playlist open", e)) {
          var mediaFileName = e.substr(14,(e.length-14));
          player.getSongInfo(mediaFileName);
        } 
      }
    });
  });

  // this is the path for the track
  // when you get this, just fire back a request for specific details
  'song_path,path'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Squeezebox) : Event: %s - Got Player %s and sending to %s with value %s', eventName, player.id, self.devices.mediaObject.mac, e);
      //self.app.log.debug('(Squeezebox) : Got Event %s with filename %s',eventName,e.file);
      player.getSongInfo('file:'+e.file);
    });
  });

  // this is the playing mode
  'mode'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Squeezebox) : Event: %s - Got Player %s and sending to %s with value %s', eventName, player.id, self.devices.mediaObject.mac, e);
      //self.app.log.debug('**** nb emit logitech path for %s with value %s',eventName,JSON.stringify(e));
      self.app.log.debug('(Squeezebox) : Got Event %s with mode as %s',eventName,e);
      self.devices.mediaObject._data.state.mode = e;
      if (e === 'play') {
        self.devices.mediaObject._data.state.nextmode = 'Pause';
        if (self.devices.mediaObject._data.state.state === 'off') {
          self.devices.mediaObject._data.state.nextmode = '-';
        } 
      } else {
        self.devices.mediaObject._data.state.nextmode = 'Play';          
      }
  
      //
      //update devices
      //
      self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);
      //self.app.log.debug('(Squeezebox) : %s - %s : object : %s',eventName,e, JSON.stringify(self.devices.mediaObject._data));
      self.devices.isPlaying.emit('data',self.devices.mediaObject._data.state.mode==='play'? true: false);
      if (self.devices.mediaObject._data.state.state === 'on' && self.devices.mediaObject._data.state.mode === 'play') {
        self.devices.nowPlaying.emit('data',self.devices.mediaObject._data.track.album+' - '+self.devices.mediaObject._data.track.name + ' ('+self.devices.mediaObject._data.track.artist+')');
        //self.devices.volumeLevel.emit('data',self.devices.mediaObject._data.state.volume);
      } else {
        self.devices.nowPlaying.emit('data',''); 
        //self.devices.volumeLevel.emit('data',0);
      }
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
    });
  });

  // does what it says
  'volume'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Squeezebox) : Event: %s - Got Player %s and sending to %s with value %s', eventName, player.id, self.devices.mediaObject.mac, e);
      self.devices.mediaObject._data.state.volume = player.getNoiseLevel();
      if (self.devices.mediaObject._data.state.state === 'off') {player.getPower();}
      self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);      
      //self.app.log.debug('(Squeezebox) : %s : object : %s',eventName, JSON.stringify(self.devices.mediaObject._data));
      //
      //update devices
      //
      self.app.log.debug('(Squeezebox) : Volumes is %s',self.devices.mediaObject._data.state.volume);
      self.devices.volumeLevel.emit('data',self.devices.mediaObject._data.state.volume);
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
    });
  });

  // set subscriptions to each of the events
  'power'//State,power'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Squeezebox) : Event: %s - Got Player %s and sending to %s with value %s', eventName, player.id, self.devices.mediaObject.mac, e);
      var _state = e==1 ? 'on' : 'off';
      self.app.log.debug('(Squeezebox) : Power old is %s : new is %s',e,_state);
      // if switched off - reset everything
      if (!e) {
        self.app.log.debug('(Squeezebox) : Switching off...');
        self.devices.mediaObject._data.state.track_id = null;
        self.devices.mediaObject._data.state.volume = 0;
        self.devices.mediaObject._data.state.position = null;
        self.devices.mediaObject._data.state.state = "off";
        self.devices.mediaObject._data.state.nextstate = "On";
        self.devices.mediaObject._data.track.duration = 0;
        self.devices.mediaObject._data.state.mode = "off";
        self.devices.mediaObject._data.state.nextmode = "-";
        //
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
        //
        self.devices.mediaObject._data.image = 'null';

        //
        //update devices
        //
        self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);
        //self.app.log.debug('(Squeezebox) : %s : object : %s',eventName, JSON.stringify(self.devices.mediaObject._data));
        self.devices.isPlaying.emit('data',false);
        self.devices.volumeLevel.emit('data',self.devices.mediaObject._data.state.volume);
        self.devices.nowPlaying.emit('data',''); 
        self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
       } else {
        self.devices.mediaObject._data.state.state = 'on';
        if (self.devices.mediaObject._data.track.name === 'Player is off') {self.devices.mediaObject._data.track.name = '';}
        self.devices.mediaObject._data.state.nextstate = 'Off';        

        //
        //update devices
        //
        self.app.log.debug('(Squeezebox) : about to send media object for %s...',opts.lmsname);
        //self.app.log.debug('(Squeezebox) : %s : object : %s',eventName, JSON.stringify(self.devices.mediaObject._data));
        self.devices.isPlaying.emit('data',self.devices.mediaObject._data.state.mode==='play'? true: false);
        self.devices.mediaObject.emit('data',self.devices.mediaObject._data);

        //trigger updates
        self.devices.mediaObject._data.state.volume = player.getNoiseLevel();
        player.getPlayerSong();
       }
      //console.log('about to send media object with %s',self.devices.mediaObject._data);
      //self.devices.powerState.emit('data',_state);
    });
  });


  // these the device types



  function displayText(_title) {
    this.textTitle = _title;
    this.readable = false;
    this.writeable = true;
    this.V = 0;
    this.D = 240;
    this.mac = self.mac;
    this.name = 'LMS-T-'+this.textTitle.toUpperCase()+'-'+self.mac.replace(/[^a-zA-Z0-9]/g, '');
    this.G = 'LMST'+this.textTitle.toUpperCase()+self.mac.replace(/[^a-zA-Z0-9]/g, '');
  }
  util.inherits(displayText, stream);

  displayText.prototype.write = function(data) {
    self.app.log.debug('Squeezebox - Text command received for %s : %s', this.G, JSON.stringify(data));
    if (this.textTitle === 'commander') {
      player.runcmd(data);
    }
    return true;
  };


  function switchSensor(_name) {
    this.sensorName = _name;
    this.readable = true;
    this.writeable = false;
    this.V = 0;
    this.D = 205;
    this.name = 'LMS-SS-'+_name.toUpperCase()+'-'+self.mac.replace(/[^a-zA-Z0-9]/g, '');
    this.G = 'LMSSS'+_name.toUpperCase()+self.mac.replace(/[^a-zA-Z0-9]/g, '');
  }
  util.inherits(switchSensor, stream);

  switchSensor.prototype.write = function(data) {
    self.app.log.warn('Squeezebox - unexpected command received for %s : %s', this.G, JSON.stringify(data));
    return true;
  };


  function volume() {
    this.readable = true;
    this.writeable = false;
    this.V = 0;
    this.D = 215;
    this.name = 'LMS-VOL-'+'-'+self.mac.replace(/[^a-zA-Z0-9]/g, '');
    this.G = 'LMSVOL'+self.mac.replace(/[^a-zA-Z0-9]/g, '');
  }
  util.inherits(volume, stream);

  volume.prototype.write = function(data) {
    self.app.log.warn('Squeezebox - unexpected command received for %s : %s', this.G, JSON.stringify(data));
    return true;
  };


  // function switchAct(_name) {
  //   this.actionName = _name;
  //   this.readable = false;
  //   this.writeable = true;
  //   this.V = 0;
  //   this.D = 207;
  //   this.name = 'LMS-SA-'+_name.toUpperCase()+'-'+self.mac.replace(/[^a-zA-Z0-9]/g, '');
  //   this.G = 'LMSSA'+_name.toUpperCase()+self.mac.replace(/[^a-zA-Z0-9]/g, '');
  // }
  // util.inherits(switchAct, stream);

  // switchAct.prototype.write = function(data) {
  //   self.app.log.debug('Squeezebox - command received for %s : %s', this.G, JSON.stringify(data));
  //   switch(this.actionName)
  //   {
  //     case 'play':
  //       self.app.log.debug('Squeezebox - Actuate Button %s %s',this.G,this.actionName);
  //       player.play();
  //       break;
  //     case 'pause':
  //       self.app.log.debug('Squeezebox - Actuate Button %s %s',this.G,this.actionName);
  //       player.pause();
  //       break;
  //   }
  //   return true;
  // };



  function mediaObject() {
    this.readable = true;
    this.writeable = false;
    this.V = 0;
    this.D = 280;
    this.G = 'LMSMO'+self.mac.replace(/[^a-zA-Z0-9]/g, '');
    this.mac = self.mac;
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
        if (self.devices.mediaObject._data.state.state === 'off') {
          self.app.log.debug('Squeezebox - Toggle on/off - Switch ON');
          player.switchOn();
        } else {
          self.app.log.debug('Squeezebox - Toggle on/off - Switch OFF');
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
    , playerName: new displayText('playerName')
    , nowPlaying: new displayText('nowPlaying')
    , sendCommand: new displayText('commander')
    , volumeLevel: new volume()
    // , startPlay: new switchAct('play')
    // , pausePlay: new switchAct('pause')
    , isPlaying: new switchSensor('isPlaying')
  };

}

//
// a couple of helpers
//
function startsWith(search, s) {
    return s.substr(0,search.length) == search;
}

/**
 * Called whenever there is data from the Ninja Platform
 * This is required if Device.writable = true
 *
 * @param  {String} data The data received
 */
// Device.prototype.write = function(data) {
//   // I'm being actuated with data!
//   // but I can't be actuated
//         self.log.error('[ninja-logitechmediaserver] Was actuated, but should not have been');
// };
