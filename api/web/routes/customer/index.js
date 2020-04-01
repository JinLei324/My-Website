/** @namespace */
const address = require('./address');
/** @namespace */
const verification = require('./verification');
/** @namespace */
const profile = require('./profile');
/** @namespace */
const guestLogin = require('./guestLogin');
/** @namespace */
const cart = require('./cart');
/** @namespace */
const order = require('./order');
const orderUpdate = require('./orderUpdate');
/** @namespace */
const validate = require('./validate');
/** @namespace */
const logout = require('./logout');
/** @namespace */
const login = require('./login');
/** @namespace */
const signUp = require('./signUp');
/** @namespace */
const password = require('./password');
/** @namespace */
const shoppingList = require('./shoppingList');
/** @namespace */
const wishList = require('./wishList');
/** @namespace */
const support = require('./support');
/** @namespace */
const appConfig = require('./appConfig');
/** @namespace */
const appVersions = require('./appVersions');
/** @namespace */
const cancellationReason = require('./cancellationReason');
/** @namespace */
const rating = require('./rating');

const promoCode = require('./promoCode');


const lastDue = require('./lastDue');

/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-API-ROUTES 
*/
module.exports = [].concat(lastDue, verification, profile, guestLogin, address, cart, order, validate, logout, login, signUp, password, shoppingList, wishList, support, appConfig, appVersions, cancellationReason, rating, promoCode, orderUpdate);