### net模块
Node.js平台的一个亮点就是开发快速稳定的网络应用。框架提供了Net模块一些用于底层的网络通信的小工具，包含创建服务器/客户端方法。
Net模块可用于创建Socket服务器或Socket客户端。NodeJS 的数据通信，最基础的两个模块是 Net 和 Http，前者是基于 Tcp 的封装，后者本质还是 Tcp 层，只不过做了比较多的数据封装，我们视为表现层.
该模块的结构组成：
<img src='http://note.youdao.com/yws/public/resource/250ba2150b8b7b38382d22cfd603a137/0991A0E4075840E28623F2DF779F4E05'>
TCP通信：
```
    // 客户端 client.js
    var net = require('net');
    var HOST = '127.0.0.1';
    var PORT = 9696;
    // 使用net.connect()方法创建TCP客户端实例
    var client = net.connect(PORT,HOST,function(){
        console.log('client connetced...');
        client.write('client write:Hello Server!');
    });
    // 为TCP客户端实例添加一个data事件处理函数
    client.on('data', function(data){
        console.log(data.toString());
        console.log('client on data...');
        // 执行关闭客户端操作
        client.end();
    });
    // 为TCP客户端实例添加一个end事件处理函数
    client.on('end', function(){
        console.log('client disconnected');
    });
```
```
    // 服务端 server.js
    var net = require('net');
    var HOST = '127.0.0.1';
    var PORT = 9696;
    // 使用net.createServer()方法创建一个TCP服务器实例，同时调用listen()监听指定端口
    // 传入net.createServer()方法的回调函数作为connection事件的处理函数
    net.createServer(function(socket){
        // 回调函数获得一个参数，该参数自动关联一个socket对象
        // 在每一个connection事件中，该回调函数接收到的socket对象是唯一的
        console.log('CONNECTED:' + socket.remoteAddress + ':' + socket.remotePort);
        // 为socket实例添加一个data事件处理函数
        socket.on('data', function(data) {
            // 打印客户端发来的消息
            console.log('DATA' + socket.remoteAddress + ':' + data);
            // 回发数据，客户端将接受到来自服务端的数据
            socket.write('Server write:' + data);
        });
        socket.on('close', function(data) {
            console.log('CLOSED:' + socket.remoteAddress + ' ' + socket.remotePort);
        })
    }).listen(PORT, HOST);
```
也可以使用另一种方式创建net服务器
```
    var server = net.createServer();
    
    server.listen(PORT, HOST);
    // server.listen()方法启动监听服务端端口的操作，该方法执行后，listening监听事件会被触发
    server.on('connection', function(socket) {
        console.log('CONNECTED:' + socket.remoteAddress + ':' + socket.remotePort);
        // 获取当前服务器连接数
        server.getConnections(function(err,count){
            if (err) {console.error(err);}
            else {
                console.info('current connections is ' + count);
            }
        })
    })
    server.on('listening', function(){
        // server.address()方法执行获取服务器地址参数，必须在listening事件发生后
        var addr = server.address();
        console.info('%j', addr);
    });
```

UDP通信
```
    // server.js
    var dgram = require('dgram');
    var HOST = '127.0.0.1';
    var PORT = 12345;
    // 使用dgram.createSocket()方法创建UDP服务器实例
    var server = dgram.createServer('udp4');
    // 添加一个listening事件处理函数
    server.on(listening', function(){
        console.log('UDP Server listening on...');
    });
    // 为UDP添加一个message事件处理函数
    server.on('message', function(message, remote) {
        console.log('UDP Server recieved from ' + remote.address + ':' + remote.port);
        server.close();
    });
    // 添加error事件处理函数
    server.on('error', function (err) {
        console.log(err.stack);
        server.close();
    });
    server.on('close', function(){
        console.log('server closed');
    });
    server.bind(PORT, HOST);
```
```
    // client.js
    var dgram = require('dgram');
    var HOST = '127.0.0.1';
    var PORT = 12345;
    var message = new Buffer('UDP client to Server: Hello Server!');
    
    // 使用dgram.createSocket()方法创建一个UDP客户端
    var client = dgram.createSocket('udp4');
    // 向服务器发送UDP数据报
    client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
        if (err) throw err;
        console.info(bytes);
        client.close();
    });
    client.on('close', function(){
        console.log('client disconnected');
    });
```

