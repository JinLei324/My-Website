
/**
* A module that exports driver API  routes to hapi server!
* @exports FRANCHISEPASSWORDFORGET-API-ROUTES 
*/
/** @namespace */
const forgot = require('./forgot');
const reset = require('./reset');


module.exports = [].concat(
    forgot,
    reset
);
