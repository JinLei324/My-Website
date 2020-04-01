'use strict'
const wishList = require('../../../../../models/wishList');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    wishList.removeListDetail({
        userId: request.auth.credentials._id.toString(),
        listId: request.params.listId,
        createdBy: request.auth.credentials.sub
    }, (err, data) => {
        if (err) {
            logger.error('Error occurred while removing from wishList : ' + err);
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        } else if (data.result.n == 0) {
            logger.info("Record List not found");
            // return reply({ message: error['wishList']['404'][request.headers.language] }).code(404);
            return reply({ message: request.i18n.__('wishList')['404'] }).code(404);
        } else {
            // return reply({ message: error['wishList']['202'][request.headers.language] }).code(202);
            return reply({ message: request.i18n.__('wishList')['202'] }).code(202);
        }

    });
}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    listId: Joi.string().required().min(24).max(24).description('wish List').error(new Error('listId must be a 24 character string'))
}
/**
* A module that exports customer send otp handler, send otp validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }