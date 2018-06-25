const cluster = require('cluster');
const http = require('http');

const cpuNum = require('os').cpus().length;

if (cluster.isMaster) {
    for (let i = 0; i < cpuNum; i++) {
        var wk = cluster.fork();
        wk.send('master ' + 'hi worker' + wk.id);
    }
    cluster.on('exit', (worker) => {
        console.log(`worker${worker.id} exit`);
    });
    cluster.on('fork', (worker) => {
        console.log(`fork:worker${worker.id}`)
    });
    cluster.on('listening', (worker, addr) => {
       console.log(`worker${worker.id} listening on ${addr.address}:${addr.port}`);
    });
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