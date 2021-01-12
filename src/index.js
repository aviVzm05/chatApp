const http = require('http');
const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000

// now configure the public folder

const publidDirectoryPath = path.join(__dirname,'../public')
app.use(express.static(publidDirectoryPath));

let welcomeMessage = 'Welcome!'

//server (emit) => client (receive) - countUpdated
//client (emit) => server (receive) - increment

io.on('connection', (socket) =>{
    // console.log('new socket.io connection');

    socket.on('join',(options, callback)=>{

        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error);
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('System', welcomeMessage));
        socket.broadcast.to(user.room).emit('message', generateMessage('System', `${user.username} has joined!`));

        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback();

        // io.to.emit -> emits an event to all in a given room
        // socket.broadcast.to.emit -> emits event to every one in room, except to the connected one.
    })

    socket.on('sendMessage',(message, callback)=>{
        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }

        // Get the current connection socket id and the room and send messages only to that room.

        const user = getUser(socket.id);

        io.to(user.room).emit('message',generateMessage(user.username, message));
        callback();
    })

    socket.on('disconnect',() =>{  // whenever a client is disconnected.
        const user = removeUser(socket.id);
        if (user) {
            io.to(user[0].room).emit('message', generateMessage('System', `${user[0].username} has left!`));
            io.to(user[0].room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user[0].room)
            })
        }
    });

    socket.on('sendLocation',(position, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${position.latitude},${position.longitude}`));
        callback();
    })
});

server.listen(port,()=>{
    console.log('server started on port: ', port);
});

// socket.emit --> Emits to only a single client identified via this socket object.
// io.emit -> this emits event to all the connections.
// broadcasting events means - sending to all clients except to the one generating it.
//this is socket.broadcast.emit