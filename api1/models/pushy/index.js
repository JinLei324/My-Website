'use strict';

const pushyUtil = require('./pushy');

exports.push_topic = pushyUtil.sendPushToTopic
exports.push_token = pushyUtil.sendPushToToken