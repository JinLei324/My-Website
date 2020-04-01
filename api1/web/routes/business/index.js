/**
 * A module that exports driver API  routes to hapi server!
 * @exports BUSINESS-API-ROUTES
 */

/** @namespace */
// const zone = require('./zone');
/** @namespace */
const store = require("./store");
/** @namespace */
const home = require("./home");
/** @namespace */
const product = require("./product");
/** @namespace */
const fare = require("./fare");
/** @namespace */
const order = require("./order");
/** @namespace */
const trending = require("./trending");
/** @namespace */
const zone = require("./zone");
/** @namespace */
const transaction = require("./transactions");

module.exports = [].concat(store, home, product, fare, order, trending, zone, transaction);
