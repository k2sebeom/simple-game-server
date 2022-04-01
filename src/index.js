const express = require('express');
const socketIO = require('socket.io');
const config = require('./config');

const app = express();

app.get('/', (req, res) => { 
    res.sendFile(__dirname + '/index.html'); 
});

const server = app.listen(config.port, () => {
    console.log('Open app at http://localhost:' + config.port);
});


const io = socketIO(server);

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('msg', (msg) => {
        console.log(msg);
        io.emit('msg', msg);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

