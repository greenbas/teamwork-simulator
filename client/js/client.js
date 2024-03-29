/* 

*/

var APPEND_CHAT, CHARACTER, CLEAR_CHAT, DEBUG, DIRECTION, GOALS, INIT, INPUT_TO_CLASS, PRINT, UNCLICK_ALL, ctx, init, loadSound, name, playsound, socket, soundID, stopClicked, tweenMove, victoryMusic, victorySoundID;

stopClicked = false;

INIT = true;

DEBUG = true;

PRINT = function(x) {
  if (DEBUG) {
    return console.log(x);
  }
};

CHARACTER = new createjs.Shape();

CHARACTER.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 10);

soundID = "ding";

victorySoundID = "daDaDa";

loadSound = function() {
  createjs.Sound.registerSound("./client/ding.mp3", soundID);
  return createjs.Sound.registerSound("./client/ff.mp3", victorySoundID);
};

GOALS = [];

DIRECTION = -1;


/*
SETTING UP ALL THE BUTTONS
 */

UNCLICK_ALL = function() {
  var button, id, _i, _len, _ref, _results;
  _ref = DirEnum.properties;
  _results = [];
  for (id = _i = 0, _len = _ref.length; _i < _len; id = ++_i) {
    button = _ref[id];
    if (!(id === 0 && stopClicked)) {
      _results.push(button.dom.className = "dirButton");
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

INPUT_TO_CLASS = function(n) {
  switch (false) {
    case n !== 0:
      return "glyphicon-remove-circle";
  }
};

(function() {
  var BUTTON_FUNC_GEN, button, id, _i, _len, _ref, _results;
  BUTTON_FUNC_GEN = function(k) {
    return function() {
      if (this.className !== "clicked") {
        DIRECTION = k;
        socket.emit('buttonPress', {
          inputId: k
        });
        console.log(k);
        UNCLICK_ALL();
        this.className = "clicked";
      }
    };
  };
  _ref = DirEnum.properties;
  _results = [];
  for (id = _i = 0, _len = _ref.length; _i < _len; id = ++_i) {
    button = _ref[id];
    _results.push(button.dom.addEventListener('click', BUTTON_FUNC_GEN(id)));
  }
  return _results;
})();

ctx = new createjs.Stage('ctx');

init = function(data) {
  loadSound();
  CHARACTER.x = data.x;
  CHARACTER.y = data.y;
  ctx.addChild(CHARACTER);
  ctx.update();
  return INIT = false;
};

tweenMove = function(msg) {

  /*it's absolutely fucked up I have to do this, but it works, not gonna knock it */
  var data, err, input, name, tl, tw, x, y, _i, _len, _ref, _ref1, _ref2;
  try {
    _ref = [msg[0].x, msg[0].y, msg[0].name, msg[0].input], x = _ref[0], y = _ref[1], name = _ref[2], input = _ref[3];
    tl = new createjs.Timeline();
    tw = createjs.Tween.get(CHARACTER).pause().to({
      x: x,
      y: y
    }, 500);
    CLEAR_CHAT();
    APPEND_CHAT("" + name + ": <span class=\"glyphicon " + DirEnum.properties[input].glyph + "\"></span>");
    console.log("x ", x, "y ", y);
    tl.addTween(tw);
    tl.setPaused(true);
    _ref1 = msg.slice(1);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      data = _ref1[_i];
      tl.setPaused(false);
      _ref2 = [data.x, data.y, data.name, data.input], x = _ref2[0], y = _ref2[1], name = _ref2[2], input = _ref2[3];
      tw = tw.pause().to({
        x: x,
        y: y
      }, 500);
      tl.addTween(tw);
      APPEND_CHAT("" + name + ": <span class=\"glyphicon " + DirEnum.properties[input].glyph + "\"></span>");
      tl.setPaused(false);
    }
    tl.setPaused(false);
  } catch (_error) {
    err = _error;
    return console.log(err);
  }
};

CLEAR_CHAT = function() {
  var chat;
  chat = document.getElementById('chat-text');
  return chat.innerHTML = "";
};

APPEND_CHAT = function(content) {
  var chat;
  chat = document.getElementById('chat-text');
  return chat.innerHTML += "<div>" + content + "</div>";
};

createjs.Ticker.setFPS(60);

createjs.Ticker.addEventListener("tick", ctx);

ctx.font = '30px Arial';

socket = io();

name = prompt("Please enter your name", "name");

socket.emit('acknowledged', {
  name: name
});

socket.on('serverMsg', function(data) {});

socket.on('updatePosition', function(data) {
  var err;
  try {

    /*Don't allow multi-stops */
    if (DIRECTION === 0 && !stopClicked) {
      stopClicked = true;
    } else if (DIRECTION !== 0 && stopClicked) {
      stopClicked = false;
    }
    UNCLICK_ALL();
    tweenMove(data.q);
  } catch (_error) {
    err = _error;
    return console.log(err);
  }
});

socket.on('updateTally', function(msg) {
  document.getElementById('count').innerHTML = msg.msg;
});

playsound = function() {
  return createjs.Sound.play(soundID);
};

victoryMusic = function() {
  return createjs.Sound.play(victorySoundID);
};

socket.on('initalize', function(msg) {
  return init(msg);
});

socket.on('currentGoals', function(msg) {
  var item, shape, _i, _len, _ref, _results;
  _ref = msg.goals;
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    item = _ref[_i];
    shape = new createjs.Shape();
    shape.graphics.beginFill("#FF0000").drawPolyStar(item.x, item.y, 10, 5, 0.6);
    GOALS.push(ctx.addChild(shape));
    _results.push(ctx.update());
  }
  return _results;
});

socket.on('goalHit', function(msg) {
  var id;
  id = msg.goalID;
  playsound();
  ctx.removeChild(GOALS[id]);
  GOALS.splice(id, 1);
  return ctx.update();
});

socket.on('win', function() {
  victoryMusic();
  alert("YOU WIN");
  return socket.disconnect();
});

socket.on('chatUpdate', function(msg) {
  return APPEND_CHAT(msg.msg);
});
