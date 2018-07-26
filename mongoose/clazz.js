const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// 定义班级模式
var ClazzSchema = new mongoose.Schema({
    clazzName: String
});

var Clazz = mongoose.model('Clazz', ClazzSchema)

module.exports = Clazz