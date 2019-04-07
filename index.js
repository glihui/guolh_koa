const Koa = require('koa');
const http = require('http');
const socket = require('socket.io');

const controller = require('koa-route');
const sql = require("./config");
const bodyParser = require('koa-bodyparser');
const fs = require('fs');

const app = new Koa();

const server = http.createServer(app.callback());

const io = socket(server);

const cors = require('koa2-cors');

app.use(bodyParser(
    {
        formLimit:"3mb",
        jsonLimit:"3mb",
        textLimit:"3mb",
        enableTypes: ['json', 'form', 'text']
    }
));


app.use(cors({
    origin: function (ctx) {
        if (ctx.url === '/test') {
            return "*";
        }
        return "*";
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
        user_id: ctx.request.body.user_id,
        user: ctx.request.body.user,
        createdAt: Date.now()
    };
    var temp = await sql.query(
        "insert into chat_content(content,user_id) value(?,?)",
        [data.content,data.user_id]
    ).then(function (result) {
        console.log(result);
        io.sockets.emit('message', {
            content_id: result.insertId,
            content: ctx.request.body.content,
            user_id: ctx.request.body.user_id,
            user:ctx.request.body.user,
        });
        return {
            ok : 1,
            message: '',
            data: {
                content_id: result.insertId,
                content: ctx.request.body.content,
                user_id: ctx.request.body.user_id,
                user: ctx.request.body.user,
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

//注册用户
app.use(controller.post('/api/register', async (ctx, next) => {
    console.log(ctx.request.body);
    let data = {
        username: ctx.request.body.username,
        password: ctx.request.body.password,
        avatar: ctx.request.body.avatar,
        createdAt: Date.now()
    };

    let imgData = ctx.request.body.avatar;
    let base64Data = imgData.replace(/^data:image\/\w+;base64,/,"");
    let dataBuffer = new Buffer(base64Data, 'base64');


    let flag = false;
    var temp = await sql.query(
        "select * from user",
    ).then(function (result) {
        result.map((item) => {
            if (item.username == data.username) {
                flag = true;
            }
        });
    });
    console.log(flag);
    if(flag) {
        ctx.body = {
            ok : 0,
            message: '该用户名已被注册',
            data: {

            },
        };
    } else {
        fs.writeFile(`${data.username}_image.png`,dataBuffer, function (err) {
            if(err) {
                console.log('ss');
                console.log(err);
            } else {
                console.log('成功');
            }
        });
        var temp2 = await sql.query(
            "insert into user(`username`,`userpassword`,`avatar`) VALUES (?,?,?)",
            [data.username,data.password,`${data.username}_image.png`]
        ).then(function (result) {
            console.log(result);
            return {
                ok : 1,
                message: '',
                data: {
                    user_id: result.insertId,
                    username: ctx.request.body.username,
                    password: ctx.request.body.password,
                    avatar: `${data.username}_image.png`,
                },
            };
        }, function (error) {
            console.log(error);
            return {
                ok : 0,
                message: '失败',
            };
        });
        ctx.body = temp2;
    }

}));

//登录
app.use(controller.post('/api/login', async (ctx, next) => {
    console.log(ctx.request.body);
    let data = {
        username: ctx.request.body.username,
        password: ctx.request.body.password,
        avatar: ctx.request.body.avatar,
        createdAt: Date.now()
    };

    var temp = await sql.query(
        "select * from user",
    ).then(function (result) {
        for(let i=0; i<result.length; i++) {
            if(result[i].username == data.username) {
                if (result[i].userpassword == data.password) {
                     return {
                         ok : 1,
                         message: '',
                         data: {
                             username: data.username,
                             avatar: result[i].avatar,
                             user_id: result[i].user_id,
                         },
                     }
                } else {
                    return {
                        ok : 0,
                        message: '密码有误',
                        data: {},
                    }
                }
            }
        }
        return {
            ok : 0,
            message: '该用户不存在',
            data: {},
        }
    });
    ctx.body = temp;

}));

app.use(controller.get('/api/chatContent', async (ctx, next) => {



    var temp = await sql.query(
        "select * from chat_content",
    ).then(async (result) => {
        console.log(result);


        var temp2 = await sql.query(
            "select * from user",
        ).then(function (result2) {
            for (let i=0; i<result.length; i++) {
                for(let j=0; j<result2.length; j++) {
                  if (result[i].user_id == result2[j].user_id) {
                      console.log('pps');
                      result[i].user = result2[j];
                  }
                }
            }
        });

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

app.use(require('koa-static')(__dirname));


io.on('connection', client => {
    client.on('message', async function (message) {
        console.log(message);
        // io.sockets.emit('message', message);
    })
})

server.listen(3000);
