const Koa = require('koa');
const http = require('http');
const socket = require('socket.io');

const controller = require('koa-route');
const sql = require("./config");
const bodyParser = require('koa-bodyparser');

const app = new Koa();

const server = http.createServer(app.callback());

const io = socket(server);

const cors = require('koa2-cors');

app.use(bodyParser());

app.use(cors({
    origin: function (ctx) {
        if (ctx.url === '/test') {
            return "*";
        }
        return 'http://chat.guolh.com';
    },
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 5,
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}))


app.use(controller.post('/api/saveChatContent', async (ctx, next) => {
    console.log('ss');
    console.log(ctx.request.body);
    let data = {
        content: ctx.request.body.content,
        createdAt: Date.now()
    };
    var temp = await sql.query(
        "insert into chat_content(content) value(?)", [data.content]
    ).then(function (result) {
        console.log(result);
        io.sockets.emit('message', {
            content_id: result.insertId,
            content: ctx.request.body.content
        });
        return {
            ok : 1,
            message: '',
            data: {
                content_id: result.insertId,
                content: ctx.request.body.content
            },
        };
    }, function (error) {
        console.log(error);
        console.log('ds');
        return {
            ok : 0,
            message: '失败',
        };
    });
    ctx.body = temp;
}));


app.use(controller.get('/api/chatContent', async (ctx, next) => {

    var temp = await sql.query(
        "select * from chat_content",
    ).then(function (result) {
        console.log(result);
        return {
            ok : 1,
            message: '成功',
            data : result
        };
    }, function (error) {
        console.log(error);
        console.log('ds');
        return {
            ok : 0,
            message: '失败',
            data : []
        };
    });
    ctx.body = temp;
}));



io.on('connection', client => {
    client.on('message', async function (message) {
        console.log(message);
        // io.sockets.emit('message', message);
    })
})

server.listen(3000);
