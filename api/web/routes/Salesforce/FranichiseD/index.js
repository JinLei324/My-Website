/** @namespace */
const driver = require('./driver');
const store = require('./store');
/**
* A module that exports Customer API  routes to hapi server!
* @exports MANAGER-API-ROUTES 
*/
module.exports = [].concat(driver,store);