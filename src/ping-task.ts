import ping = require("ping");

let ip = process.argv[3];

ping.promise.probe(ip, {
    timeout: 5
}).then(res => {
    process.send({ comsuming: res.alive ? parseInt(res.avg) : -1, ip });
}).catch(() => {
    process.send({ comsuming: -1, ip });
});