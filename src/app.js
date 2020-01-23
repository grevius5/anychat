import io from '../node_modules/socket.io-client';

import 'bootstrap';
import $ from 'jquery';


$(document).ready(function () {
    var socket = io();
    let id = "";

    $("#modal_username").modal({
        backdrop: 'static',
        keyboard: false
    });

    $("#modal_save").click(function () {
        socket.emit('username', $("#username").val());
    });

    socket.on('username_unavailable', function () {
        $(".modal-body").prepend(
            `<div class="alert alert-warning alert-dismissible fade show" role="alert">
                username unavailable.
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>`);
    });

    // Get username from server
    socket.on('username', function (data) {
        $("#modal_username").modal('hide');

        id = data;
        console.log(id);
        init();
    });

    $.ajax({
        type: "get",
        url: "rooms",
        success: function (response) {
            response.forEach(room => {
                $("#room_list").append(
                    `<li id="room_${room}">
                        <a href="#" data-room="${room}" class="room">
                            <span class="align-middle">${room}</span>
                        </a>
                    </li>`
                );
            });
        }
    });

    function init() {
        // Get actual room from server
        socket.on('room', function (room) {
            $('#sidebar .components').find('li.active').removeClass('active');
            $(`#room_${room}`).addClass('active');
            $('.navbar-header h3').text(room);

            clear_chat();
        });

        socket.on('users', function (clients) {
            $('.users').text(`${clients == 1 ? "Tu" : clients + ' users'}`);
        });

        // Get messages from server
        socket.on('message', function (data) {
            $("#chat_box").append(
                `<div class= "${data.from == id ? 'agent' : 'input'} message rounded-lg shadow" >
                    <div class="message-header">
                        <p>${data.username}</p>
                    </div>

                    <p>${data.message}</p>
                    <small>${data.data}</small>
                </div>`
            );

            move_to_bottom();
        });

        socket.on("writing", function (username) {
            $("#chat_status").text(username != "" ? username + " is writing" : "");
        });

        socket.on('disconnect', function (username) {
            $("#chat_box").append(
                `<div class= "disconnected text-center rounded-lg shadow">
                    ${username} disconnected.
                </div>`
            );

            move_to_bottom();
        });
    }

    function move_to_bottom() {
        $("#chat_box").animate({ scrollTop: $("#chat_box")[0].scrollHeight }, 'slow');
    }

    // Clean the chat box and message text
    function clear_chat() {
        $("#chat_box").empty();
        $("#message").val("");
    }

    // Send message with enter key
    let writing_timer;
    $("#message").keydown(function (event) {
        // Clear the timer
        clearInterval(writing_timer);
        writing_timer = setTimeout(function () {
            socket.emit("is_writing", false);
        }, 500);

        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            $("#send_message").trigger('click');
        }

        socket.emit("is_writing", true);
    });

    // Change username
    $("#save_username").click(function () {
        socket.emit("username", $("#username").val());
    });

    // Send message button click event
    $("#send_message").click(function () {
        socket.emit("message", { room: "default", message: $("#message").val() });
        $("#message").val("");
    });

    // Change room
    $('#sidebar').on('click', '.room', function () {
        socket.emit('join', $(this).data('room'));
    })

    $("#enter_room").click(function () {
        socket.emit('join', $("#custom_room").val());
    });

    // Sidebar controller
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });
});

