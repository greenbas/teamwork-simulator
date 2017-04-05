var button, ctx, id, socket, _i, _len, _ref;

ctx = document.getElementById('ctx').getContext('2d');

ctx.font = '30px Arial';

socket = io();

alert('press OK to activate');

socket.emit('acknowledged');

socket.emit('happy', {
  reason: 'it\'s my birthday'
});

socket.on('serverMsg', function(data) {
  return console.log(data.msg);
});

_ref = DirEnum.properties;
for (id = _i = 0, _len = _ref.length; _i < _len; id = ++_i) {
  button = _ref[id];
  button.dom.addEventListener('click', function() {
    socket.emit('buttonPress', {
      inputId: id
    });
    this.className = "clicked";
  });
}


/*
DirEnum.properties[DirEnum.RIGHT].dom.addEventListener 'click', ->
  socket.emit 'buttonPress', inputId: 1
  this.className = "clicked"
  return
document.getElementById('dirup').addEventListener 'click', ->
  socket.emit 'buttonPress', inputId: 2
  return
document.getElementById('dirleft').addEventListener 'click', ->
  socket.emit 'buttonPress', inputId: 3
  return
document.getElementById('dirdown').addEventListener 'click', ->
  socket.emit 'buttonPress', inputId: 4
  return
 */

socket.on('updatePosition', function(data) {
  console.log('UPDATE!');
  ctx.clearRect(0, 0, 500, 500);
  ctx.fillText('p', data.x, data.y);
});

socket.on('updateTally', function(msg) {
  document.getElementById('count').innerHTML = msg.msg;
});
