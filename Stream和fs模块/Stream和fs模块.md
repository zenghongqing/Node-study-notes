### Stream 流
流是基于事件的API，用于管理和处理数据，而且有不错的效率.如：对于一个HTTP服务器的请求是一个流，stdout/stdin也是一个流，流是可读(Readable)、可写(Writable)或双工的(Duplex).Node.js框架中流模块操作最主要的是pipe方法，通过抽象的流接口来控制流之间的读写平衡。
倘若有一个方式告知fs.readFile去读取一个数据块到内存中，当处理大文件压缩、归档、媒体文件等的时候，内存使用就成了问题。这时候流就派上用场了，相较于将剩余文件数据一次性读进内存，可以使用fs.read配合一个合适的缓冲区，一次读取固定的长度，可以使用fs.createReadStream提供的流API，结果被写到输出流。
一般示例：
```
    var fs = require('fs');
    // 创建可读(readable)流
    var rs = fs.createReadStream('***.txt');
    var ws = fs.createWriteStream('***.txt');
    // 流(stream)模块 --- readable事件处理函数
    rs.on('readable', function(){
        console.log('readable event emitted');
    });
    // 流(stream)模块 --- data事件处理函数(也会触发readable事件)
    rs.on('data', function(chunk){
        console.log('data event emitted');
        // 通过ws.write()方法返回值判断，数据是写入目标还是写入缓存
        if (ws.write(chunk) === false) {
            console.log('数据写入缓存...');
            rs.pause(); // 暂停可读
        }
    });
    // 流(stream)模块 --- drain事件处理函数
    ws.on('drain', function(){
        console.log('drain event emitted');
        rs.resume();
    });
    // 流(stream)模块 --- finish事件处理函数
    ws.on('finish', function(){
        console.log('finish event emitted.')
    });
    // 流(stream)模块 --- end事件处理函数
    rs.on('end', function(){
        console.log('end event emitted');
    });
   
    // 流(stream)模块 --- error事件处理函数
    rs.on('error', function(){
        console.log('error event emitted');
    })
```

rs.pause()方法会使一个处于流动模式的流停止触发data事件，切换到非流动模式，并让后续数据留在内部缓冲区。
rs.resume()让一个可读流可以继续触发data事件
一个使用流的简单的静态web服务器
```
    var http = require('http');
    var fs = require('fs');
    http.createServer(function(req, res) {
        // 通过管道的方式从一个文件输出到Node的http请求响应
        fs.createReadStream(__dirname + 'index.html').pipe(res);
    });
```
实现一个可读流(允许流处理JavaScript对象)
```
    var stream = require('stream');
    var util = require('util');
    util.inherits(MemoryStream, stream.Readable);
    function MemoryStream (options) {
        options = options || {};
      
        stream.Readable.call(this);
    }
    MemoryStream.prototype._read = function(size) {
        this.push(process.memoryUsage());
    }
    memoryStream = new MemoryStream();
    memoryStream.on('readable', function(){
        // 获取最新数据
        var output = memoryStream.read();
        console.log('Type:%s, value:%j', typeof output, output);
    })
```
使用objectMode时，流的底层习惯未发生变化，用来除去内部缓存区合并和长度检查，并且读取和写入时忽略大小参数。其中所有定制stream.Readable类都必须实现_read()
方法。
实现一个可写流
```
    var stream = require('stream');
    GreenStream.prototype = Object.create(stream.Writable.prototype, {
        constructor: {value: GreenStream}
    });
    function GreenStream(options) {
        stream.Writable.call(this, options);
    }
    GreenStream.prototype._write = function(chunk, encoding, callback) {
        process.stdout.write('u001b[32m' + chunk + 'u001b[39m');
        callback()l
    };
    // 从输入到输出把文本转换为绿色文本
    process.stdin.pipe(new GreenStream());
```

### fs模块
fs模块包含常规的POSIX文件操作的封装，以及批量操作、流和监听操作。还有很多操作的同步接口。
递归文件操作
```
    var fs = require('fs');
    var join = require('path').join;
    
    exports.findSync = function(nameRe, startPath) {
        var result = [];
        function finder (path) {
            // 同步查看目录
            var files = fs.readdirSync(path);
            for (var i = 0; i < files.length;i++) {
                var fpath = files[i];
                var stats = fs.statSync(fpath);
                // 判断如果是文件夹，则递归处理
                if (stats.isDirectory()){
                    finder(fpath);
                }
                if (stats.isFile() && nameRe.test(fpath)) {
                    result.push(fpath);
                }
            }
        }
        finder(startPath);
        return result;
    }
```
递归创建多层目录
```
    var fs = require('fs');
    var path = require('path');
    // 异步方式
    function mkdirs (dirname, callback) {
        fs.exists(dirname, function(exits) {
            // 判断路径是否存在
            if (exits) {
                callback();
            } else {
                mkdirs(path.dirname(dirname), function(){
                    fs.mkdir(dirname, callback);
                });
            }
        })
    }
    // 同步方式
    function mkdirsSync (dirname) {
        if (fs.existSync(dirname)) {
            return true;
        } else {
            if (mkdirsSync(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }
    }
```
文件监控使用fs.watch和fs.watchFile, 区别：在监听一个目录时，许多对文件的更新不会被fs.watchFile监听到，如果想使用fs.watchFile,那么可以监听单个文件，使用fs.watch的优点：
(1) 一个更可靠的实现使得文件改变的事件总是被执行
(2) 一个更快的实现，当事件发生时能够立即通知到Node进程

至于读写的功能都比较常见：
```
    var fs = require('fs');
    console.log('准备写入文件');
    fs.writeFile('input.txt', '我是新写入的内容', function (err) {
        if (err) console.error(err);
        console.log('数据写入的数据');
        console.log('-------------------');
    });
    console.log('读取写入的数据');
    fs.readFile('input.txt', function (err, data) {
        if (err) console.error(err);
        console.log('异步读取文件数据：' + data.toString());
    })
```
