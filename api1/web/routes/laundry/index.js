/**
* A module that exports laundry API  routes to hapi server!
* @exports Laundry-API-ROUTES 
*/
/** @namespace */
const pickupSlots = require('./pickupSlots');
const deliverySlots = require('./deliverySlots');
const sendPacket = require('./sendPacket');
const estimate = require('./estimate');
const store = require('./store');
const uploadImage = require('./saveimage');
module.exports = [].concat(pickupSlots,deliverySlots,sendPacket,store,estimate,uploadImage);