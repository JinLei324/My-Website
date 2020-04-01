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
    async.each(request.payload.list, (item, callback) => {

        wishList.isExistsWithItem({
            list: item,
             userId: request.auth.credentials._id.toString(),
              childProductId: request.payload.childProductId, 
              zoneId: request.payload.zoneId, 
            parentProductId: request.payload.parentProductId
            // unitId: request.payload.unitId 
        }, (err, isItem) => {
            if (err) {
                logger.error('Error occurred while checking wishList : ' + err);
                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            }
            if (isItem)
                if (item.checked == false)
                    wishList.pullItems({
                        list: item,
                         userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId,
                        storeId: request.payload.storeId,zoneId: request.payload.zoneId, parentProductId: request.payload.parentProductId,
                        // unitId: request.payload.unitId , 
                        createdBy: request.auth.credentials.sub
                    }, (err, res) => {
                        if (err) {
                            logger.error('Error occurred while adding to wishList : ' + err);
                            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                        }
                        else {
                            childProducts.pullfromWishList({
                                userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId,
                                //unitId: request.payload.unitId,
                                // parentProductId: request.payload.parentProductId, 
                                listId: item.id, createdBy: request.auth.credentials.sub
                            }, (err, data) => {
                                callback();
                            });
                          
                        }
                    });
                else
                    callback();

            else
                if (item.checked == true)
                    wishList.pushItems({
                        list: item, userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId,
                        storeId: request.payload.storeId,
                        zoneId: request.payload.zoneId,
                        //unitId: request.payload.unitId,
                        parentProductId: request.payload.parentProductId, createdBy: request.auth.credentials.sub
                    }, (err, res) => {
                        if (err) {
                            logger.error('Error occurred while adding to wishList : ' + err);
                            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                        }
                        else {
                            childProducts.pushToWishList({
                                userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId,
                                //unitId: request.payload.unitId,
                                // parentProductId: request.payload.parentProductId,
                                listId: item.id, createdBy: request.auth.credentials.sub
                            }, (err, data) => {
                                callback();
                            });
                        }
                    });
                else
                    callback();
        });
    }, function (err) {
        // return reply({ message: error['wishList']['201'][request.headers.language] }).code(201);
        return reply({ message: request.i18n.__('wishList')['201'] }).code(201);
    });

}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    parentProductId: Joi.string().description('string').allow(""),
    childProductId: Joi.string().required().description('string'),
    zoneId: Joi.string().required().description('string'),
    storeId: Joi.string().required().description('string'),
    // unitId: Joi.string().required().description('string'),
    list: Joi.array().items().required().description('array [{"id": "5a5079f6917ede31ff32e513", "checked":true }]')
}
/**
* A module that exports add cart handler, add cart validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }