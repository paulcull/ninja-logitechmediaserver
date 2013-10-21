var LogitechMediaServer = require('logitechmediaserver'),
    util = require('util'),
    stream = require('stream'),
    http = require('http'),
    https = require('https');
    configHandlers = require('./lib/config-handlers');
    messages = require('./lib/config-messages');

// ES: This code is horrid. Please fix it.

var log = console.log;
var lmsip = '192.168.1.90';
var lmsname = 'HOME'

util.inherits(driver,stream);
util.inherits(LMSDevice,stream);


function driver(opts, app) {


//      host:self._app.opts.lmsip,

  this._app = app;
  this._opts = opts;

  this._devices = [];
  var self = this;
  
  app.on('client::up',function(){

    if (!opts.hasSentAnnouncement) {
      self.emit('announcement',messages.hello);
      opts.hasSentAnnouncement = true;
      self.save();
    }
    if (!opts.lmsip) {
      opts.lmsip = lmsip;
      self.save(); 
    }
    if (!opts.lmsname) {
      opts.lmsname = lmsname;
      self.save();
    }

    self._app.log.info('(Squeezebox) Scanning %s...',opts.lmsip);
    self.scan(opts.lmsip,opts.lmsname,app);
    self._devices.forEach(function(player) {
      self._app.log.debug('(Squeezebox) : going to lister  on player %s', player.id);      
      player.on("logitech_event", function(p) {
        self._app.log.debug('(Squeezebox) : logitech_event player num %s with event %s', player.id,p);      
      });
    });
  });
}

driver.prototype.config = function(rpc,cb) {



  var self = this;
  // If rpc is null, we should send the user a menu of what he/she
  // can do.
  // If its to rescan - just do it straight away
  // Otherwise, we will try action the rpc method
  if (!rpc) {
    return configHandlers.menu.call(this,this._opts.lmsip,lmsname,cb);
  }
  else if (rpc.method === 'scan') {
    self._app.log.debug('(Squeezebox) : about to re-scan');
    this.scan(opts.lmsip,opts.lmsname,app);
  }
  else if (typeof configHandlers[rpc.method] === "function") {
    return configHandlers[rpc.method].call(this,this._opts,rpc.params,cb);
  }
  else {
    return cb(true);
  }
};


driver.prototype.scan = function(host, name, app) {

  var self = this;
  this.host = host;
  this.name = name && name.length > 0? name : host;
  this.app = app;

  self._app.log.debug('(Squeezebox) : Creating connection to Logitech Media Server Host for %s at host %s', this.name, this.host);
  var lms = new LogitechMediaServer(host);

  lms.on("registration_finished", function() {

    var playerCount = Object.keys(lms.players).length;
    self._app.log.debug('(Squeezebox) : Connection completed to Logitech Media Server Host, found %s players', playerCount);
    Object.keys(lms.players).forEach(function(data){
      self._app.log.debug('(Squeezebox) : Logitech player found at %s, adding to collection', data.toUpperCase());
      self.add(host, name, lms, data);
      self._app.log.debug('(Squeezebox) : Logitech player found at %s, now added', data.toUpperCase());
    })
  });
  //Start up the LMS scanner
  lms.start();
};

driver.prototype.add = function(host, name, lms, mac) {
  var self = this;
  var _lmsDevice = new LMSDevice(host, name, self._app, lms, mac, self);
  console.log("getting to add device called %s", lms.players[mac].name);
  // var _lmsDevice = new LMSDevice(host, lms.players[mac].name, self._app, lms, mac);
  self._devices.push(_lmsDevice);

  // Object.keys(_lmsDevice.devices).forEach(function(id) {
  //   self._app.log.debug('(Squeezebox) : Adding sub-device',host, id, _lmsDevice.devices[id].G);
  //   self.emit('register', _lmsDevice.devices[id]);
  // });
};

module.exports = driver;

