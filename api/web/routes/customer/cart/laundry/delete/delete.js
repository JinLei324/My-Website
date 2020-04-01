'use strict'
const cart = require('../../../../../../models/cart');
const error = require('../../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const webSocket = require('../../../../../../library/websocket/websocket');
const Joi = require('joi');
const logger = require('winston');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    cart.removeCartDetailLaundry({
        createdBy: request.auth.credentials.sub,
        userId: request.auth.credentials._id.toString(),
        cartId: request.params.cartId,
        productId: request.params.productId
    }, (err, data) => {
        if (err) {
            logger.error('Error occurred while removing from cart : ' + err);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        } else if (data.result.n == 0) {
            logger.info("Record Cart not found");
            return reply({ message: request.i18n.__('cart')['404'] }).code(404);
        } else {
            cart.isExistsWithOtherItem({
                userId: request.auth.credentials._id.toString(),

            }, (err, isItem) => {
                if (err) {
                    logger.error('Error occurred while checking cart : ' + err);
                    return reply({
                        message: request.i18n.__('genericErrMsg')['500']
                    }).code(500);
                }
                if (isItem) {
                    sendNotification({ userId: request.auth.credentials._id.toString(), cartId: request.params.cartId, productId: request.params.productId, message: "deleted product" });
                    return reply({ message: request.i18n.__('cart')['202'] }).code(202);
                } else {
                    cart.deleteCart({
                        createdBy: request.auth.credentials.sub,
                        cartId: request.params.cartId,
                        userId: request.auth.credentials._id.toString(),
                    }, (err, isCleared) => {
                        if (err) {
                            logger.error('Error occurred while checking cart : ' + err);
                            return reply({
                                message: request.i18n.__('genericErrMsg')['500']
                            }).code(500);
                        }
                        sendNotification({ userId: request.auth.credentials._id.toString(), cartId: request.params.cartId, productId: request.params.productId, message: "deleted product" });
                        return reply({ message: request.i18n.__('cart')['202'] }).code(202);
                    });
                }
            });
        }
    });
}
function sendNotification(proData) {
    webSocket.publish('cartUpdates/', proData, { qos: 2 }, (mqttErr, mqttRes) => {
    });
}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    cartId: Joi.string().required().description('cart Id'),
    productId: Joi.string().required().description('string')
}
/**
* A module that exports customer send otp handler, send otp validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }