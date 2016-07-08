var quik = require('express')();
var http = require('http').Server(quik);
var io = require('socket.io')(http);
var sanitizeHtml = require('sanitize-html');
var geoip = require('geoip-lite');
var swearjar = require('swearjar');
var os = require('os');
var clients = [];
var usrs_connected = 0;
quik.get('/css/quik.css', function(req, res) {
    res.sendFile(__dirname + '/css/quik.css');
});
quik.get('/branding/favicon.ico', function(req, res) {
    res.sendFile(__dirname + '/branding/favicon.ico');
});
/* Dashboard info */
quik.get('/dash/sysdat', function(req, res) {
    if (process.platform === 'win32') {
        res.send(
            '501 Not Implemented (SYSDAT NOT SUPPORTED ON WINDOWS)'
        );
    } else {
        res.send('200 OK');
    }
});
quik.get('/dash/usrdat', function(req, res) {
    res.send(clients.toString());
});
/* Branding related requests */
quik.get('/branding/logo.png', function(req, res) {
    res.sendFile(__dirname + '/branding/logo.png');
});
quik.get('/branding/theme', function(req, res) {
    res.sendFile(__dirname + '/branding/theme');
});
/* End of branding related requests */
quik.get('/', function(req, res) {
    res.sendFile(__dirname + '/chat.html');
});
quik.get('/firebase', function(req, res) {
    res.sendFile(__dirname + '/firebase.html');
});
quik.get('/dash', function(req, res) {
    res.sendFile(__dirname + '/dash.html');
});
quik.get('/notify.mp3', function(req, res) {
    res.sendFile(__dirname + '/notify.mp3');
});
//The 404 Route (ALWAYS Keep this as the last route)
quik.get('*', function(req, res) {
    console.log('404 @ ' + req.originalUrl);
    res.status(404);
    res.sendFile(__dirname + '/404.html');
});
http.listen(80, function() {
    console.log('Launched Quik on :80');
});
/*
	ON CONNECTION
*/
io.on('connection', function(socket) {
    socket.emit('chat message',
        'Notice --DELIM-- Connection established');
    socket.emit('chat message',
        'Notice --DELIM-- This quiklication is released under the Apache 2.0 License, hack on the source at https://github.com/Matt-Allen44/Quik'
    );
    socket.emit('chat message',
        'Notice --DELIM-- This chat room is logged and users must comply with the TOS'
    );
    clients.push([
        socket.id,
          socket.conn.remoteAddress,
            ipLookup(socket.conn.remoteAddress).region,
                  ipLookup(socket.conn.remoteAddress).country,
                    Math.floor(new Date() / 1000)
    ]);
    usrs_connected = usrs_connected + 1;
    io.emit('connectEvent', usrs_connected);
    socket.on('disconnect', function() {
        usrs_connected = usrs_connected - 1;
        console.log(usrs_connected + ' users connected');
        io.emit('disconnectEvent', usrs_connected);
    });
    socket.on('chat message', function(msg) {
        msg = sanitizeHtml(msg);
        //Check if users name is empty
        if (msg.split('--DELIM--')[0].length === 0) {
            socket.emit('chat message',
                'Server --DELIM-- Connection Refused (invalid name)'
            );
            socket.emit('chat message',
                'Server --DELIM-- Your IP (' + socket.conn.remoteAddress +
                ') has been logged.');
            socket.disconnect();
        }
        //Check if users name is too llong
        if (msg.split('--DELIM--')[0].length > 10) {
            socket.emit('chat message',
                'Server --DELIM-- Connection Refused (name to long)'
            );
            socket.emit('chat message',
                'Server --DELIM-- Your IP (' + socket.conn.remoteAddress +
                ') has been logged.');
            socket.disconnect();
        }
        if (0 === msg.length) {
            socket.emit('chat message',
                'Server --DELIM-- Empty message removed');
            console.log('> empty message removed');
        } else {
            console.log(socket.conn.remoteAddress + ' [' +
                ipLookup(socket.conn.remoteAddress).city +
                '] ' + msg.replace('--DELIM--', ':'));
            io.emit('chat message', swearjar.censor(msg));
        }
    });
});

function ipLookup(ip) {
    if (ip == '127.0.0.1' || ip == 'localhost' || ip == '::1') {
        var array = {
            city: 'Local Client', region: 'Local Client', country: 'Local Client'
        };
        return array;
    } else {
        console.log(ip);
        return geoip.lookup(ip);
    }
}
