const inventory = require('./get');
const order = require('./post');


/**
* A module that exports Customer API  routes to hapi server!
* @exports POS-API-ROUTES 
*/
module.exports = [].concat(inventory, order);