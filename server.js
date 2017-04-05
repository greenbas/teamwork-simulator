var EMIT_ALL, PLAYER_LIST, PORT, PUPPET, Player, Puppet, SOCKET_LIST, UPDATE_TALLY, app, express, io, main, playerScan, serv;

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
        case player.input !== 0:
          console.log("STOP!");
          break;
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

EMIT_ALL = function(name, data) {
  var key, socket, _results;
  _results = [];
  for (key in SOCKET_LIST) {
    socket = SOCKET_LIST[key];
    _results.push(socket.emit(name, data));
  }
  return _results;
};

UPDATE_TALLY = function() {
  var inputs, key, player, total;
  total = Object.keys(PLAYER_LIST).length;
  inputs = 0;
  for (key in PLAYER_LIST) {
    player = PLAYER_LIST[key];
    if (!!player.input) {
      inputs++;
    }
  }
  return EMIT_ALL('updateTally', {
    msg: "" + inputs + "/" + total
  });
};

PUPPET = new Puppet();

io = require('socket.io')(serv, {});

io.sockets.on('connection', function(socket) {
  var player;
  player = void 0;
  socket.on('acknowledged', function() {
    socket.id = Math.random();
    console.log("NEW SOCKET " + socket.id);
    SOCKET_LIST[socket.id] = socket;
    player = new Player(socket.id);
    PLAYER_LIST[socket.id] = player;
    console.log("socket " + socket.id + " connected");
    return EMIT_ALL('updatePosition', {
      x: PUPPET.position.x,
      y: PUPPET.position.y
    });
  });
  socket.on("disconnect", function() {
    console.log("socket " + socket.id + " disconnected");
    delete SOCKET_LIST[socket.id];
    return delete PLAYER_LIST[socket.id];
  });
  socket.on('buttonPress', function(msg) {
    var e;
    try {
      console.log(player.getInput());
      player.setInput(msg.inputId);
      return console.log(player.getInput());
    } catch (_error) {
      e = _error;
      return socket.disconnect();
    }
  });
});

main = function() {
  var err, key, socket;
  UPDATE_TALLY();
  if (playerScan()) {
    try {
      PUPPET.update();
    } catch (_error) {
      err = _error;
      console.log(err);
    }
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
