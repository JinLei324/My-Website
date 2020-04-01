'use strict';

const detail = require('./detail');
const recharge = require('./recharge');
const transactions = require('./transactions');

module.exports = [].concat(
  detail,
  recharge,
  transactions
);