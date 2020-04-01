var cron = require('node-cron');
const request = require('superagent');
var config = process.env;
cron.schedule('0 0 1 * *', function () {
    // cron.schedule('*/1 * * * *', function () {
    request.post(config.API_URL + "/cronJobTrigger")
        .end(function (err, res) {
        });
});