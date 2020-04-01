'use strict'
const cart = require('../../../../../../models/cart/cart');
const error = require('../../../../../../statusMessages/responseMessage'); // response messages based on language 
const config = process.env;
const Joi = require('joi');
const webSocket = require('../../../../../../library/websocket/websocket');
const logger = require('winston');
/** 
 * @function
 * @name handler 
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {

    cart.patchDetailsLaundry({
        createdBy: request.auth.credentials.sub,
        cartId: request.payload.cartId,
        userId: request.auth.credentials._id.toString(),
        quantity: request.payload.quantity,
        productId: request.payload.productId  
    }, (err, data) => {
        if (err) {
            logger.error('Error occurred while updating to cart : ' + err);
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        } else {
            sendNotification({
                userId: request.auth.credentials._id.toString(),
                productId: request.payload.productId,
                quantity: request.payload.quantity,
                message: "modified quantity"
            });
            return reply({
                message: request.i18n.__('cart')['203']
            }).code(203);
        }

    });
};

function sendNotification(proData) {
    webSocket.publish('cartUpdates/', proData, {
        qos: 2
    }, (mqttErr, mqttRes) => {});
}



/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    cartId: Joi.string().required().description('string'),
    productId: Joi.string().required().description('string'),
    quantity: Joi.number().required().description('string'),
}
/**
 * A module that exports customer send otp handler, send otp validator!
 * @exports validator
 * @exports handler 
 */
module.exports = {
    handler,
    validator
}