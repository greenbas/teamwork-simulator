var DEBUG, DIRECTION, PRINT, UNCLICK_ALL, ctx, socket, stopClicked;

stopClicked = false;

DEBUG = true;

PRINT = function(x) {
  if (DEBUG) {
    return console.log(x);
  }
};

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

ctx = document.getElementById('ctx').getContext('2d');

ctx.font = '30px Arial';

socket = io();

alert('press OK to activate');

socket.emit('acknowledged');

socket.on('serverMsg', function(data) {});

socket.on('updatePosition', function(data) {
  console.log('UPDATE!');

  /*Don't allow multi-stops */
  if (DIRECTION === 0 && !stopClicked) {
    stopClicked = true;
  } else if (DIRECTION !== 0 && stopClicked) {
    stopClicked = false;
  }
  UNCLICK_ALL();
  ctx.clearRect(0, 0, 500, 500);
  ctx.fillText('p', data.x, data.y);
});

socket.on('updateTally', function(msg) {
  document.getElementById('count').innerHTML = msg.msg;
});
