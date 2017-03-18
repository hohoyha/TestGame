var express = require('express');
var app = express();
var serv = require('http').createServer(app);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);

var SOKET_LIST = {};


var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    
    socket.id = Math.random();
    socket.x = 0;
    socket.y = 0;
    socket.number = "" + Math.floor(10 
    * Math.random());

    SOKET_LIST[socket.id] = socket;
    
    socket.on('disconnect', function() {
        delete SOKET_LIST[socket.id];
    });

});

setInterval(function() {

    var pack =[];
    for( var i in SOKET_LIST){
        var socket = SOKET_LIST[i];
        socket.x++;
        socket.y++;
        pack.push({
            x:socket.x,
            y:socket.y,
            number:socket.number       
        });
    }

    for(var i in SOKET_LIST){
        var socket = SOKET_LIST[i];
        socket.emit('newPosition', pack);
    }


}, 1000/25);