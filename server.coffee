###
TEAMWORK SIMULATOR
A Twitch Plays Pokemon style game where many players control the same
character to reach 5 goals on the gameboard. 
Server Code
Play @ https://teamwork-simulator.herokuapp.com/
###

PORT = process.env.PORT || 3000
express = require('express')
app = express()
serv = require('http').Server(app)
app.get '/', (req, res) ->
  res.sendFile __dirname + '/client/index.html'
  return
app.use '/client', express.static(__dirname + '/client')
serv.listen(PORT)
console.log 'Server started.'


class Player
    constructor: (@id,@name) ->
        @input = -1
    setInput: (n) -> @input = n
    getInput: () -> @input
    resetInput: () -> @input = -1

COLLISION_DETECTION = (rect1, rect2) ->
  console.log("cond1 #{rect1.x}  < #{rect2.x + 10}", "cond2 #{rect1.x + 10} > #{rect2.x}", "cond3  #{rect1.y} < #{rect2.y + 10}","cond4 #{10 + rect1.y} > #{rect2.y}")
  if ((rect1.x < (rect2.x + 10)) and
     ((rect1.x + 10) > rect2.x) and
     ( rect1.y < (rect2.y + 10)) and
     ((10 + rect1.y) > rect2.y))
    return true
  else
    return false

class Goal
    constructor: (@x,@y) ->

GOALS = [
  {x:100,y:300},
  {x:300,y:100},
  {x:25,y:400},
  {x:400,y:25},
  {x:150,y:450}
]

GOAL_DETECTION = (x,y) ->
  for goal,id in GOALS
    if COLLISION_DETECTION({x,y},{x:goal.x,y:goal.y})
      console.log("HIT GOAL ",id)
      EMIT_ALL 'goalHit',{goalID: id}
      GOALS.splice(id,1)

class Puppet
    constructor: () ->
        @position = {x: 250,y: 250,f: 1}
    update: () ->
        queue = []
        for id,player of PLAYER_LIST
            switch
                when player.input is 0
                    console.log("STOP!")
                when player.input is 1
                    console.log("RIGHT!")
                    @position.x += 25
                when player.input is 2
                    console.log("UP!")
                    @position.y -= 25
                when player.input is 3
                    console.log("LEFT!")
                    @position.x -= 25
                when player.input is 4
                    console.log("DOWN!")
                    @position.y += 25
                else throw new Error("invalid")
            queue.push({name:player.name,x:@position.x,y:@position.y,input:player.input})
            GOAL_DETECTION(@position.x,@position.y)
            player.resetInput()

        return queue
    reset: () ->
        @position = {x: 250,y: 250,f: 1}


SOCKET_LIST = {}
PLAYER_LIST = {}

EMIT_ALL = (name,data) ->
    for key,socket of SOCKET_LIST
        socket.emit(name,data)

UPDATE_TALLY = () ->
    total = Object.keys(PLAYER_LIST).length
    inputs = 0
    for key,player of PLAYER_LIST
        if !!(player.input + 1)
           inputs++
    EMIT_ALL('updateTally',{msg:"#{inputs} of #{total} players have entered inputs"})

ROOM_EMPTY = true

PUPPET = new Puppet()

io = require('socket.io')(serv, {})

io.sockets.on 'connection', (socket) ->
  player = undefined
  socket.on('acknowledged', (msg) ->
      ROOM_EMPTY = false;
      socket.id = Math.random()
      console.log ("NEW SOCKET #{socket.id}")
      SOCKET_LIST[socket.id] = socket;
      player = new Player(socket.id,msg.name)
      PLAYER_LIST[socket.id] = player
      console.log "socket #{socket.id} connected"
      socket.emit('initalize',{x:PUPPET.position.x,y:PUPPET.position.y})
      socket.emit 'currentGoals', {goals: GOALS}
      )

  socket.on("disconnect", () ->
    console.log "socket #{socket.id} disconnected"
    delete SOCKET_LIST[socket.id]
    delete PLAYER_LIST[socket.id]
    if Object.keys(SOCKET_LIST).length is 0
      PUPPET.position = {x: 250,y: 250,f: 1}
      GOALS = [
        {x:100,y:300},
        {x:300,y:100},
        {x:25,y:400},
        {x:400,y:25},
        {x:150,y:450}
      ]
    )

  socket.on('buttonPress', (msg) ->
    try
        console.log(player.getInput())
        player.setInput(msg.inputId)
        console.log(player.getInput())
    catch e
        socket.disconnect()

    )
  return



main = () ->
    UPDATE_TALLY()
    if GOALS.length is 0
      EMIT_ALL('win',{})
    if playerScan()
        q = undefined
        try
          q = PUPPET.update()
        catch err
          console.log(err)
        for key,socket of SOCKET_LIST
            console.log("updating socket #{key}")
            socket.emit('updatePosition',{q})
    else
        0;
    return

playerScan = () ->
    res = true
    for id,player of PLAYER_LIST
        res = (res and !!(player.input + 1))
    return res

setInterval(main,1000/25)

