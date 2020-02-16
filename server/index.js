const http = require('http');
const express = require('express');
const cors = require('cors');
const socketio = require('socket.io');

const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./users.js');

const PORT = process.env.PORT || 5000

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(router);


io.on('connection', (socket) => {
    console.log('New user connected...');

    //Specify the name create with socket.emit
    socket.on('join', ({
        name,
        room
    }, callback) => {
        // console.log(name, room);
        const {
            error,
            user
        } = addUser({
            id: socket.id,
            name,
            room
        });

        if (error) return callback(error);

        socket.emit('message', {
            user: 'admin',
            text: `${user.name}, Welcome to the room ${user.room}.`
        });

        //Send a message to everyone except this speficy user
        socket.broadcast.to(user.room).emit('message', {
            user: 'admin',
            text: `${user.name} has joined...`
        });

        //Join the room
        socket.join(user.room);

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const split = message.split(' ');
        var ancien = user.name;
        var ancienroom = user.room;

        switch (split[0]) {
            
            case "/nick":
                    socket.emit('nick', () => {
                    });
                    socket.broadcast.to(user.room).emit('message', {
                        user: "admin",
                        text: `${ancien} has changed his nickname for ${split[1]}`
                    })
                    user.name = split[1];
                break;

            case "/nickroom":
                    socket.emit('nickroom', () => {
                    });
                    socket.broadcast.to(user.room).emit('message', {
                        user: "admin",
                        text: `${user.name} has changed the room's nickname ${ancienroom} for ${split[1]}`
                    })
                    user.room = split[1];
                break;

            case '/part':
                    socket.emit('leave', () => {
                    });
                    socket.leave(ancienroom);
                    socket.broadcast.to(ancienroom).emit('message', { user: "admin", text: user.name + " leave " + ancienroom + "..."});
                    socket.join('room_default');
                break;

            case '/join':
                    if(split[1]) {
                        socket.emit('join', () => {
                        socket.leave(ancienroom);
                        socket.broadcast.to(ancienroom).emit('message', { user: "admin", text: user.name + " leave " + ancienroom + " to join " + split[1]});
                        socket.join(split[1]);
                        });
                    };
                break;

            case '/create':
                if(split[1]) {
                    socket.join(split[1]);
                    socket.leave(socket.room);
                    socket.emit('message', { user: "admin", text: user.name + " create the room " + split[1] + "..."});
                    socket.broadcast.to(socket.room).emit('message', { user: "admin", text: user.name + " joined " + split[1] + "..."});
                }
                break;
            
            case '/delete':
                if(split[1]) {
                    socket.leave(split[1]);
                    socket.emit('message', { user: "admin", text: user.name + " delete the room " + split[1] + "..."});
                }
                break;

            case '/users':
                var test = Object.keys(io.sockets.adapter.sids);
                socket.emit('message', { user: "admin", text: `List of users :  ${ test }` + " " + user.name });
                break;

            case '/list':
                    var list = Object.keys(io.sockets.adapter.rooms);
                    socket.emit('message', { user: "admin", text: `List of rooms :  ${ list }` });
                    console.log(Object.keys(io.sockets.adapter.rooms));
                break;

            case '/commandes':
                socket.emit('message', {
                    user: "admin",
                    text: "/nick /nickroom /list /create /delete /join /part /users /msg"
                });
                break;

            default:
                socket.broadcast.to(user.room).emit('message', {
                    user: user.name,
                    text: message
                });

                socket.emit('message', {
                    user: user.name,
                    text: message
                });
            break;
        }
        // console.log(message);
        // io.to(user.room).emit('message', {
        //     user: user.name,
        //     text: message
        // });
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        socket.broadcast.to(user.room).emit('message', {user: "admin", text: `${user.name} has left the room`});
        if (user) {
            io.to(user.room).emit('message', {
                user: 'admin',
                text: `${user.name} has left the room`
            });
        }
        console.log('A user has left...');
    });
});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));