stopClicked = false
DEBUG = true
PRINT = (x) ->
  if DEBUG
    console.log x


DIRECTION = -1

###
SETTING UP ALL THE BUTTONS
###

UNCLICK_ALL = () ->
  for button,id in DirEnum.properties
    unless id is 0 and stopClicked
      button.dom.className = "dirButton"


do ->
  BUTTON_FUNC_GEN = (k) ->
    return ->
        unless this.className is "clicked"
          DIRECTION = k
          socket.emit 'buttonPress', inputId: k
          console.log(k)
          UNCLICK_ALL()
          this.className = "clicked"
        return
  for button,id in DirEnum.properties
    button.dom.addEventListener 'click', BUTTON_FUNC_GEN(id)

ctx = document.getElementById('ctx').getContext('2d')

ctx.font = '30px Arial'
socket = io()
alert 'press OK to activate'
socket.emit 'acknowledged'
socket.on 'serverMsg', (data) ->
socket.on 'updatePosition', (data) ->
  console.log 'UPDATE!'
  ###Don't allow multi-stops ###
  if DIRECTION is 0 and not stopClicked
    stopClicked = true
  else if DIRECTION isnt 0 and stopClicked
    stopClicked = false
  UNCLICK_ALL()
  ctx.clearRect 0, 0, 500, 500
  ctx.fillText 'p', data.x, data.y
  return
socket.on 'updateTally', (msg) ->
  document.getElementById('count').innerHTML = msg.msg
  return
