#!/usr/bin/node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const hostile = require("hostile");
const program = require("commander");
const es6_promisify_1 = require("es6-promisify");
const index_1 = require("./index");
var version = require("../package.json").version;
var setRule = es6_promisify_1.promisify(hostile.set);
var removeRule = es6_promisify_1.promisify(hostile.remove);
var getAllRules = es6_promisify_1.promisify(hostile.get);
program.version(version)
    .option("-s, --set <host>", "set host to the fastest address")
    .option("-r, --remove <host>", "remove rule of the host")
    .parse(process.argv);
(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
    try {
        if (program.set) {
            let host = program.set;
            let ip = yield index_1.getFastestIp(host);
            yield setRule(ip, host);
            console.log(`'${host}' is set to '${ip}' now`);
        }
        else if (program.remove) {
            let host = program.remove;
            let lines = yield getAllRules(false);
            for (let [ip, _host] of lines) {
                if (_host === host) {
                    yield removeRule(ip, host);
                }
            }
            console.log(`rule of '${host}' has been removed`);
        }
        else {
            program.help();
        }
    }
    catch (err) {
        console.log(err);
    }
}))();
//# sourceMappingURL=fastest-hosts.js.map