function LMSDevice(host, name, app, lms, mac, emitter) {

  var self = this;
  //self.name = name.toUpperCase()+':'+mac;
  self.mac = mac;

  this.app = app;
  this.host = host;

  // set this collection of devices to a unique squeezebox
  player = lms.players[mac];
  //name = player.getName

  // set subscriptions to each of the events
  'logitech_event,property'
  .split(',').forEach(  function listenToNotification(eventName) {
    //self.app.log.debug('listening to %s on %s',eventName,mac.toUpperCase());
    player.on(eventName, function(e) {
      ninja.devices('**** nb emit logitech event on %s for %s with value %s',mac.toUpperCase()+'-*-'+self.devices.displayProp.guid,eventName,e);
      self.devices.displayProp.emit('data', eventName+':'+e);
    });
  });

  'name'
  .split(',').forEach(  function listenToNotification(eventName) {
    //self.app.log.debug('listening to %s on %s',eventName,mac.toUpperCase());
    player.on(eventName, function(e) {
      self.app.log.debug("******** +++++ got name command with : %s", e);
      if (self.name != e) {
        Object.keys(self.devices).forEach(function(id) {
          self.name = e;
          self.app.log.debug('(Squeezebox) : Adding sub-device',host, self.name, id, self.devices[id].G);
          self.devices[id].name = self.name+self.devices[id]._name;
          self.app.log.debug("Device is %s", JSON.stringify(self.devices[id]));
          emitter.emit('register', self.devices[id]);
        });
      } else
      { 
          self.app.log.debug('In this part of the code for LMS');
      }
      //console.log('**** nb emit name event on %s for %s with value %s',mac.toUpperCase()+'-*-'+self.devices.displayName.guid,eventName,e);
      self.devices.displayName.emit('name',e);
      self.devices.displayName.emit('data', 'name is '+e);

      // push back into the driver part, but wait for the names to be collected before trying to udpate anything


    });
  });

  'songId'
  .split(',').forEach(  function listenToNotification(eventName) {
    //console.log('listening to %s on %s',eventName,mac.toUpperCase());
    player.on(eventName, function(e) {
      //console.log('**** nb emit songID event on %s for %s with value %s',mac.toUpperCase()+'-*-'+self.devices.displayName.guid,eventName,e);
      //self.devices.displayName.emit('name',e);
      //self.devices.displayName.emit('data', 'name is '+e);
      //console.log('**** nb emit coverart action with host: %s',this.host);
      //self.devices.coverArt.emit('data',e);
      self.devices.coverArt.write('NIL');
    });
  });

  'playlist'
  .split(',').forEach(  function listenToNotification(eventName) {
    //console.log('listening to %s on %s',eventName,mac.toUpperCase());
    player.on(eventName, function(e) {
      self.app.log.debug('**** nb emit logitech playlist on %s for %s with value %s',mac.toUpperCase()+'-*-'+self.devices.displayName.guid,eventName,e);
      if (e === 'playlist pause 0') {
        //console.log('**** nb emit logitech un pause on %s for %s with value %s',mac.toUpperCase()+'-*-'+self.devices.displayName.guid,eventName,e);
        self.devices.displayPlay.emit('data', 'playlist is '+e);
      } else if (startsWith("playlist open file", e)) {
        var mediaFileName = e.substr(14,(e.length-14));
        player.getSongInfo(mediaFileName);
        //console.log('**** nb emit logitech playlist file on %s for %s with file as %s',mac.toUpperCase()+'-*-'+self.devices.displayName.guid,eventName,mediaFileName);        
      } else {
        //console.log('**** nb emit logitech playlist on %s for %s with value %s',mac.toUpperCase()+'-*-'+self.devices.displayName.guid,eventName,e);
        self.devices.displayPlay.emit('data', 'playlist is '+e);
      }
    });
  });

  'volume'
  .split(',').forEach(  function listenToNotification(eventName) {
    //console.log('listening to %s on %s',eventName,mac.toUpperCase());
    player.on(eventName, function(e) {
      //console.log('**** nb emit logitech event on %s for %s with value %s compensated to %s',mac.toUpperCase()+'-*-'+self.devices.soundVolume.guid,eventName,e,player.getNoiseLevel());      
      //allow volume to compensate if switched off
      self.devices.soundVolume.emit('data',player.getNoiseLevel());
    });
  });

  'powerState'
  .split(',').forEach(  function listenToNotification(eventName) {
    //console.log('listening to %s on %s',eventName,mac.toUpperCase());
    player.on(eventName, function(e) {
      var _state = e.substr(20,(e.length-20));
      //console.log('old is %s : new is %s',e,_state);
      //console.log('**** nb emit powerState event on %s for %s with value %s',mac.toUpperCase()+'-*-'+self.devices.soundVolume.guid,eventName,_state);      
      self.devices.powerState.emit('data',_state);
    });
  });



  function hid() {
    this.readable = true;
    this.writeable = false;
    this.V = 0;
    this.D = 14;
    //this.G = self.mac;
    this.G = self.mac.replace(/[^a-zA-Z0-9]/g, '');
    this._name = ' - HID';
  }
  util.inherits(hid, stream);

  function displayText(qual) {
    this.readable = true;
    this.writeable = false;
    this.qual = qual;
    this.V = 0;
    this.D = 240;
    //this.G = self.mac;
    this.G = qual+''+self.mac.replace(/[^a-zA-Z0-9]/g, '');
    this._name = ' - Text ['+qual+']';
  }
  util.inherits(displayText, stream);
  displayText.prototype.write = function(data) {
    self._app.log.debug('Squeezebox - received text to display for %s : %s', this.G, data);
    //self._xbmc.message(data);
    return true;
  };

  function switchState() {
    this.readable = true;
    this.writeable = true;
    this.V = 0;
    this.D = 207;
    this.G = self.mac.replace(/[^a-zA-Z0-9]/g, '');
    //this.G = self.mac;
    this._name = ' - Switch On/Off';

  }
  util.inherits(switchState, stream);
  switchState.prototype.write = function(data) {
    self._app.log.debug('Squeezebox - received switchState to display for %s : %s', this.G, data);

    return true;
  };

  function soundVolume() {
    this.readable = true;
    this.writeable = false;
    this.V = 0;
    this.D = 215;
    this.G = self.mac.replace(/[^a-zA-Z0-9]/g, '');
    //this.G = self.mac;
    this._name = ' - Volume';

  }
  util.inherits(soundVolume, stream);
  soundVolume.prototype.write = function(data) {
    self._app.log.debug('Squeezebox - received volume for %s : %s', this.G, data);
    //self._xbmc.message(data);
    return true;
  };

  function camera(host) {
    this.writeable = true;
    this.readable = true;
    this.playerName = self.mac;
    this.V = 0;
    this.D = 1004;
    //this.G = self.mac;
    this.G = self.mac.replace(/[^a-zA-Z0-9]/g, '');
    this._guid = [self.app.id,this.G,this.V,this.D].join('_');
    this._name = " - Cover Art Viewer";
    this.host = host;
  }
  util.inherits(camera, stream);
  camera.prototype.write = function(data) {
//  camera.prototype.write = function() {
    // self._app.log.debug('Squeezebox - received camera for %s : %s', this.G, data);
console.log('Squeezebox - received camera for %s : %s', this.G, data);

    var postOptions = {
      host:self.app.opts.streamHost,
      port:self.app.opts.streamPort,
      // host:lmsip,
      // port:9000,
      path:'/rest/v0/camera/'+this._guid+'/snapshot',
      method:'POST'
    };

    console.log(JSON.stringify(postOptions));

    var proto = (self.app.opts.streamPort==443) ? https:http;

    console.log('Requesting current playing');

//          var thumbnail = "http://" + this.host + ':9000/music/' + encodeURIComponent(songId) + '/cover.jpg';
          var thumbnail = "http://" + this.host + ':9000/music/current/cover.jpg?player=' + this.playerName;

          console.log('Sending thumbnail : ' + thumbnail);

          var getReq = http.get(thumbnail,function(getRes) {

  
  postOptions.headers = {

    'Content-Type' : 'image/jpeg'
    , 'Expires' : 'Mon, 3 Jan 2000 12:34:56 GMT'
    , 'Pragma' : 'no-cache'
    , 'transfer-encoding' : 'chunked'
    , 'Connection' : 'keep-alive'
    , 'X-Ninja-Token' : self.app.token
  };
            //postOptions.headers = getRes.headers;
            //postOptions.headers['X-Ninja-Token'] = self.app.token;
            console.log('token', self.app.token);

            var postReq = proto.request(postOptions,function(postRes) {

              postRes.on('end',function() {
                console.log('Stream Server ended');
              });
              postRes.resume();
            });

            postReq.on('error',function(err) {
              console.log('Error sending picture: ');
              console.log(err);
            });

            var lenWrote=0;
            getRes.on('data',function(data) {
              postReq.write(data,'binary');
              lenWrote+=data.length;
            });

            getRes.on('end',function() {
              postReq.end();
              console.log("Image sent %s",lenWrote);
            });
            getRes.resume();
          });
          getReq.on('error',function(error) {
            console.log(error);
          });
          getReq.end();

        //});

    return true;
  };


  this.devices = {
    hid: new hid(),
    soundVolume: new soundVolume(),
    powerState: new switchState(),
    displayName: new displayText('name'),
    displayPlay: new displayText('play'),
    coverArt: new camera(host),
    displayProp: new displayText('prop')
  };
  //console.log(JSON.stringify(this.devices));
}

// LMSDevice.prototype.getInfoLabels = function(labels, cb) {
// log('xxx', labels);
//   // this._lms.player.api.send('XBMC.GetInfoLabels', {
//   //   labels: labels
//   // }).then(function(data) {
//   //   log('xxx', data);
//   //   cb(data.result);
//   // });
// };

// a couple of helpers

function startsWith(search, s) {
    return s.substr(0,search.length) == search;
}

LMSDevice.prototype.end = function() {};
LMSDevice.prototype.close = function() {};


