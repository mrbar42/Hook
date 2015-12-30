# Hook

Hook is a Universal Bi-directional helper lib the allows emitting events and accepting response using Promises and general Promise syntax.
It aims mainly to ease authenticated WebSocket communication with two parties (Client-Server, Server-Server).

If you want to dive in, the docs are inside the lib.

The lib is completely Bi-directional, meaning that the use of the terms 'Server' and 'Client' are for the sake of a real world example.
Theoretically both sides are capable of all the functionality.

In the browser it will expose a global `Hook` constructor (Hook.min.js minified+gzip is 1.6kb)

## Usage

EventEmitter is used to simulate a socket.

#### Server
```javascript

var Hook = require('../hook');

// the new keyword is optional and can be omitted
var hook = new Hook(); // {String} [hookEventName='_hook']

// authorize the socket
hook.onHello(function (message, socket) {
    if (message && message.id == 'A1') {
        console.log("onHello", message);
        
        // mark socket as validated
        socket._hook_valid = true;

        return {msg: 'hey there'}
    }
    else {
        throw 'Invalid hello credentials'
    }
});

hook.onHook(function (action, message, socket) {
    console.log("onHook", message);

    // check if socket is validated
    // if invalid, throw error to block (or return rejected promise)
    if (!socket._hook_valid) {
         throw 'you are NOT authorized!'
    }
    
    // optional - return extra argument or array of extra arguments (or promise that returns...)
    //return "singleExtraArg";
    return ["extra", "arguments"];
});

// simulate socket
var EventEmitter = require('events').EventEmitter;
var socket = new EventEmitter();

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
                        // this means the remote side handler returned an instance of Error
                        break;
                    default:
                        // your own error
                        break;
                }
            })
    }, 1000);

    return Promise.resolve('Yay!')
});

```

#### Client

note: This example uses browser use case, but this can very well be another server

```javascript

<script src="hook.min.js"></script>
<script>
    // simulate socket - this can be any on/emit compliant websocket or websocket library
    var socket = {
        emit: function () {},
        on: function () {}
    };
    // Client
    var hook = new Hook(); // hook event name MUST match the one on the server
    hook
            .attach(socket)
            // enables 'send(message, data)' instead of 'sendTo(socket, message, data)'
            // and 'sendHello' instead of 'sendHelloTo'            
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
                if (err === hook.TIMEOUT) {
                    // timeout
                }
                else {
                    console.log("failed  hello", err);
                }

            });

</script>

```