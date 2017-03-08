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
    constructor: (@id) ->
        @input = 0
    castVote: () ->  
    setInput: (n) -> @input = n
    getInput: () -> @input
    resetInput: () -> @input = 0 
        

class Puppet 
    constructor: () ->
        @position = {x: 250,y: 250,f: 1}
    update: () -> 
        for id,player of PLAYER_LIST
            switch
                when player.input is 1 
                    console.log("RIGHT!")
                    @position.x += 10
                when player.input is 2 
                    console.log("UP!")
                    @position.y -= 10
                when player.input is 3 
                    console.log("LEFT!")
                    @position.x -= 10
                when player.input is 4 
                    console.log("DOWN!")
                    @position.y += 10 
                else throw new Error("invalid")
            player.resetInput()
        return 

SOCKET_LIST = {}
PLAYER_LIST = {}

EMIT_ALL = (name,data) ->
    for key,socket of SOCKET_LIST
        socket.emit(name,data)

UPDATE_TALLY = () ->
    total = Object.keys(PLAYER_LIST).length
    inputs = 0
    for key,player of PLAYER_LIST
        if !!(player.input)
           inputs++
    EMIT_ALL('updateTally',{msg:"#{inputs}/#{total}"})

PUPPET = new Puppet()

io = require('socket.io')(serv, {})

io.sockets.on 'connection', (socket) ->
  socket.id = Math.random()
  console.log ("NEW SOCKET #{socket.id}")
  SOCKET_LIST[socket.id] = socket;
  player = new Player(socket.id)
  PLAYER_LIST[socket.id] = player
  console.log "socket #{socket.id} connected"

    
  socket.on("disconnect", () ->
    console.log "socket #{socket.id} disconnected"
    delete SOCKET_LIST[socket.id]
    delete PLAYER_LIST[socket.id]
    )
  
  socket.on('buttonPress', (msg) -> 
    console.log(player.getInput())
    player.setInput(msg.inputId)
    console.log(player.getInput())

    )
  return 


main = () -> 
    UPDATE_TALLY()
    if playerScan()
        PUPPET.update()
        for key,socket of SOCKET_LIST
            console.log("updating socket #{key}")
            socket.emit('updatePosition',{x:PUPPET.position.x,y:PUPPET.position.y})
    else 
        0;
    return        

playerScan = () -> 
    res = true
    for id,player of PLAYER_LIST
        res = (res and !!player.input)
    return res

setInterval(main,1000/25)

# ---
# generated by js2coffee 2.2.0
