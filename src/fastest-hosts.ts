#!/usr/bin/env node
import hostile = require("hostile");
import program = require("commander");
import { promisify } from "es6-promisify";
import { getFastestIp } from "./index"

var version: string = require("../package.json").version;
var setRule = promisify<void, string, string>(hostile.set);
var removeRule = promisify<void, string, string>(hostile.remove);
var getAllRules = promisify<[string, string][], boolean>(hostile.get);

program.version(version)
    .option("-s, --set <host>", "set host to the fastest address")
    .option("-r, --remove <host>", "remove rule of the host")
    .parse(process.argv);


(async () => {
    try {
        if (program.set) {
            let host: string = program.set;
            let ip = await getFastestIp(host);

            await setRule(ip, host);

            console.log(`'${host}' is set to '${ip}' now`);
        } else if (program.remove) {
            let host: string = program.remove;
            let lines = await getAllRules(false);

            for (let [ip, _host] of lines) {
                if (_host === host) {
                    await removeRule(ip, host);
                }
            }

            console.log(`rule of '${host}' has been removed`);
        } else {
            program.help();
        }
    } catch (err) {
        console.log(err);
    }
})();