var LogitechMediaServer = require('logitechmediaserver'),
    util = require('util'),
    stream = require('stream'),
    http = require('http'),
    https = require('https');

// ES: This code is horrid. Please fix it.

var log = console.log;

util.inherits(driver,stream);
util.inherits(LMSDevice,stream);


function driver(opts, app) {

  this._app = app;
  this._opts = opts;

  this._devices = [];
  var self = this;
  
  app.on('client::up',function(){
    self._app.log.info('(Squeezebox) Scanning 192.168.1.90...');
    self.scan('192.168.1.90','HOME',app);
    self._devices.forEach(function(player) {
      self._app.log.debug('(Squeezebox) : going to lister to logitech_event on player %s', player.id);      
      player.on("logitech_event", function(p) {
        self._app.log.debug('(Squeezebox) : logitech_event player num %s with event %s', player.id,p);      
      });
    });
  });
}

driver.prototype.config = function(rpc,cb) {

  var self = this;

  if (!rpc) {
    return cb(null,{"contents":[
      { "type": "submit", "name": "Add manually using IP address", "rpc_method": "addModal" },
    ]});
  }

  switch (rpc.method) {
    case 'addModal':
      cb(null, {
        "contents":[
          { "type": "paragraph", "text":"Please enter the IP address of the LMS instance as well a nickname."},
          { "type": "input_field_text", "field_name": "ip", "value": "", "label": "IP", "placeholder": "x.x.x.x", "required": true},
          { "type": "input_field_text", "field_name": "name", "value": "LMS", "label": "Name", "placeholder": "Home", "required": true},
          { "type": "submit", "name": "Add", "rpc_method": "add" }
        ]
      });
      break;
    case 'add':
      self.add(rpc.params.ip, rpc.params.name);
      cb(null, {
        "contents": [
          { "type":"paragraph", "text":"LMS at http://" + rpc.params.ip + ":9000 (name : " + rpc.params.name + ") added."},
          { "type":"close", "text":"Close"}
        ]
      });
      break;
    default:
      log('Unknown rpc method', rpc.method, rpc);
  }
};

driver.prototype.scan = function(host, name, app) {

  var self = this;
  //var server = new Object();
  //log('host is %s and name is %s',host, name);
  this.host = host;
  this.name = name && name.length > 0? name : host;
  this.app = app;

  //log('creating LMS...');
  var lms = new LogitechMediaServer(host);
    self._app.log.debug('(Squeezebox) : Creating connection to Logitech Media Server Host for %s', this.name);
    //console.log(lms);

  lms.on("registration_finished", function() {

    var playerCount = Object.keys(lms.players).length;
    self._app.log.debug('(Squeezebox) : Connection completed to Logitech Media Server Host, found %s players', playerCount);
    Object.keys(lms.players).forEach(function(data){
      self._app.log.debug('(Squeezebox) : Logitech player found at %s, adding to collection', data.toUpperCase());
      self.add(this.host, name, lms, data);
      self._app.log.debug('(Squeezebox) : Logitech player found at %s, now added', data.toUpperCase());
    })
  });
  //Start up the LMS scanner
  lms.start();
};

driver.prototype.add = function(ip, name, lms, mac) {
  var self = this;
  //console.log('**** about to add LMSDevice for %s', name);
  var _lmsDevice = new LMSDevice(ip, name, self._app, lms, mac);
  self._devices.push(_lmsDevice);

  Object.keys(_lmsDevice.devices).forEach(function(id) {
    self._app.log.debug('(Squeezebox) : Adding sub-device', id, _lmsDevice.devices[id].G);
    //log('Adding sub-device', id, _lmsDevice.devices[id].G);
    self.emit('register', _lmsDevice.devices[id]);
  });
};

module.exports = driver;

function LMSDevice(host, name, app, lms, mac) {

  var self = this;
  self.name = name.toUpperCase()+':'+mac;

  // set this collection of devices to a unique squeezebox
  player = lms.players[mac];

  // set subscriptions to each of the events
  'logitech_event,mode,property'
  .split(',').forEach(  function listenToNotification(eventName) {
    //console.log('listening to %s on %s',eventName,mac.toUpperCase());
    player.on(eventName, function(e) {
      //console.log('**** nb emit logitech event on %s for %s with value %s',mac.toUpperCase()+'-*-'+self.devices.displayProp.guid,eventName,e);
      self.devices.displayProp.emit('data', eventName+':'+e);
    });
  });

  'name'
  .split(',').forEach(  function listenToNotification(eventName) {
    //console.log('listening to %s on %s',eventName,mac.toUpperCase());
    player.on(eventName, function(e) {
      //console.log('**** nb emit logitech event on %s for %s with value %s',mac.toUpperCase()+'-*-'+self.devices.displayName.guid,eventName,e);
      self.devices.displayName.emit('data', 'name is '+e);
    });
  });

  'volume'
  .split(',').forEach(  function listenToNotification(eventName) {
    //console.log('listening to %s on %s',eventName,mac.toUpperCase());
    player.on(eventName, function(e) {
      //console.log('**** nb emit logitech event on %s for %s with value %s',mac.toUpperCase()+'-*-'+self.devices.soundVolume.guid,eventName,e);
      self.devices.soundVolume.emit('data', e);
    });
  });

  function hid() {
    this.readable = true;
    this.writeable = false;
    this.V = 0;
    this.D = 14;
    this.G = self.name.replace(/[^a-zA-Z0-9]/g, '');
  }
  util.inherits(hid, stream);

  function displayText(qual) {
    this.readable = true;
    this.writeable = false;
    this.V = 0;
    this.D = 240;
    this.G = qual+':'+self.name.replace(/[^a-zA-Z0-9]/g, '');
  }
  util.inherits(displayText, stream);

  function soundVolume() {
    this.readable = true;
    this.writeable = false;
    this.V = 0;
    this.D = 215;
    this.G = self.name.replace(/[^a-zA-Z0-9]/g, '');
  }
  util.inherits(soundVolume, stream);

  this.devices = {
    hid: new hid(),
    soundVolume: new soundVolume(),
    displayName: new displayText('name'),
    // camera: new camera(),
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

LMSDevice.prototype.end = function() {};
LMSDevice.prototype.close = function() {};


