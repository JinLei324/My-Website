/** @namespace */
const currentJobs = require('./currentJobs');
const driversList = require('./driversList');
const filterList = require('./filterList');


/**
* A module that exports Customer API  routes to hapi server!
* @exports MANAGER-API-ROUTES 
*/
module.exports = [].concat(driversList, currentJobs, filterList);