var express = require('express');
var app = express();
var serv = require('http').createServer(app);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);

var SOKET_LIST = {};
var PLAYER_LIST = {};

var Player = function(id) {
    var self = {
        x:250,
        y:250,
        id:id,
        number:"" + Math.floor(10 * Math.random()),
        pressRight:false,
        pressLeft:false,
        pressUp:false,
        pressDown:false,
        maxSpd:10,
    }

    self.updatePosition = function(){
        if(self.pressRight)
            self.x += self.maxSpd;
        if(self.pressLeft)
            self.x -= self.maxSpd;
        if(self.pressUp)
            self.y += self.maxSpd;
        if(self.pressDown)
            self.y -= self.maxSpd;
    }

    return self;
}



var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    
    socket.id = Math.random();
    SOKET_LIST[socket.id] = socket;

    var player = Player(socket.id);
    PLAYER_LIST[socket.id] = player;
    
    socket.on('disconnect', function() {
        delete SOKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
    });

    socket.on('keyPress', function(data){
        if(data.inputId === 'left' )
            player.pressLeft = data.state;
        else if(data.inputId === 'right' )
            player.pressRight = data.state;
        else if(data.inputId === 'up' )
            player.pressUp = data.state;
        else if(data.inputId === 'down' )
            player.pressDown = data.state;
    });

});

setInterval(function() {

    var pack =[];
    for( var i in PLAYER_LIST){
        var player = PLAYER_LIST[i];
        player.updatePosition(),
        pack.push({
            x:player.x,
            y:player.y,
            number:player.number       
        });
    }

    for(var i in SOKET_LIST){
        var socket = SOKET_LIST[i];
        socket.emit('newPosition', pack);
    }


}, 1000/25);