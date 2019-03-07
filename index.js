const Koa = require('koa');
const http = require('http');
const socket = require('socket.io');

const app = new Koa();

const server = http.createServer(app.callback());

const io = socket(server);

io.on('connection', client => {
    client.on('message', async function (message) {
        console.log(message);
        io.sockets.emit('message', message);
    })
})

server.listen(3000);
