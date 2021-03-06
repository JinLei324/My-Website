/** @namespace */

const orders = require('./orders');
const autoDispatch = require('./autoDispatch');


/**
* A module that exports Customer API  routes to hapi server!
* @exports MANAGER-API-ROUTES 
*/

module.exports = [].concat( orders, autoDispatch);


