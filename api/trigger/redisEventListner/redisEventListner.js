const redis = require("../../library/redis");
const request = require("superagent");
// const configuration = require('../../configuration');
const subscriber = redis.subscriber;
var config = process.env;
subscriber.psubscribe("__key*__:*");

subscriber.on("pmessage", function (pattern, channel, message) {
  if (channel == "__keyevent@0__:expired") {
    request
      .post(config.API_URL + "/redisEvent")
      .send({ pattern: pattern, channel: channel, message: message })
      .end(function (err, res) { });
  }
});
