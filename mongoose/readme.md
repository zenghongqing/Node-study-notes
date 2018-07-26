### mongoose
MongoDB是一个对象数据库，是用来存储数据的；Mongoose是封装了MongoDB操作的一个对象模型库，是用来操作这些数据的。
包括以下四部分:
* 一个对持久对象进行CRUD操作的API,可以理解为实体Entity上的方法
* 一个语言或API用来规定与类与类属性相关的查询, 比如Population
* 一个规定MAPPING METADATA的工具,可以理解为Schema定义
* 一种技术可以让ORM的实现各种db操作的封装

#### Schema

Schema是一种以文件形式存储的数据库模型骨架，无法直接通往数据库端，也就是不具备对数据库的操作能力，仅仅只是定义数据模型在程序片段中的一种表现，可以说是数据属性模型.可以理解为：
```
Schema是对文档(表)结构的定义
```
```
// 定义Schema
UserSchema = new mongoose.Schema({
  username: {// 真实姓名
    type: String,
    required: true
  },
  password: { // 密码
    type: String,
    required: true
  }
});
```
基本属性类型有：字符串、日期型、数值型、布尔型(Boolean)、null、数组、内嵌文档等，当然它还有更丰富的对字段进行校验约束的功能。

#### Model
模型(Model)是由Schema构造生成的模型，除了Schema定义的数据库骨架以外，还具有数据库操作的行为，类似于管理数据库属性、行为的类。
```
var db = mongoose.connection;
// 定义Model
var UserModel = mongoose.model('User', UserSchema);
```
User是模型名称，它对应到mongodb里就是数据库中的集合名称，默认会转成复数，变为'users',当我们对其添加数据时如果users已经存在，则会保存到其目录下，如果未存在，则会创建users集合，然后在保存数据。

#### 实体(Entity)
实体(Entity)由Model创建的实体, 使用save方法保存数据，Model和Entity都有影响数据库的操作，但model比entity更具操作性.
```
var user = new User({
  username: 'i5ting',
  password: '0123456789'
});

console.log(user.username); // i5ting 
console.log(user.password); //0123456789    
```
创建成功后，Schema属性就变成了Model和Entity共有的属性了。

#### CRUD (增删改查)

mongoose提供如下的crud方法
* save
* find | findOne
* update
* remove

增加(Create)
```
const user = new User({
    username: 'i5ting',
    password: '123456'
});
user.save((err, u) => {
if (err) {console.log(err)}
})
```
更新(Update)
```
// 根据ID查找并更新
User.findByIdAndUpdate(u._id, {
    username: 'sang',
}, (err, user) => {
    t.false(err);
    t.is(user.username, 'sang');
});
// 根据查询条件查找并更新
User.findOneAndUpdate({
    username: 'i5ting for update 2',
}, {
    username: 'sang',
}, (err, user) => {
    t.false(err);
    t.is(user.username, 'sang');
});
// update方法
MyModel.update({ age: { $gt: 18 } }, { oldEnough: true }, fn);
MyModel.update({ name: 'Tobi' }, { ferret: true }, { multi: true }, function (err, numberAffected, raw) {
  if (err) return handleError(err);
  console.log('The number of updated documents was %d', numberAffected);
  console.log('The raw response from Mongo was ', raw);
});
```

删除(Delete)
```
User.remove({username: 'i5ting for delete'}, function(err, doc){
    t.false(err);
        t.is(doc.result.ok, 1);
        t.is(doc.result.n, 1);
})
```
在mongoose 4.1.0更新，在mpromise满足基本使用的情况下，高级用户可能想插入他们喜爱的ES6风格的Promise库如bluebird，或只是使用原生的ES6 promise。设置mongoose.Promise 给你喜欢的ES6风格的promise构造函数然后mongoose会使用它
```
mongoose.Promise = global.Promise;
```

### mongodb分页

常见的写法：
```
db.users.find().skip(pagesize*(n-1)).limit(pagesize)
```
更好的写法
```
db.usermodels.find({'_id' :{
   "$gt" :ObjectId("55940ae59c39572851075bfd")} 
}).limit(20).sort({_id:-1})
```
skip+limit只适合小量数据，数据一多就卡死，哪怕你再怎么加索引，优化，它的缺陷都那么明显。

如果你要处理大量数据集，你需要考虑别的方案的

优化方案：
使用 find() 和 limit() 实现
‘_id’是mongodb ObjectID类型的，ObjectID 使用12 字节的存储空间，每个字节两位十六进制数字，是一个24 位的字符串，包括timestamp, machined, processid, counter 等。下面会有一节单独讲它是怎么构成的，为啥它是唯一的。
```
db.usermodels.find({'_id' :{
   "$gt" :ObjectId("55940ae59c39572851075bfd")} 
}).limit(20).sort({_id:-1})
```

Mongoose的多表关联查询
populate
populate 方法可以用在 document 上、 model 上或者是 query 对象上，这意味着你几乎可以在任何地方调用这个方法以填充你的引用字段。
```
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  
var PersonSchema = new Schema({
  name    : String,
  age     : Number,
  stories : [{ type: Schema.Types.ObjectId, ref: 'Story' }]
});

var StorySchema = new Schema({
  _creator : { type: Schema.Types.ObjectId, ref: 'Person' },
  title    : String,
  fans     : [{ type: Schema.Types.ObjectId, ref: 'Person' }]
});

var Story  = mongoose.model('Story', StorySchema);
var Person = mongoose.model('Person', PersonSchema);
#关联查询
Story
.findOne({ title: /timex/ })
.populate('_creator')
.exec(function (err, story) {
  if (err) return handleError(err);
  console.log('The creator is %s', story._creator.name); // prints "The creator is Aaron"
}) 
```