exports.menu = {
  "contents":[
    { "type": "paragraph", "text": "Welcome to the Logitech Media Server driver."},
    { "type": "paragraph", "text": "Please enter the IP address of the Logitech Media Server instance as well a nickname and remote url"},
    { "type": "input_field_text", "field_name": "lmsip", "value": "", "label": "Server IP Address", "required": true},
    { "type": "input_field_text", "field_name": "lmsport", "value": "", "label": "Server Port Number", "required": true},
    { "type": "input_field_text", "field_name": "lmscliport", "value": "", "label": "Server CLI Port Number", "required": true},
    { "type": "input_field_text", "field_name": "lmsname", "value": "", "label": "Server Name", "required": true},
    { "type": "input_field_text", "field_name": "remote_url", "value": "", "label": "Remote Coverart URL", "required": true},
    { "type": "submit", "name": "Save Server details", "rpc_method": "echo" },
  ]
};

exports.echo = {
  "contents":[
    { "type": "heading", "text": "Conguration Saved"},
    { "type": "paragraph", "text": "Click Scan below to rescan for the server and new players"},
    { "type": "submit", "name": "Re-Scan", "rpc_method": "scan" },
    { "type": "close", "name": "Close", "rpc_method": "close" },
  ]
};

exports.echo = {
  "contents":[
    { "type": "heading", "text": "Conguration Saved"},
    { "type": "paragraph", "text": "You have stored the settings below in your configuration."},
    { "type": "paragraph", "text": "IP: "},
    { "type": "paragraph", "text": "Port: "},
    { "type": "paragraph", "text": "CLI Port: "},
    { "type": "paragraph", "text": "Name: "},    
    { "type": "paragraph", "text": "Coverart URL: "},    
    { "type": "heading", "text": "Click Scan below to rescan the server"},
    { "type": "submit", "name": "Re-Scan", "rpc_method": "scan" },
    { "type": "close", "name": "Close", "rpc_method": "close" },
  ]
};

exports.hello = {
  "contents": [
    { "type": "heading",      "text": "Logitech Media Server driver Loaded" },
    { "type": "paragraph",    "text": "The Logitech Media Server driver has been loaded. You should not see this message again." }
  ]
};

exports.foundPlayer = {
  "contents": [
    { "type": "heading",      "text": "Logitech Media Server - Player Found" },
    { "type": "paragraph",    "text": "The Logitech Media Server driver has been loaded. You should not see this message again." }
  ]
};