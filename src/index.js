const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
// socket.io expects to be configured with the raw http server
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

// Tells express what the root of our project should be.
app.use(express.static(publicDirectoryPath))

let count = 0

// fires every time the socket.io gets a new connection
io.on('connection', (socket) => {
  console.log('new websocket connection')

  
  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room })

    if (error) {
      return callback(error)
    }

    socket.join(user.room)

    socket.emit('message', generateMessage('Admin', 'Welcome!'))
    // broadcasts only to other members of the room
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })

  socket.on('sendMessage', (message, callback) => {
    const { room, username } = getUser(socket.id)
    const filter = new Filter()

    if(filter.isProfane(message)) {
      return callback('Profanity is not allowed')
    }

    io.to(room).emit('message', generateMessage(username, message))
    callback()
  })

  socket.on('sendLocation', ({latitude, longitude}, callback) => {
    const { room, username } = getUser(socket.id)
    console.log('username', username)
    io.to(room).emit('locationMessage', generateLocationMessage(username, `https://google.com/maps?q=${latitude},${longitude}`))
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if(user) {
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
      
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }

  })
})

server.listen(port, () => {
  console.log(`server listening on port: ${port}`)
})