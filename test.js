var opts = {};

var d = new (require('./index'))(opts, {
    on : function(x,cb){
        setTimeout(cb, 100);
    },
    once : function(x,cb){
        setTimeout(cb, 100);
    },
    log: {
        debug: console.log,
        info: console.log,
        warn: console.log,
        error: console.log
    },
    opts: {
        cloudHost : "zendo.ninja.is",
        apiHost : "api.ninja.is",
        streamHost : "stream.ninja.is"
    },
    token: 'XXX'
});

d.save = function() {
    console.log('Driver.save', opts);
};

d.on('register', function(value) {
    console.log('Driver.register');

    //console.log('Registered device : ', value.name);
    var device = value;

    device.on('data', function(data) {
        console.log('Device "' + device.name + '" emitted data - ' + data);
        console.log(JSON.stringify(data));
   });

    device.on('wrote', function(data) {
        //console.log('Device "' + device.name + '" wrote data - ' + data);
   });

    setTimeout(function() {
        device.write('');
    }, 1000000);

});
