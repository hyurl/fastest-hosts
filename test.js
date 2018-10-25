const { getFastestIp } = require(".");

(async () => {
    console.log(await getFastestIp("github.com"));
})()