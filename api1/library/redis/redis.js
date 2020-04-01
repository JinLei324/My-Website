'use strict'

var redis = require('redis');

const config = require('../../config/components/redis');

const CHANNELS = {
   bookingChn: 'bookingChn'
}
var client = redis.createClient({
   "host": config.redisConfHost,
   "port": config.redisConfPort
});
client.auth(config.redisConfPass);

var subscriber = redis.createClient({
   "host": config.redisConfHost,
   "port": config.redisConfPort
});
subscriber.auth(config.redisConfPass);

var publisher = redis.createClient({
   "host": config.redisConfHost,
   "port": config.redisConfPort
});
publisher.auth(config.redisConfPass);

module.exports = Object.assign(CHANNELS, {
   CHANNELS,
   client,
   subscriber
});

