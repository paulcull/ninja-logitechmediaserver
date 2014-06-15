var LogitechMediaServer = require('logitechmediaserver'),
    util = require('util'),
    stream = require('stream'),
    LMSDevice = require('./lib/device'),
    configHandlers = require('./lib/config-handlers'),
    messages = require('./lib/config-messages');

//these are in the config options, so replaced
var lmsip = 'localhost';
var lmsport = '9000';
var lmscliport = '9090';
var lmsname = 'HOME';
var remote_url = 'localhost';

// these are constants
var log = console.log;
var spotify_track_prefix = 'spotify:track:';
var spotify_url_start = '/oembed/?url=spotify:track:';
var spotify_host = 'embed.spotify.com';

// stream links
util.inherits(driver,stream);
//util.inherits(LMSDevice,stream);

function driver(opts, app) {

  this._app = app;
  this._opts = opts;

  this._devices = [];
  this._lms = null;
  var self = this;

  app.once('client::up',function(){
    //
    if (!opts.hasSentAnnouncement) {
      self.emit('announcement',messages.hello);
      opts.hasSentAnnouncement = true;
      self.save();
    }
    if (!opts.lmsip) {
      opts.lmsip = lmsip;
      self.save(); 
    }
    if (!opts.lmsport) {
      opts.lmsport = lmsport;
      self.save(); 
    }
    if (!opts.lmscliport) {
      opts.lmscliport = lmscliport;
      self.save(); 
    }
    if (!opts.lmsname) {
      opts.lmsname = lmsname;
      self.save();
    }
    if (!opts.remote_url) {
      opts.remote_url = remote_url;
      self.save();
    }
    //Look for players
    self.scan(opts,app);
  });
}
//
driver.prototype.config = function(rpc,cb) {
  var self = this;
  // If rpc is null, we should send the user a menu of what he/she
  // can do.
  // If its to rescan - just do it straight away
  // Otherwise, we will try action the rpc method
  if (!rpc) {
    return configHandlers.menu.call(this,this._opts.lmsip,this._opts.lmsport,this._opts.lmscliport,this._opts.lmsname,this._opts.remote_url,cb);
  }
  else if (rpc.method === 'scan') {
    self._app.log.debug('(Squeezebox) : about to re-scan');
    this.scan(this._opts,this._app);
  }
  else if (typeof configHandlers[rpc.method] === "function") {
    return configHandlers[rpc.method].call(this,this._opts,rpc.params,cb);
  }
  else {
    return cb(true);
  }
};
//
driver.prototype.scan = function(opts, app) {
  this.host = opts.lmsip;
  this.lmscliport = opts.lmscliport;
  this.name = opts.lmsname.length > 0? opts.lmsname : opts.lmsip;
  this.app = app;

  var self = this;

  self._app.log.debug('(Squeezebox) : Creating connection to Logitech Media Server Host for %s at host %s', this.name, this.host);
  lms = new LogitechMediaServer(this.host, this.lmscliport);
  //
  lms.on("registration_finished", function() {
    //
    var playerCount = Object.keys(lms.players).length;
    self._app.log.debug('(Squeezebox) : Connection completed to Logitech Media Server Host, found %s players', playerCount);
    Object.keys(lms.players).forEach(function(mac){
      self._app.log.debug('(Squeezebox) : Logitech player found at %s, adding to collection', mac.toUpperCase());
      self.add(opts, lms, mac);
      self._app.log.debug('(Squeezebox) : Logitech player found at %s, now added', mac.toUpperCase());
    });
  });
  lms.on("lms_log", function(logData) {
    self._app.log.debug('(Squeezebox) : Raw Server Log :', logData);
  });
  //Start up the LMS scanner
  lms.start();
};

driver.prototype.add = function(opts, lms, mac) {
  var self = this;
  var parentDevice = new LMSDevice(opts, self._app, lms.players[mac], mac);
  Object.keys(parentDevice.devices).forEach(function(id) {
    self.app.log.debug('(Squeezebox) : Adding sub-device',opts.lmsip, mac, id, parentDevice.devices[id].G);
    self.emit('register', parentDevice.devices[id]);
  });
};
//
module.exports = driver;
//
//



