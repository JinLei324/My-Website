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
    wishList.patchData({ userId: request.auth.credentials._id.toString(), name: request.payload.name, image: request.payload.image, listId: request.payload.listId, createdBy: request.auth.credentials.sub }, (err, res) => {
        if (err) {
            logger.error('Error occurred while adding to wishList : ' + err);
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        else
            // return reply({ message: error['wishList']['203'][request.headers.language], data: { listId: res.value._id, listName: res.value.name, listImage: res.value.image } }).code(203);
            return reply({ message: request.i18n.__('wishList')['203'],data: { listId: res.value._id, listName: res.value.name, listImage: res.value.image } }).code(203);
    });
}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    listId: Joi.string().required().min(24).max(24).description('string'),
    name: Joi.string().required().description('string'),
    image: Joi.string().required().description('string').allow("")
}
/**
* A module that exports add cart handler, add cart validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }