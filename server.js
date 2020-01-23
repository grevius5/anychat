// SERVER STUFF
var bodyParser = require("body-parser");
var express = require("express");
var app = express();
var http = require("http").createServer(app);
var chat = require('./src/module/chat/chat');
chat.init(http);

// middleware to serve static file (scripts, styles, images etc.)
// /assets indica l'url             'assets' indica il path della cartella da usare
app.use('/js', express.static('public/js'));
app.use('/css', express.static('public/css'));
app.use('/img', express.static('public/img'));

//app.set("view engine", "engine_name");
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/views/index.html");
});

// Chat API
app.get("/rooms", function (req, res) {
    res.send(chat.rooms);
});

app.get("/room/:name/population", function (req, res) {
    let population = io.sockets.adapter.rooms['default'].sockets;
    let clients = (typeof population !== 'undefined') ? Object.keys(population).length : 0;

    res.send(clients.toString());
});

app.get("/users", function (req, res) {
    let rooms = [];
    for (var room in io.sockets.adapter.rooms) {
        rooms.push(room);
    }

    res.send(Object.keys(io.sockets.sockets));
});

http.listen(8000, function () {
    console.log("- SERVER STARTED -");
    console.log("IP: 127.0.0.1");
    console.log("PORT: 8000");
});

exports.close = function () {
    http.close();
};