### http模块
http协议是无状态协议，而且基于tcp，Node的HTTP模块更像是基于TCP模块构建的。
一个简单地http服务器
```
    var http = require('http');
    var server = http.createServer(function(req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write('Hello world.\n');
        res.end();
    });
    server.listen(8000, function(){
        console.log('sever is listening on 8080...')
    });
    var req = http.request({port: 8080}, function(res) {
        console.log('HTTP headers:', res.headers);
        res.on('data', function(data){
            console.log('BODY:' + data.toString());
            // 当断开连接的时候被告知停止监听
            server.unref();
        })
    });
    req.end();
```
Node http模块提供了一个实用的API处理http请求，但是它无处处理重定向，而重定向是Web中常见的主流技术，所以这里创建一个HTTP的GET请求来处理重定向
```
    var http = require('http');
    var url = require('url');
    var https = require('https');
    var request;
    function Request () {
        this.maxRedirects = 10;
        this.redirects = 0;
    }
    Request.prototype.get = function (href, callback) {
        var uri = url.parse(href);
        var options = {host: uri.host, path: uri.path};
        var httpGet = uri.protocol === 'http' ? http.get : https.get;
        console.log('GET:', href);
        function processResponse (response) {
            // 检查状态码是否在HTTP重定向范围内
            if (response.statusCode >= 300 && response.statusCode < 400) {
                if (this.redirects >= this.maxRedirects) {
                    this.error = new Error('Too many redirects for: ' + href);
                } else {
                    this.redirects++;
                    href = url.resolve(options.host, response.headers.location);
                    // 遇到重定向时，调用自身递归
                    return this.get(href, callback);
                }
            }
            response.url = href;
            response.redirects = this.redirects;
            cosnole.log('Redirected:', href);
            function end() {
                console.log('Connection ended');
                callback(this.error, response);
            }
            response.on('data', function(data){
                console.log('Got data, length:', data.length);
            });
            response.on('end', end.bind(this));
        }
        // 使用Function.prototype.bind绑定回调到Request实例
        httpGet(options, processResponse.bind(this))
        .on('error', function(err){
            callback(err);
        });
    };
    request = new Request();
    request.get('http://baidu.com', function(err, res) {
        if (err) {
            console.error(err);
        } else {
            console.log('Fetched URL:', res.url, 'with', res.redirects);
            process.exit();
        }
    })
```
HTTP代理: 获取HTTP请求和响应，将其传送到该去的地方
```
    var http = require('http');
    var url = require('url');
    http.createServer(function(req, res) {
        var options = url.parse(req.url);
        options.headers = req.headers;
        var proxyRequest = http.request(options, function(proxyResponse){
            proxyResponse.on('data', function(chunk){
                res.write(chunk);
            });
            proxyResponse.on('end', function(){
                res.end();
            });
            res.writeHead(proxyResponse.statusCode, proxyResponse.headers);
        });
        req.on('data', function(chunk){
            proxyRequest.write(chunk, 'binary');
        });
        req.on('data', function() {
            proxyRequest.end();
        });
    }).listen(8000);
```
这个例子，计算机需要一个小的配置，就是在浏览器中设置代理。

node的加密是使用tls加密模块，使用了OpenSSL安全传输层套接字(TLS/SSL),允许HTTP服务端与客户端通过TLS/SSL通信.
```
    var fs = require('fs');
    var https = require('https');
    var options = {
        // 私钥
        key: fs.readFileSync('server.pem'),
        // 公钥
        cert: fs.readFileSync('server-cert.pem'),
        // 确保客户端证书都要被检查
        ca: [fs.readFileSync('client.pem')],
        // 当浏览器请求一个页面时，展示服务器是否能够验证证书
        requestCert: true
    };
    var server = https.createServer(options, function(req, res){
        var authorized = req.socket.authorized?'authorized':'unauthorized';
        res.writeHead(200);
        res.write('Welcom! You are ' + authorized + '\n');
        res.end();
    });
    server.listen(8000, function(){
        console.log('Server listening');
    });
```