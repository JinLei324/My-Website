'use strict'

const webSocket = require('../../../../library/websocket/websocket');
const error = require('../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
var dispatchLogs = require('../../../../models/dispatchLogs');
const Async = require('async');

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {

    return reply.redirect("http://superadmin.instacart-clone.com/index.php?/Business/addnewbusinessPos/" + request.params.locationId + "/" + request.params.string + "/" + request.params.address + "/" + request.params.email_address + "/" + request.params.phone + "/" + request.params.locationName + "/" + request.params.paymentsEnabled + "/" + request.params.posId + "/" + request.params.qcWalletId);

};


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    locationId: Joi.any().required().description('location Id'),
    string: Joi.any().required().description('string'),
    address: Joi.any().required().description('address'),
    email_address: Joi.any().required().description('email_address'),
    phone: Joi.any().required().description('phone'),
    locationName: Joi.any().required().description('locationName'),
    paymentsEnabled: Joi.any().required().description('paymentsEnabled'),
    posId: Joi.any().required().description('paymentsEnabled'),
    qcWalletId: Joi.any().required().description('quickcard WalletId'),

}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }


