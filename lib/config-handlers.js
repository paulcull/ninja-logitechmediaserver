var configMessages = require('./config-messages');

/** TODO use config to hold the device name string **/

/**
 * Called from the driver's config method when a
 * user wants to see a menu to configure the driver
 * @param  {Function} cb Callback to send a response back to the user
 */
exports.menu = function(opts_string_ip, opts_string_port, opts_string_name, opts_string_remote_url, cb) {
  var returnMenu = configMessages.menu;
  returnMenu.contents[2].value = opts_string_ip;
  returnMenu.contents[3].value = opts_string_port;  
  returnMenu.contents[4].value = opts_string_name;
  returnMenu.contents[5].value = opts_string_remote_url;
  cb(null,configMessages.menu);
};

/**
 * Called when a user clicks the 'submit'
 * button we sent in the menu request
 * @param  {Object}   params Parameter object
 * @param  {Function} cb     Callback to send back to the user
 */
exports.echo = function(opts,params,cb) {

  var echoText = params.echoText;
  var payloadToSend = configMessages.echo;
  opts.lmsip = params.lmsip;
  opts.lmsport = params.lmsport;
  opts.lmsname = params.lmsname;
  opts.remote_url = params.remote_url;
  this.save();

  if (payloadToSend.contents[1]) {
      payloadToSend.contents[2].text = "IP: "+params.lmsip;
      payloadToSend.contents[3].text = "Port: "+params.lmsport;
      payloadToSend.contents[4].text = "Name: "+params.lmsname;
      payloadToSend.contents[5].text = "Remote URL: "+params.remote_url;
  } else {
  	  // no response string
    payloadToSend.contents.push({ "type": "paragraph", "text": "IP: "+params.lmsip });
    payloadToSend.contents.push({ "type": "paragraph", "text": "Port: "+params.lmsport });
    payloadToSend.contents.push({ "type": "paragraph", "text": "Name: "+params.lmsname });
    payloadToSend.contents.push({ "type": "paragraph", "text": "Remote URL: "+params.remote_url });
	  payloadToSend.contents.push({ "type": "close"    , "name": "Close" });
  }

  cb(null,payloadToSend);
};

