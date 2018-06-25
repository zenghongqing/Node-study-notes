### cluster 模块
Node.js是单线程运行的，不管机器有多少个内核，始终只能用到其中一个，为了能利用多核计算资源，需要使用多进程来处理应用。在V0.6.0版本，Node.js内置了cluster的特性。cluster模块让我们可以很容易地创建一个负载均衡的集群，自动分配CPU多核资源。整个架构如下图：
<img src='https://images2015.cnblogs.com/blog/80917/201604/80917-20160425170835923-1978677180.png'>
Master进程，需要做的就是监控worker的生命周期，如果worker挂掉了，就重启worker，并做好相应的log。
```
    const cluster = require('cluster');
    const http = require('http');
    // 决定应该启动多少个进程
    const cpuNum = require('os').cpus().length;
    
    if (cluster.isMaster) {
        for (let i = 0; i < cpuNum; i++) {
            cluster.fork();
        }
        // 监听worker退出事件
        cluster.on('exit', (worker) => {
            console.log(`worker${worker.id} exit`);
        });
        // 监听创建worker进程事件
        cluster.on('fork', (worker) => {
            console.log(`fork:worker${worker.id}`)
        });
        // 监听master向worker状态事件
        cluster.on('listening', (worker, addr) => {
           console.log(`worker${worker.id} listening on ${addr.address}:${addr.port}`);
        });
        // 监听指定的worker创建成功事件
        cluster.on('online', (worker) => {
            console.log(`worker ${worker.id} is online`)
        });
        Object.keys(cluster.workers).forEach(function (id) {
            cluster.workers[id].on('message', function (msg) {
                console.log('[master] ' + 'message ' + msg);
            });
        });
    } else {
        process.on('message', function (msg) {
            console.log('[worker] ' + msg);
            process.send('[worker] worker'+cluster.worker.id+' received!')
        })
        http.createServer((req, res) => {
            console.log(cluster.worker.id);
            res.writeHead(200);
            res.end('hello world');
        }).listen(3000, '127.0.0.1');
    }
```
可以使用process.send和cluster.workers[id].on('message', fn)在工作者进程之间通信。
#### cluster 工作原理
master是控制进程，worker是执行进程，每一个worker都是使用child_process.fork()函数创建的，因此master与worker之间是通过IPC通信。当worker调用server.listen()方法时会向master进程发送一个消息，让它创建一个服务器socket,做好监听并分享给该worker，
如果master已经有监听好的socket则跳过创建与监听过程，直接分享。也就是说所有的worker都是监听同一个socket，当有新连接进来时，由负载均衡算法选出一个worker进行处理。

其他知识点如：使用http-proxy将通信重定向到另一个端口
```
    var httpProxy = require('http-proxy');
    // 重定向到3000端口号
    var proxy = httpProxy.createProxyServer({
        target: 'http://localhost:3000'
    });
    // 捕获异常并记录
    proxy.on('error', function(err) {
        console.error('Error:', err);
    });
    proxy.listen(9000);
```
使用一台服务器的多个实例来扩展应用
```
    var http = require('http');
    var httpProxy = require('http-proxy);
    var targets = [
        {target: 'http://localhost:3000'},
        {target: 'http://localhost:3001'},
        {target: 'http://localhost:3002'}
    ];
    var proxies = targets.map(function(options, i) {
        // 为每个应用创建一个实例
        var proxy = new httpProxy.createProxyServer(options);
        proxy.on('error', function(err) {
            console.error('Proxy error:',err);
            console.error('Server:', i);
        });
        return proxy;
    });
    var i = 0;
    http.createServer(function(req, res){
        proxies[i].web(req, res);
        // 使用round-robin代理请求
        i = (i + 1) % proxies.length;
    }).listen(9000);
```