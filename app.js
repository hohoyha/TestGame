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
     self.pressingAttack = false;
     self.mouseAngle = 0;
     self.maxSpd = 10;

     var super_udpate = self.update;
     self.update = function() {
         self.updateSpd();
         super_udpate();

          if(self.pressingAttack){
           self.shootBullet(self.mouseAngle);
        }   
     }

     self.shootBullet = function(angle) {
         var b = Bullet(angle);
            b.x = self.x;
            b.y = self.y;
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
         else if(data.inputId === 'attack' )
            player.pressingAttack = data.state;
         else if(data.inputId === 'mouseAngle' )
            player.mouseAngle = data.state;
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


var Bullet = function(angle) {
    var self  = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI) * 10;
    self.spdY = Math.sin(angle/180*Math.PI) * 10;

    self.time = 0;
    self.toRmove = false;
    var super_update = self.update;
    self.update = function() {
        if(self.time++ > 100)
            self.toRmove = true;
        super_update();
    }

    Bullet.list[self.id] = self;
    return self;
}
Bullet.list = {};

Bullet.update = function() {
    
    
    var pack =[];
    for( var i in Bullet.list){
        var bullet = Bullet.list[i];
        bullet.update(),
        pack.push({
            x:bullet.x,
            y:bullet.y,      
        });
    }
    return pack;
}

var DEBUG = true;

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    
    socket.id = Math.random();
    SOKET_LIST[socket.id] = socket;

    Player.onConnect(socket);

    socket.on('disconnect', function() {
        delete SOKET_LIST[socket.id];
        Player.onDisConnect(socket);
    });

    socket.on('sendMsgToServer', function(data) {
         var playerName = ("" + socket.id).slice(2, 7);

         for(var i in SOKET_LIST){
             SOKET_LIST[i].emit('addToChat', playerName + ': ' + data);
         }
    });

    socket.on('evalServer', function(data) {
         if(!DEBUG)
            return
         
         var res = eval(data);
         socket.emit('evalAnswer', res);
    });

});

setInterval(function() {
    var pack = {
        player : Player.update(),
        bullet : Bullet.update(),
    }

    for(var i in SOKET_LIST){
        var socket = SOKET_LIST[i];
        socket.emit('newPosition', pack);
    }


}, 1000/25);