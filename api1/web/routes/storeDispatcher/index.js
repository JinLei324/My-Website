/** @namespace */
const manager = require('./manager');
const orders = require('./orders');
const driver = require('./driver');
const dispatch = require('./dispatch');
// const redisEvent = require('./redisEvent');
const autoDispatch = require('./autoDispatch');
const booking = require('./booking');


/**
* A module that exports Customer API  routes to hapi server!
* @exports MANAGER-API-ROUTES 
*/
module.exports = [].concat(manager, orders, driver, dispatch, autoDispatch, booking);