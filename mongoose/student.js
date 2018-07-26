const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var StudentSchema = new Schema({
    name: String,
    clazzID: {
        type: Schema.Types.ObjectId,
        ref: 'Clazz'
    }
});

StudentSchema.statics = {
    findClazzNameByStudentId: function(studentId, callback){
        return this
            .find({}).populate({path: 'clazzID'})  // 关联查询
            .exec(callback)
    }
}

var Student = mongoose.model('Student', StudentSchema);

module.exports = Student;