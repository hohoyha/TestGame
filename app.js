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
    SOKET_LIST[socket.id] = socket;
    

    socket.on('happy', function(data){
        console.log(data);
    });

    socket.emit('serverMsg',{
        msg:'hello Hoo'
    });
});

setInterval(function() {
    for( var i in SOKET_LIST){
        var socket = SOKET_LIST[i];
        socket.x++;
        socket.y++;
        socket.emit('newPosition',{
            x:socket.x,
            y:socket.y
        });
    }
}, 1000/25);