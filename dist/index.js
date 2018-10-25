"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const childProcess = require("child_process");
const request = require("request-promise-native");
const baseUrl = "http://tool.chinaz.com";
function getDNSServers(host) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            let page = yield request.get(`${baseUrl}/dns/?type=1&host=${host}`);
            let matches = page.match(/servers\s*=\s*\[\{.+\}\];/);
            if (!matches)
                [];
            let match = matches[0], i = match.indexOf("["), str = match.slice(i, -1), json = str.replace(/[\{,]([a-z]+):/g, match => {
                return match[0] + '"' + match.slice(1, -1) + '":';
            });
            return JSON.parse(json);
        }
        catch (err) {
            console.log(err);
            return [];
        }
    });
}
function getAllIPFromDNS(host) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let servers = yield getDNSServers(host), promises = [], data = {
            host,
            type: 1,
            total: servers.length,
            process: 0,
            right: 0
        };
        for (let server of servers) {
            let url = `${baseUrl}/AjaxSeo.aspx?t=dns&server=${server.ip}&id=${server.id}`;
            promises.push(request.post(url, {
                formData: data,
                headers: {
                    "Accept": "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36",
                    "Referer": `${baseUrl}/dns/?type=1&host=${host}`,
                    "X-Requested-With": "XMLHttpRequest",
                }
            }));
        }
        let res = yield Promise.all(promises);
        console.log(res);
        let ips = [];
        let addressItems = {};
        let items = [];
        res.forEach((line) => {
            try {
                let data = JSON.parse(line.slice(1, -1));
                if (data && typeof data.list == "object") {
                    let list = data.list.filter(item => item.type == "A");
                    for (let item of list) {
                        if (addressItems[item.ipaddress] === undefined)
                            addressItems[item.ipaddress] = 0;
                        addressItems[item.ipaddress]++;
                        items.push({ address: item.ipaddress, ip: item.result });
                    }
                }
            }
            catch (err) { }
        });
        if (!items.length)
            return [];
        let _tmp = [];
        for (let address in addressItems) {
            _tmp.push({ address, count: addressItems[address] });
        }
        _tmp.sort((a, b) => b.count - a.count);
        let mainAddress = _tmp[0].address;
        items.forEach(item => {
            if (item.address == mainAddress && !ips.includes(item.ip)) {
                ips.push(item.ip);
            }
        });
        return ips;
    });
}
exports.getAllIPFromDNS = getAllIPFromDNS;
function getFastestIp(host) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let ips = yield getAllIPFromDNS(host);
        let finished = Symbol("finished");
        let items = [];
        yield new Promise(resolve => {
            for (let ip of ips) {
                let task = childProcess.fork(__dirname + "/ping-task.js", ["--ip", ip]);
                task.on("message", (msg) => {
                    if (typeof msg == "object" && msg.ip && msg.comsuming) {
                        task[finished] = true;
                        items.push(msg);
                        task.disconnect();
                        if (items.length === ips.length)
                            resolve();
                    }
                }).on("error", () => {
                    if (!task[finished]) {
                        items.push({ ip: ip, consuming: -1 });
                        task[finished] = true;
                        task.disconnect();
                    }
                    if (items.length === ips.length)
                        resolve();
                }).on("exit", code => {
                    if (code)
                        task.emit("error");
                });
            }
        });
        if (items.length) {
            items = items.filter(item => item.consuming !== -1);
            items.sort((a, b) => a.consuming - b.consuming);
            return items[0].ip;
        }
        else {
            return ips[0];
        }
    });
}
exports.getFastestIp = getFastestIp;
//# sourceMappingURL=index.js.map