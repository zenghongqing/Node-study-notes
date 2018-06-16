### child_process模块
在Node里， child_process允许我们在自己的Node程序里调用外部的一些应用程序，这样就不必重新造轮子，它提供了四种方法：
* execFile: 执行外部程序，并且需要一组参数，以及一个在进程退出后的缓存输出的回调
```
    var child_process = require('child_process');
    
    child_process.execFile('/bin/ls', ['-lh', '.'], function (error, stdout, stderr) {
        if (error !== null) {
            console.log('execFile error: ' + error)
            console.log('execFile stderror: ' + stderr)
        } else {
            console.log(stdout)
        }
    })
```
* spawn: 执行外部程序，并且需要一组参数，以及一个在进程退出后的输入输出和事件的数据流接口
```
    var spawn = require('child_process').spawn;
    // var ls_var = spawn('ls', ['-lh', '/usr']);
    // 查看子进程pid
    var grep_node = spawn('grep', ['node'])
    /**
     * 捕获控制台输出对象stdout, 输出捕获数据
     * */
    ls_var.stdout.on('data', function (data) {
        console.log('stdout: ' + data)
    });
    
    /**
     * 绑定系统error事件
     * */
    ls_var.on('error', function (code) {
        console.log('child process error with code ' + code)
    });
    
    /**
     * 绑定系统close事件
     * */
    ls_var.on('close', function (code) {
        console.log('child process close with code ' + code)
    });
    
    /**
     * 绑定系统exit事件
     * */
    ls_var.on('exit', function (code) {
        console.log('child process exit with code ' + code)
    });
    
    console.log('Spawned child pid of node: ' + grep_node.pid)
```
* exec: 在一个命令行窗口中执行一个或多个命令，以及在一个进程退出后缓存输出的回调
```
    var sp = require('child_process');
    
    sp.exec('last | wc -l', function(err, stdout, stderr){
        console.log(stdout);
    });
```
* fork: 在一个独立的进程中执行一个Node模块, 并且需要提供一组参数，以及一个类似spawn方法里的数据流和事件式的接口，同时设置好父进程和子进程之间的进程通信
```
    //parent.js
    const  cp = require( 'child_process');
    const  n = cp.fork( `./child.js`);
    n.on('message', (m) => {
        console.log( 'PARENT got message:',  m);
    });
    n.send({ hello:  'world' });
    
    //child.js
    process.on( 'message', ( m) => {
        console.log( 'CHILD got message:',  m);
    });
    process.send({ foo:  'bar' });
```