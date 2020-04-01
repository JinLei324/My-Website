/** @namespace */
const ordersList = require('./ordersList');
const updateStatus = require('./updateStatus');
const pastOrders = require('./pastOrders');
const userPastOrders = require('./userPastOrders');
const details = require('./details');
const search = require('./search');


/**
* A module that exports Customer API  routes to hapi server!
* @exports MANAGER-API-ROUTES 
*/
module.exports = [].concat(ordersList, updateStatus, pastOrders, userPastOrders, details, search);
