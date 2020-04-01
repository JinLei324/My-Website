/** @namespace */
const customer = require('./customer');
/** @namespace */
const product = require('./product');
 
/**
* A module that exports business API  routes to hapi server!
* @exports DISPATCHER-SEARCH-API-ROUTES 
*/
module.exports = [].concat(product,customer)