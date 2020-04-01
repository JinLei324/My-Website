/** @namespace */
const currentJobs = require('./currentJobs');
const driversList = require('./driversList');
const filterList = require('./filterList');
const getDriversList = require('./get')


/**
* A module that exports Customer API  routes to hapi server!
* @exports MANAGER-API-ROUTES 
*/
module.exports = [].concat(driversList, currentJobs, filterList, getDriversList);