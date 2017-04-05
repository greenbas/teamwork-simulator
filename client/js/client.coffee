ctx = document.getElementById('ctx').getContext('2d')


ctx.font = '30px Arial'
socket = io()
alert 'press OK to activate'
socket.emit 'acknowledged'
socket.emit 'happy', reason: 'it\'s my birthday'
socket.on 'serverMsg', (data) ->
  console.log data.msg
for button,id in DirEnum.properties
  button.dom.addEventListener 'click', ->
    socket.emit 'buttonPress', inputId: id
    this.className = "clicked"
    return
###
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
###
socket.on 'updatePosition', (data) ->
  console.log 'UPDATE!'
  ctx.clearRect 0, 0, 500, 500
  ctx.fillText 'p', data.x, data.y
  return
socket.on 'updateTally', (msg) ->
  document.getElementById('count').innerHTML = msg.msg
  return
