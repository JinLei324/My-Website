
/**
* A module that exports driver API  routes to hapi server!
* @exports DISPATCHER-API-ROUTES 
*/
/** @namespace */
const order = require('./order');
/** @namespace */
const search = require('./search');
/** @namespace */
// const store = require('./store');
/** @namespace */
const customer = require('./customer');
/** @namespace */
const fare = require('./fare');
/** @namespace */
const cart = require('./cart');
/** @namespace */
const categories = require('./categories');
/** @namespace */
const product = require('./product');
/** @namespace */
const password = require('./password');
/** @namespace */
const store = require('./store');
/** @namespace */
const validateAddress = require('./validateAddress')

module.exports = [].concat(fare, order, search, customer, cart, categories, product, password, store, validateAddress);