/** @namespace */
const ask = require('./ask');
const responseTo = require('./responseTo');
//const statusCourier = require('./statusCourier');
const statusRide = require('./statusRide');


/**
* A module that exports Customer API  routes to hapi server!
* @exports MANAGER-API-ROUTES 
*/
module.exports = [].concat(ask, responseTo, statusRide);