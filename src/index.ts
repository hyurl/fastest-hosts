import * as childProcess from "child_process";
import request = require("request-promise-native");

const baseUrl = "http://tool.chinaz.com";

async function getDNSServers(host: string): Promise<{
    id: number,
    ip: string,
    state: number,
    trytime: number
}[]> {
    try {
        let page: string = await request.get(`${baseUrl}/dns/?type=1&host=${host}`);
        let matches = page.match(/servers\s*=\s*\[\{.+\}\];/);

        if (!matches) [];

        let match = matches[0],
            i = match.indexOf("["),
            str = match.slice(i, -1),
            json = str.replace(/[\{,]([a-z]+):/g, match => {
                return match[0] + '"' + match.slice(1, -1) + '":';
            });

        return JSON.parse(json);
    } catch (err) {
        console.log(err);
        return [];
    }
}

export async function getAllIPFromDNS(host: string) {
    let servers = await getDNSServers(host),
        promises = [],
        data = {
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
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36",
                "Referer": `${baseUrl}/dns/?type=1&host=${host}`,
                "X-Requested-With": "XMLHttpRequest",
            }
        }));
    }

    let res = await Promise.all(promises);
    let ips: string[] = [];
    res.forEach((item: string) => {
        try {
            let data = JSON.parse(item.slice(1, -1));
            if (data && typeof data.list == "object") {
                let list: { result: string }[] = data.list;

                list.forEach(_item => {
                    if (!ips.includes(_item.result)) {
                        ips.push(_item.result);
                    }
                });
            }
        } catch (err) { }
    });

    return ips;
}

export async function getFastestIp(host: string) {
    let ips = await getAllIPFromDNS(host);
    let finished = Symbol("finished");
    let items: { ip: string, consuming: number }[] = [];

    await new Promise(resolve => {
        // folk task processes for each ip and ping the ips in pararal
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
    } else {
        return ips[0];
    }
}