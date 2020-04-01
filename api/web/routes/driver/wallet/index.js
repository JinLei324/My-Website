/** @namespace */

const detail = require('./detail');
const recharge = require('./recharge');
const transactions = require('./transactions');


/**
* A module that exports Customer API  routes to hapi server!
* @exports MANAGER-API-ROUTES 
*/

module.exports = [].concat(detail, recharge, transactions);


