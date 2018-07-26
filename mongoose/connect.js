const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/test_db1');

const db = mongoose.connection;

db.on('error', (error) => {
    console.log('连接数据库失败' + error);
});

db.on('open', function () {
    console.log('数据库连接成功');
});

for (var k in mongoose.Schema.Types) {
    console.log(k)
}