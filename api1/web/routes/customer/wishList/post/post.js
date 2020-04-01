'use strict'
const wishList = require('../../../../../models/wishList');
const childProducts = require('../../../../../models/childProducts');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const webSocket = require('../../../../../library/websocket/websocket');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    wishList.create({ userId: request.auth.credentials._id.toString(), name: request.payload.name, createdBy: request.auth.credentials.sub, storeId: request.payload.storeId, zoneId: request.payload.zoneId}, (err, res) => {
        if (err) {
            logger.error('Error occurred while adding to wishList : ' + err);
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        else
            // return reply({ message: error['wishList']['201'][request.headers.language], data: { listId: res.ops[0]._id, listName: res.ops[0].name } }).code(201);
            return reply({ message: request.i18n.__('wishList')['201'], data: { listId: res.ops[0]._id, listName: res.ops[0].name } }).code(201);
    });
}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    name: Joi.string().required().description('string'),
    storeId: Joi.string().required().description('string'),
    zoneId: Joi.string().required().description('string')
}
/**
* A module that exports add cart handler, add cart validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }