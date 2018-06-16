### Buffer模块
JavaScript语言自身仅仅支持Unicode字符串数据类型，还不能很好地支持二进制类型数据，Node.js针对这种情况进行了改进，提供了一个与字符串对等的全局核心模块Buffer让其很好的操作二进制数据类型。Buffer通俗的理解就是缓冲区，用来临时存放输入、输出数据的一小块内存。
Buffer的基本方法
```
    // 初始化一个Buffer, 参数数组里的元素均是16进制数值
    new Buffer(array)
    var buf = new Buffer("www.runoob.com", "utf-8");
    buf.length === 13
    // Buffer转换成其他格式
    buf.toString(encoding, start, end)
    // 处理data URIs
    // Data URIs允许一个资源以编码的格式：data:[MIME-type][;charset=<encoding>][;base64],<data>
    var fs = require('fs');
    var mime = 'image/png';
    var encoding = 'base64';
    var data = fs.readFileSync('./monkey.png').toString(encoding);
    var uri = 'data:' + mime + ';' + encoding + ',' + data;
    console.log(uri);
    
    // 判断Buffer对象
    Buffer.isBuffer()
    // 写 buf.write(string[, offset[, length]][, encoding])
    // string - 写入缓冲区的字符串。
    // offset - 缓冲区开始写入的索引值，默认为 0 。
    // ength - 写入的字节数，默认为 buffer.length
    // encoding - 使用的编码。默认为 'utf8' 
    var buf = new Buffer(3);
    
    buf.write("好",0, 3, "utf8")
    buf.toString() // 好
    
    // 读 buf.toString([encoding[, start[, end]]])
    var buf = new Buffer(3);
    
    buf.write("好",0, 3, "utf8")
    buf.toString() // 好
    buf.toString("utf8") // 好
    buf.toString("base64") // 5aW9
    buf.toString("ascii") // e%=
    
    // 合并
    Buffer.concat(list[, totalLength])
    var buffer1 = new Buffer("好")
    var buffer2 = new Buffer("你")
    var buffer3 = Buffer.concat([buffer1, buffer2])
    
    buffer3.toString() // 好你
    buffer3.toJSON() //{ type: 'Buffer', data: [ 229, 165, 189, 228, 189, 160 ] }
    // 拷贝 buf.copy(targetBuffer[, targetStart[, sourceStart[, sourceEnd]]])
```

### EventEmitter

Node的事件模块目前只包含一个类: EventEmitter，被用作基类解决大量问题。
* 基本用法：
```
    var util = require('util');
    var events = require('event');
    
    function MusicPlayer () {
        this.playing = false;
        events.EventEmitter.call(this);
    }
    util.inherits(MusicPlayer, events.EventEmitter);// 从一个原型拷贝到另一个原型
    var musicPlayer = new MusicPlayer();
    musicPlayer.on('play', function(track) {
        this.playing = true;
    });
    musicPlayer.on('stop', function(track) {
        this.playing = fasle;
    });
    // 异常处理
    musicPlayer.on('error', function(err) {
        console.error('Error:', err);
    });
    musicPlayer.emit('play', 'The Roots - The Fire');
    
    setTimeout(function () {
        musicPlayer.emit('stop');
    }, 1000);
```
Node的domain模块被用来集中地处理多个操作，这包括EventEmitter实例发出的未处理的error事件。<br>
* removeListener删除监听器:
```
    emitter.removeListener(event, listener)
```
* 通过domain管理异常:
```
    var util = require('util');
    var domain = require('domain');
    var events = require('events');
    var audioDomain = domain.create();
    function AudioDevice() {
        events.EventEmitter.call(this);
        this.on('play', this.play.bind(this));
    };
    util.inherits(AudioDevice, events.EventEmitter);
    AudioDevice.prototype.play = function () {
        // 这个错误以及任何其他的错误都会被同一个error处理方法处理
        this.emit('error', 'not implemented yet');
    };
    function MusicPlayer() {
        events.EventEmitter.call(this);
        this.audioDevice = new AudioDevice();
        this.on('play', this.play.bind(this));
        this.emit('error', 'No audio tracks are available');
    }
    util.inherits(MusicPlayer, events.EventEmitter);
    MusicPlayer.prototype.play = function () {
        this.audioDevice.emit('play');
        console.log('Now playing');
    };
    audioDomain.on('error', function(err) {
        console.log('audioDomain error:', err);
    });
    // 任何在run函数回调中导致的错误代码都会被domain覆盖到
    audioDomain.run(function(){
        var musicPlayer = new MusicPlayer();
        musicPlayer.play();
    });
```
* setMaxListeners函数
```
    var EventEmitter = require('events').EventEmitter; 
    // 设置这个emitter实例的最大事件监听数，默认是10个，设置0为不限制.
    var emitter = new EventEmitter();
    emitter.setMaxListeners(n) 
```

