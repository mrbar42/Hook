'use strict';

var Hook = require('../Hook');
// server
// simulate socket
var EventEmitter = require('events').EventEmitter;
var socket = new EventEmitter();
var hook = new Hook();


hook.onHello(function (message, socket) {
    if (message && message.id == 'A1') {
        console.log("onHello", message);
        // mark socket as validated
        return {msg: 'hey there'}
    }
    else {
        throw 'you are NOT authorized!'
    }
});

hook.onHook(function (action, message, socket) {
    console.log("onHook", message);

    // check if socket is validated and return extra argument or array of extra arguments (or promise that returns...)
    // if invalid, throw error to block (or return rejected promise)
    //return "singleExtraArg";
    return ["extra", "arguments"];
});

// this should be called every time a socket is connected
hook.attach(socket);


hook.on('someAction', function (message, socket, arg1, arg2) {
    // arg1 = "extra"
    // arg2 = "arguments"
    console.log("hook someAction handler", message, arg1, arg2);

    setTimeout(function () {
        var timeout = 10000;
        hook
            .sendTo(socket, 'doSomething', {}, timeout) // timeout is optional - default 60000ms
            .then(function (res) {
                // result
            })
            .catch(function (err) {
                switch (err) {
                    case hook.TIMEOUT:
                        // remote side didn't respond
                        break;
                    case hook.NO_HANDLERS:
                        // remote side didn't register for this action
                        break;
                    case hook.INVALID_MESSAGE:
                        // this probably mean you manually sent a hook event. don't do that!
                        break;
                    case hook.INTERNAL_ERROR:
                        // this means the remote side handler returned instance of Error
                        break;
                    default:
                        // your own error
                        break;
                }
            })
    }, 1000);

    return Promise.resolve('Yay!')
});

// Client
hook
    .bindSocket(socket)
    .sendHello({id: 'A1'})
    .then(function (message) {
        console.log("Successful hello", message);

        hook
            .send('someAction', {payload: '123'})
            .then(function (message) {
                console.log("Successful hook", message);
            })
            .catch(function (err) {
                console.log("failed  hook", err);
            });

    })
    .catch(function (err) {
        console.log("failed  hello", err);
    });



