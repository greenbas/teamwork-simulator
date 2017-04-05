var COLLISION_DETECTION, EMIT_ALL, GOALS, GOAL_DETECTION, Goal, PLAYER_LIST, PORT, PUPPET, Player, Puppet, SOCKET_LIST, UPDATE_TALLY, app, express, io, main, playerScan, serv;

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
  function Player(id, name) {
    this.id = id;
    this.name = name;
    this.input = -1;
  }

  Player.prototype.castVote = function() {};

  Player.prototype.setInput = function(n) {
    return this.input = n;
  };

  Player.prototype.getInput = function() {
    return this.input;
  };

  Player.prototype.resetInput = function() {
    return this.input = -1;
  };

  return Player;

})();

COLLISION_DETECTION = function(rect1, rect2) {
  console.log("cond1 " + rect1.x + "  < " + (rect2.x + 10), "cond2 " + (rect1.x + 10) + " > " + rect2.x, "cond3  " + rect1.y + " < " + (rect2.y + 10), "cond4 " + (10 + rect1.y) + " > " + rect2.y);
  if ((rect1.x < (rect2.x + 10)) && ((rect1.x + 10) > rect2.x) && (rect1.y < (rect2.y + 10)) && ((10 + rect1.y) > rect2.y)) {
    return true;
  } else {
    return false;
  }
};

Goal = (function() {
  function Goal(x, y) {
    this.x = x;
    this.y = y;
  }

  return Goal;

})();

GOALS = [
  {
    x: 100,
    y: 300
  }, {
    x: 300,
    y: 100
  }, {
    x: 25,
    y: 400
  }, {
    x: 400,
    y: 25
  }, {
    x: 150,
    y: 450
  }
];

GOAL_DETECTION = function(x, y) {
  var goal, id, _i, _len, _results;
  _results = [];
  for (id = _i = 0, _len = GOALS.length; _i < _len; id = ++_i) {
    goal = GOALS[id];
    if (COLLISION_DETECTION({
      x: x,
      y: y
    }, {
      x: goal.x,
      y: goal.y
    })) {
      console.log("HIT GOAL ", id);
      EMIT_ALL('goalHit', {
        goalID: id
      });
      _results.push(GOALS.splice(id, 1));
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

Puppet = (function() {
  function Puppet() {
    this.position = {
      x: 250,
      y: 250,
      f: 1
    };
  }

  Puppet.prototype.update = function() {
    var id, player, queue;
    queue = [];
    for (id in PLAYER_LIST) {
      player = PLAYER_LIST[id];
      switch (false) {
        case player.input !== 0:
          console.log("STOP!");
          break;
        case player.input !== 1:
          console.log("RIGHT!");
          this.position.x += 25;
          break;
        case player.input !== 2:
          console.log("UP!");
          this.position.y -= 25;
          break;
        case player.input !== 3:
          console.log("LEFT!");
          this.position.x -= 25;
          break;
        case player.input !== 4:
          console.log("DOWN!");
          this.position.y += 25;
          break;
        default:
          throw new Error("invalid");
      }
      queue.push({
        name: player.name,
        x: this.position.x,
        y: this.position.y,
        input: player.input
      });
      GOAL_DETECTION(this.position.x, this.position.y);
      player.resetInput();
    }
    return queue;
  };

  Puppet.prototype.reset = function() {
    return this.position = {
      x: 250,
      y: 250,
      f: 1
    };
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
    if (!!(player.input + 1)) {
      inputs++;
    }
  }
  return EMIT_ALL('updateTally', {
    msg: "" + inputs + " of " + total + " players have entered inputs"
  });
};

PUPPET = new Puppet();

io = require('socket.io')(serv, {});

io.sockets.on('connection', function(socket) {
  var player;
  player = void 0;
  socket.on('acknowledged', function(msg) {
    socket.id = Math.random();
    console.log("NEW SOCKET " + socket.id);
    SOCKET_LIST[socket.id] = socket;
    player = new Player(socket.id, msg.name);
    PLAYER_LIST[socket.id] = player;
    console.log("socket " + socket.id + " connected");
    socket.emit('initalize', {
      x: PUPPET.position.x,
      y: PUPPET.position.y
    });
    return socket.emit('currentGoals', {
      goals: GOALS
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
  var err, key, q, socket;
  UPDATE_TALLY();
  if (GOALS.length === 0) {
    EMIT_ALL('win', {});
  }
  if (playerScan()) {
    q = void 0;
    try {
      q = PUPPET.update();
    } catch (_error) {
      err = _error;
      console.log(err);
    }
    for (key in SOCKET_LIST) {
      socket = SOCKET_LIST[key];
      console.log("updating socket " + key);
      socket.emit('updatePosition', {
        q: q
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
    res = res && !!(player.input + 1);
  }
  return res;
};

setInterval(main, 1000 / 25);
