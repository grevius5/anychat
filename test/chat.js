const assert = require('assert');
const http = require('http');
const sinon = require('sinon');

const server = require('../server');
const io = require('socket.io-client');
const options = {
    transports: ['websocket'],
    'force new connection': true,
};

// Disable console log during test
sinon.stub(console, "log")

describe('Server', function () {
    after(function () {
        server.close();
    });

    // Test if the server running
    it('should return 200', function () {
        http.get('http://127.0.0.1:8000', function (res) {
            assert.equal(res.statusCode, 200);
        });
    });

    // Test if the server running
    it('should return 4 rooms', function () {
        http.get('http://127.0.0.1:8000/rooms', function (res) {
            res.setEncoding('utf8')
            res.on('data', function (data) {
                assert.equal(JSON.parse(data).length, 4);
            })
        });
    });
});

describe('Chat', function () {
    let chat_user_1 = io.connect("http://127.0.0.1:8000", options);

    let chat_user_2 = io.connect("http://127.0.0.1:8000", options);
    chat_user_2.emit("username", "pippo_2");

    after(function () {
        chat_user_1.disconnect();
        chat_user_2.disconnect();
    });

    // Tests to run
    it('shoud set the username', function (done) {
        chat_user_1.on("username", function (id) {
            assert.notEqual(id, "");

            chat_user_1.off("username");
            done();
        });

        chat_user_1.emit("username", "pippo");
    });

    it('shoud send a message', function (done) {
        chat_user_1.on("message", function (data) {
            assert.equal(data.message, "Test message");

            chat_user_1.off("message");
            done();
        });

        chat_user_1.emit("message", { message: "Test message" });
    });

    it('shoud change room', function (done) {
        chat_user_2.on("room", function (room) {
            assert.equal(room, "test");

            chat_user_2.off("room");
            done();
        });

        chat_user_2.emit("join", "test");
    });

    it('shoud return writing message', function (done) {
        chat_user_1.on("writing", function (data) {
            assert.equal(data, "pippo_2");

            chat_user_1.off("writing");
            done();
        });

        // Check writing when in another room
        chat_user_2.emit("is_writing", true);

        // Change room and test again
        chat_user_2.emit("join", "Default");
        setTimeout(function () {
            chat_user_2.emit("is_writing", true);
        }, 20);
    });

    it('shoud change users count in room', function (done) {
        chat_user_1.on("users", function (clients) {
            assert.equal(clients, 1);

            chat_user_1.off("users");
            done();
        });

        chat_user_2.emit("join", "test");
    });
});
