### Node.js模块以及环境
Node.js框架有一套简单基于CommonJS的模块加载系统，在Node.js框架中的文件和模块都是一一对应的联系的。Node.js框架的模块以及包管理从性质及加载方式上可以分为：核心模块、文件模块、文件夹加载和模块缓存。require的查找策略如下：
<img src='https://segmentfault.com/img/bVZ4XS?w=708&h=572'>
原生模块在Node.js源代码编译的时候编译进了二进制执行文件，加载速度最快。另一类文件模块是动态加载的，加载速度比原生模块慢。但是Node.js对原生模块和文件模块都进行了缓存，于是第二次require时，是不会有重复开销的。
当require一个文件模块时，从当前文件目录开始查找node_modules目录；然后依次进入父目录，查找父目录下地node_modules目录；依次迭代，直到根目录下的node_modules目录.简而言之，如果require绝对路径的文件，查找时不会去遍历每一个node_modules目录，其速度最快.

* 模块的循环加载问题

main.js文件
```
    console.log('main starting');
    var a = require('./a.js');
    var b = require('./b.js');
    console.log('in main, a.done=%j, b.done=%j', a.done, b.done);
```
脚本a.js
```
    exports.done = false;
    var b = require('./b.js');
    console.log('在 a.js 之中，b.done = %j', b.done);
    exports.done = true;
    console.log('a.js 执行完毕');
```
第一行导出对象.done的逻辑值为false，第二行又通过require引用b.js文件模块并保留在变量b中，第三行打印变量b引用的.done导出对象的逻辑值，第四行重新设定导出对象.done的逻辑值。
脚本b.js
```
    exports.done = false;
    var a = require('a.js');
    console.log('在 b.js 之中，a.done = %j', a.done);
    exports.done = true;
    console.log('b.js 执行完毕');
```
脚本b.js加载与a.js类似.
首先main.js会加载a.js,接着a.js又去加载b.js模块。此时b.js又会尝试去加载a.js文件模块。Node框架为了防止无限地循环调用，a.js会返回一个unfinished copy给b.js.然后b.js会停止加载，并将exports对象.done返回给a.js文件模块。

* module.exports对象和exports对象
Node.js框架的官方文档给出：module.exports才是module模块的真正接口，exports可以理解为它的一个副本，虽然修改exports对象的时候也会修改module.exports对象，但是返回的是module.exports对象而不是exports对象。当module.exports对象设定后已经和exports对象的指向不同了，这时
无论exports怎么修改都已经和module.exports无关了。

#### Node.js事件循环

Node启动时会初始化一个事件循环，事件循环不会单独开一个线程，而是挂载到主线程。Node事件循环分为六个阶段：
```
       ┌───────────────────────┐
    ┌─>│        timers         │
    │  └──────────┬────────────┘
    │  ┌──────────┴────────────┐
    │  │     I/O callback      │
    │  └──────────┬────────────┘
    │  ┌──────────┴────────────┐
    │  │     idle, prepare     │
    │  └──────────┬────────────┘      ┌───────────────┐
    │  ┌──────────┴────────────┐      │   incoming:   │
    │  │         poll          │<─────┤  connections, │
    │  └──────────┬────────────┘      │   data, etc.  │
    │  ┌──────────┴────────────┐      └───────────────┘
    │  │        check          │
    │  └──────────┬────────────┘
    │  ┌──────────┴────────────┐
    └──┤    close callbacks    │
       └───────────────────────┘</code>
```
timers阶段：这个阶段执行setTimeout(callback)和setInterval(callback)预定的callback；<br>
I/O callbacks阶段：执行除了close事件、被times阶段设定的callback以及setImmediate()设定的callbacks之外的callbacks；<br>
idle, prepare阶段：仅node内部使用；<br>
poll阶段: 获取新的I/O事件，适当的将node阻塞在这里；<br>
check阶段：执行setImmediate() 设定的callbacks;<br>
close callbacks阶段：比如socket.on(‘close’, callback)的callback会在这个阶段执行.

每一个阶段有一个队列，event loop执行到该阶段时，会执行该队列里所有的callbacks，当队列callback为空时，或callback执行到上限的时，就跳至下一阶段进行执行。
其中poll阶段除了执行当前阶段的队列里的所有callback之外，poll还负责检测是否有timer的callback，如timer到达时间，并且timer的callback还未执行，那么就循环至开头执行timer的callback。
```
    process.nextTick(function A() {
        console.log(1);
        process.nextTick(function B() {console.log(2)})
    })
    setTimeout(function timeout() {
      console.log('TIMEOUT FIRED');
    }, 0)
    // 1
    // 2
    // TIMEOUT FIRED
```
process.nextTick方法可以在当前"执行栈"的尾部----下一次Event Loop（主线程读取"任务队列"）之前----触发回调函数

```
    setTimeout(() => console.log("timeout"),0)

    setImmediate(() => console.log("immediate"))
```
在主模块下，同样受系统其他进程的影响，可能timeout不能进入第一次event loop的timer阶段，所以可能是处于check阶段的immediate先执行，也可能是处于timer阶段的timeout先执行。但是如果同时处于其他的callback里面，则
immediate总比timeout先执行。

