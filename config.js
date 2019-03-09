const Client = require("mysql-pro");
const client = new Client({
    mysql: {
        user: 'root',
        // password: 'guolihui',
        password: 'dream6833526',
        database: 'chat',
        host: '127.0.0.1',
    }
});

module.exports = client;