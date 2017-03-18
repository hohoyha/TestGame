var express = require('express');
var app = express();
var serv = require('http').createServer(app);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);

var SOKET_LIST = {};


var Entity = function() {
    var self = {
        x:250,
        y:250,
        spdX:0,
        spdY:0,
        id:"",
    }
    self.update = function() {
        self.updatePosition();
    }
    self.updatePosition = function() {
        self.x += self.spdX;
        self.y += self.spdY;
    }

    return self;
}

var Player = function(id) {
    
    var self = Entity();
     self.id = id;
     self.number = "" + Math.floor(10 * Math.random());
     self.pressRight = false;
     self.pressLeft = false;
     self.pressUp = false;
     self.pressDown = false;
     self.maxSpd = 10;

     var super_udpate = self.update;
     self.update = function() {
         self.updateSpd();
         super_udpate();
     }


     self.updateSpd = function(){
        if(self.pressRight)
            self.spdX = self.maxSpd;
        else if(self.pressLeft)
            self.spdX = -self.maxSpd;
        else    
            self.spdX = 0;

        if(self.pressUp)
            self.spdY = -self.maxSpd;
        else if(self.pressDown)
            self.spdY = self.maxSpd;
        else
            self.spdY = 0;
     }

     Player.list[id] = self;

    return self;
}

Player.list = {};
Player.onConnect = function(socket){
     var player = Player(socket.id);

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
}

Player.onDisConnect = function(socket) {
    delete Player.list[socket.id];
}

Player.update = function() {
     var pack =[];
    for( var i in Player.list){
        var player = Player.list[i];
        player.update(),
        pack.push({
            x:player.x,
            y:player.y,
            number:player.number       
        });
    }
    return pack;
}

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    
    socket.id = Math.random();
    SOKET_LIST[socket.id] = socket;

    Player.onConnect(socket);

    socket.on('disconnect', function() {
        delete SOKET_LIST[socket.id];
        Player.onDisConnect(socket);
    });

});

setInterval(function() {
    var pack = Player.update();
   
    for(var i in SOKET_LIST){
        var socket = SOKET_LIST[i];
        socket.emit('newPosition', pack);
    }


}, 1000/25);