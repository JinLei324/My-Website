
/**
* A module that exports driver API  routes to hapi server!
* @exports DRIVER-API-ROUTES 
*/

/** @namespace */
const verification = require('./verification');
/** @namespace */
const profile = require('./profile');
/** @namespace */
const appConfig = require('./appConfig');
/** @namespace */
const login = require('./login');
/** @namespace */
const signUp = require('./signUp');
/** @namespace */
const password = require('./password');
/** @namespace */
const productSearch = require('./productSearch');
/** @namespace */
const location = require('./location');
/** @namespace */
const order = require('./order');
/** @namespace */
const zones = require('./zones');
/** @namespace */
const logout = require('./logout');
/** @namespace */
const onlineoffline = require('./onlineoffline');
/** @namespace */
const support = require('./support');
/** @namespace */
const validate = require('./validate');
/** @namespace */
const redisEvent = require('./redisEvent');
/** @namespace */
const booking = require('./booking');
/** @namespace */
// const recharge = require('./recharge');
/** @namespace */
// const transactions = require('./transactions');
/** @namespace */
const locationLog = require('./locationLog');
/** @namespace */
const cancellationReason = require('./cancellationReasons');
/** @namespace */
const wallet = require('./wallet');


module.exports = [].concat(
    verification,
    profile, appConfig, login,
    signUp, password,
    order, zones, logout,
    validate, support,
    redisEvent,
    location, onlineoffline,
    booking, locationLog,
    productSearch,
    cancellationReason, wallet

);