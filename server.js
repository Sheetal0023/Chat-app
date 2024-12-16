const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const { addUser, removeUser, getUser, getUsersInRoom} = require('./src/utils/users')
const { generateMessage, generateLocationMessage } = require("./src/utils/messages")

// Serve static files
app.use(express.static(__dirname + '/public'));

console.log(generateMessage("text"))

io.on("connection", (socket) => {
    console.log("A new user is connected")

 
    socket.on('join', ({ username, room}, callback) => {
        const { error, user } = addUser({ id:socket.id, username, room })

        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit("message", generateMessage("Admin", "Welcome Here"))
        socket.broadcast.to(user.room).emit("message", generateMessage("Admin", `${user.username} has joined`))
    
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on("sendMessage", (message, callback) => {

        const user = getUser(socket.id)

        io.to(user.room).emit("message", generateMessage(user.username, message))
        callback()
    })
    
    socket.on("sendLocation", (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://maps.google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {

        const user = removeUser(socket.id) 

        if(user) {
            io.to(user.room).emit("message", generateMessage("Admin", `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })
})



server.listen(3000, () => {
    console.log(`Server running on http://localhost:3000`);
});
