const express = require('express');
const config = require('./config');
const wsModule = require('ws');


const app = express();


app.use('/', (req, res) => { 
    res.sendFile(__dirname + '/game.html'); 
});

const server = app.listen(config.port, () => {
    console.log('Open app at http://localhost:' + config.port);
});

const wss = new wsModule.Server({
    server
});

function getRandomId() {
    return Math.floor(Math.random() * 255);
}

let currentCells = {};

wss.on('connection', (ws, req) => {

    ws.on('message', (msg) => {
        const cmd = msg.readUInt8(0);
        switch (cmd) {
            case 0:
                // Join the game
                const r = msg.readUInt8(1);
                const g = msg.readUInt8(2);
                const b = msg.readUInt8(3);
                const name = msg.toString('utf8', 4);
                console.log(`Cell with id: ${name} with color ${r}, ${g}, ${b} joined`);

                const id = getRandomId();
                let buf = Buffer.alloc(2);
                buf.writeUInt8(1, 0);
                buf.writeUInt8(id, 1);
                const data = Buffer.concat([buf, msg.slice(1)]);

                ws.id = id;
                ws.joinData = data;
                currentCells[id] = ws;

                for (const [id, client] of Object.entries(currentCells)) {
                    data.writeUInt8(client.id == id ? 2 : 1, 0);
                    client.send(data);
                    if (client.id != id) {
                        ws.send(client.joinData);
                    }
                }
                break;
            case 3:
                const cellId = msg.readUInt8(1);
                const x = msg.readUInt16LE(2);
                const y = msg.readUInt16LE(4);
                for (const [id, client] of Object.entries(currentCells)) {
                    if (client.id != cellId) {
                        let buf = Buffer.alloc(6);
                        buf.writeUInt8(4, 0);
                        buf.writeUInt8(cellId, 1);
                        buf.writeUInt16LE(x, 2);
                        buf.writeUInt16LE(y, 4);
                        client.send(buf);
                    }
                }
                break;
            case 5:
                msg.writeUInt8(6, 0);
                for (const [id, client] of Object.entries(currentCells)) {
                    client.send(msg);
                }
                break;
            default:
                console.log('Malformed data');
        }  
    })

    ws.on('close', () => {
        for (const [id, client] of Object.entries(currentCells)) {
            if (id == ws.id) {
                delete currentCells[id];
            }
        }
        console.log('Disconnected');
    })
})