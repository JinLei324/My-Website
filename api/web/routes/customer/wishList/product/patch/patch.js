'use strict'
const wishList = require('../../../../../../models/wishList');
const childProducts = require('../../../../../../models/childProducts');
const error = require('../../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const webSocket = require('../../../../../../library/websocket/websocket');
const async = require('async');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    async.each(request.payload.product, (item, callback) => {
        wishList.pullItems({
            list: { id: request.payload.listId }, userId: request.auth.credentials._id.toString(), childProductId: item.childProductId, parentProductId: item.parentProductId,
            //   unitId: item.unitId,
            createdBy: request.auth.credentials.sub
        }, (err, res) => { // for dynamically adding items or removing items also same model sooo
            if (err) {
                logger.error('Error occurred while adding to wishList : ' + err);
                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            }
            else {
                //  callback();
                childProducts.pullfromWishList({
                    userId: request.auth.credentials._id.toString(), childProductId: item.childProductId, parentProductId: item.parentProductId,
                    // unitId: item.unitId,
                    listId: request.payload.listId, createdBy: "customer"
                }, (err, data) => {
                    callback();
                });
            }
        });
    }, function (err) {
        // return reply({ message: error['wishList']['202'][request.headers.language] }).code(202);
        return reply({ message: request.i18n.__('wishList')['202'] }).code(202);
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
    product: Joi.array().items().required().description('array [{"childProductId": "5a5079f6917ede31ff32e513","parentProductId" : "5a5079f6917ede31ff32e513"}]')
}
/**
* A module that exports add cart handler, add cart validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }