stopClicked = false
INIT = true
DEBUG = true

PRINT = (x) ->
  if DEBUG
    console.log x
CHARACTER = new createjs.Shape();
CHARACTER.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 10)

soundID = "ding";

loadSound = () ->
  createjs.Sound.registerSound("./client/ding.mp3",soundID )


GOALS = []

DIRECTION = -1

###
SETTING UP ALL THE BUTTONS
###

UNCLICK_ALL = () ->
  for button,id in DirEnum.properties
    unless id is 0 and stopClicked
      button.dom.className = "dirButton"

INPUT_TO_CLASS = (n) ->
  switch
    when n is 0
      return "glyphicon-remove-circle"



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


ctx = new createjs.Stage('ctx');

init = (data) ->
  loadSound()
  CHARACTER.x = data.x
  CHARACTER.y = data.y
  ctx.addChild(CHARACTER)
  ctx.update()
  INIT = false

tweenMove = (msg) ->
  ###it's absolutely fucked up I have to do this, but it works, not gonna knock it###
  try
    [x,y,name,input] = [msg[0].x,msg[0].y,msg[0].name,msg[0].input]
    tl = new createjs.Timeline()
    tw = createjs.Tween.get(CHARACTER).pause().to({x,y},500)
    CLEAR_CHAT()
    APPEND_CHAT("""#{name}: <span class="glyphicon #{DirEnum.properties[input].glyph}"></span>""")
    console.log("x ", x, "y ", y)
    tl.addTween tw
    tl.setPaused(true)

    for data in msg[1..]
      tl.setPaused(false)
      [x,y,name,input] = [data.x,data.y,data.name,data.input]
      tw = tw.pause().to({x,y},500)
      tl.addTween tw
      APPEND_CHAT("""#{name}: <span class="glyphicon #{DirEnum.properties[input].glyph}"></span>""")
      tl.setPaused(false)

    tl.setPaused(false)
    return
  catch err
    console.log(err)

CLEAR_CHAT = () ->
   chat = document.getElementById('chat-text')
   chat.innerHTML = ""

APPEND_CHAT = (content) ->
  chat = document.getElementById('chat-text')
  chat.innerHTML += "<div>#{content}</div>"


createjs.Ticker.setFPS(60);
createjs.Ticker.addEventListener("tick",ctx)

ctx.font = '30px Arial'
socket = io()
name = prompt("Please enter your name", "name")
socket.emit 'acknowledged', {name}
socket.on 'serverMsg', (data) ->
socket.on 'updatePosition', (data) ->
  try
    ###Don't allow multi-stops ###
    if DIRECTION is 0 and not stopClicked
      stopClicked = true
    else if DIRECTION isnt 0 and stopClicked
      stopClicked = false
    UNCLICK_ALL()
    tweenMove(data.q)
    return
  catch err
    console.log(err)

socket.on 'updateTally', (msg) ->
  document.getElementById('count').innerHTML = msg.msg
  return

playsound = () ->
  createjs.Sound.play(soundID)

socket.on 'initalize', (msg) ->
  init(msg)
socket.on 'currentGoals', (msg) ->
  for item in msg.goals
    shape = new createjs.Shape()
    shape.graphics.beginFill("#FF0000").drawPolyStar(item.x,item.y,10,5,0.6)
    GOALS.push ctx.addChild (shape)
    ctx.update()
socket.on 'goalHit',(msg) ->
  id = msg.goalID
  playsound()
  ctx.removeChild(GOALS[id])
  GOALS.splice(id,1)
  ctx.update()
socket.on 'win',() ->
  alert "YOU WIN"
  socket.disconnect()
socket.on 'chatUpdate', (msg) ->
  APPEND_CHAT(msg.msg)
