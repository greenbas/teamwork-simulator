var PLAYER_LIST, PORT, PUPPET, Player, Puppet, SOCKET_LIST, app, express, io, main, playerScan, serv;

PORT = process.env.PORT || 3000;

express = require('express');

app = express();

serv = require('http').Server(app);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express["static"](__dirname + '/client'));

serv.listen(PORT);

console.log('Server started.');

Player = (function() {
  function Player(id) {
    this.id = id;
    this.input = 0;
  }

  Player.prototype.castVote = function() {};

  Player.prototype.setInput = function(n) {
    return this.input = n;
  };

  Player.prototype.getInput = function() {
    return this.input;
  };

  Player.prototype.resetInput = function() {
    return this.input = 0;
  };

  return Player;

})();

Puppet = (function() {
  function Puppet() {
    this.position = {
      x: 250,
      y: 250,
      f: 1
    };
  }

  Puppet.prototype.update = function() {
    var id, player;
    for (id in PLAYER_LIST) {
      player = PLAYER_LIST[id];
      switch (false) {
        case player.input !== 1:
          console.log("RIGHT!");
          this.position.x += 10;
          break;
        case player.input !== 2:
          console.log("UP!");
          this.position.y -= 10;
          break;
        case player.input !== 3:
          console.log("LEFT!");
          this.position.x -= 10;
          break;
        case player.input !== 4:
          console.log("DOWN!");
          this.position.y += 10;
          break;
        default:
          throw new Error("invalid");
      }
      player.resetInput();
    }
  };

  return Puppet;

})();

SOCKET_LIST = {};

PLAYER_LIST = {};

PUPPET = new Puppet();

io = require('socket.io')(serv, {});

io.sockets.on('connection', function(socket) {
  var player;
  socket.id = Math.random();
  console.log("NEW SOCKET " + socket.id);
  SOCKET_LIST[socket.id] = socket;
  player = new Player(socket.id);
  PLAYER_LIST[socket.id] = player;
  console.log("socket " + socket.id + " connected");
  socket.on("disconnect", function() {
    console.log("socket " + socket.id + " disconnected");
    delete SOCKET_LIST[socket.id];
    return delete PLAYER_LIST[socket.id];
  });
  socket.on('buttonPress', function(msg) {
    var inputs, key, total;
    console.log(player.getInput());
    player.setInput(msg.inputId);
    total = Object.keys(PLAYER_LIST).length;
    inputs = 0;
    for (key in PLAYER_LIST) {
      player = PLAYER_LIST[key];
      if (!!player.input) {
        inputs++;
      } else {
        0;
      }
    }
    return socket.emit('updateTally', {
      msg: "" + inputs + "/" + total
    });
  });
  socket.emit('serverMsg', {
    msg: 'hello'
  });
});

main = function() {
  var key, socket;
  if (playerScan()) {
    PUPPET.update();
    for (key in SOCKET_LIST) {
      socket = SOCKET_LIST[key];
      console.log("updating socket " + key);
      socket.emit('updatePosition', {
        x: PUPPET.position.x,
        y: PUPPET.position.y
      });
    }
  } else {
    0;
  }
};

playerScan = function() {
  var id, player, res;
  res = true;
  for (id in PLAYER_LIST) {
    player = PLAYER_LIST[id];
    res = res && !!player.input;
  }
  return res;
};

setInterval(main, 1000 / 25);