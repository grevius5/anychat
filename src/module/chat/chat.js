var io;

// Chat functions
let rooms = ['Default', 'Developers', 'Games', 'Off-Topic'];
let users = [];

var init = function (server) {
    // Skip multiple initialization
    if (io != undefined) return;

    io = require('socket.io')(server);

    // User functions
    io.on('connection', function (socket) {
        // Join the default room
        socket.username = socket.id;
        console.log(`${socket.username} conencted`);

        function change_room(room) {
            // If room doesn't exist we will create it
            if (!rooms.includes(room)) {
                rooms.push(room);
            }

            //leave the previous room
            let prev_room = Object.keys(socket.rooms)[1]
            socket.leave(prev_room);
            update_users(prev_room);

            // Change room and confirm to the client
            socket.join(room);
            socket.emit('room', room);
            socket.room = room;

            update_users(room);

            console.log(`${socket.username} moved to ${room}`);
        }

        function update_users(room) {
            if (io.sockets.adapter.rooms[room] != undefined) {
                // Update the number of users
                let clients = io.sockets.adapter.rooms[room].sockets;
                let numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0
                io.in(room).emit('users', numClients);

                console.log(`${room} ${numClients} users`);
            } else {
                console.log(`${room} deleted`);
            }
        }

        socket.on('is_writing', function (writing) {
            if (writing) {
                socket.broadcast.to(socket.room).emit("writing", socket.username);
            } else {
                socket.broadcast.to(socket.room).emit("writing", "");
            }
        });

        // Create or join room
        socket.on('join', function (room) {
            if (room != "") {
                io.in(socket.room).emit("disconnect", socket.username);
                change_room(room);
            }
        });

        socket.on('message', function (data) {
            let room = Object.keys(socket.rooms)[1];
            let now = new Date();
            const date_options = { day: '2-digit', year: 'numeric', month: '2-digit', hour: "2-digit", minute: "2-digit" };

            let res = {
                from: socket.id,
                username: socket.username,
                message: data.message,
                data: now.toLocaleDateString("it-IT", date_options),
            };

            io.in(room).emit("message", res);

            console.log(`${socket.username}@${room}: ${res.message}`);
        });

        socket.on('username', function (username) {
            if (users.includes(username) || username == "") {
                socket.emit('username_unavailable', socket.id);
                return;
            }

            socket.username = username;
            users.push(socket.username);

            socket.emit('username', socket.id);
            change_room(rooms[0]);

            console.log('new user: ' + socket.username);
        });

        socket.on('disconnect', function () {
            update_users(socket.room);
            io.in(socket.room).emit("disconnect", socket.username);
            users.splice(users.indexOf(socket.username), 1);
            console.log(`${socket.username} disconnected`);
        })
    });
}

module.exports = {
    "init": init,
    "rooms": rooms,
    "users": users,
};