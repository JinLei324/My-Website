'use strict'
const cart = require('../../../../../models/cart');
const error = require('../../../../../statusMessages/responseMessage'); // response messages based on language 
const config = process.env;
const Joi = require('joi');
const webSocket = require('../../../../../library/websocket/websocket');
const logger = require('winston');
/** 
 * @function
 * @name handler 
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {
    cart.patchDetails({
        createdBy: request.auth.credentials.sub,
        cartId: request.payload.cartId,
        unitId: request.payload.unitId,
        userId: request.auth.credentials._id.toString(),
        quantity: request.payload.quantity,
        childProductId: request.payload.childProductId,
        add
    }, (err, data) => {
        if (err) {
            logger.error('Error occurred while updating to cart : ' + err);
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        } else {
            sendNotification({
                userId: request.auth.credentials._id.toString(),
                childProductId: request.payload.childProductId,
                unitId: request.payload.unitId,
                quantity: request.payload.quantity,
                message: "modified quantity"
            });
            // return reply({ message: error['cart']['203'][request.headers.language] }).code(203);
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



const handlerWithAddOns = (request, reply) => {

    /*
    @ Updating the quantity of the product with addOns
    @ Conditions (Current flow - 24-08-2018)
    --------------------------

    ->  While adding a new product to the cart cartNewWithAddOns is used.

    ->  Increasing the quantity of the product 
        -------------------------------------------
        -> If same item with same addOns are selected then increase the quantity    
        -> If same item with differenct addOns selected then make a new entry
    */

    /*
    @Function
    */

    // @ Checking the cart if exists with the same product with the same addOns with same quantity

    // cart.isExistsWithItem({
    //     userId: request.auth.credentials._id.toString(),
    //     childProductId: request.payload.childProductId,
    //     unitId: request.payload.unitId
    // }, (err, isItem) => {




    // })



    cart.patchDetailsNew({
        createdBy: request.auth.credentials.sub,
        cartId: request.payload.cartId,
        unitId: request.payload.unitId,
        userId: request.auth.credentials._id.toString(),
        quantity: request.payload.quantity,
        childProductId: request.payload.childProductId,
        add
    }, (err, data) => {
        if (err) {
            logger.error('Error occurred while updating to cart : ' + err);
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        } else {
            sendNotification({
                userId: request.auth.credentials._id.toString(),
                childProductId: request.payload.childProductId,
                unitId: request.payload.unitId,
                quantity: request.payload.quantity,
                message: "modified quantity"
            });
            // return reply({ message: error['cart']['203'][request.headers.language] }).code(203);
            return reply({
                message: request.i18n.__('cart')['203']
            }).code(203);
        }

    });
};

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    cartId: Joi.string().required().description('string'),
    // parentProductId: Joi.string().description('string'),
    childProductId: Joi.string().required().description('string'),
    unitId: Joi.string().required().description('string'),
    // storeId: Joi.string().required().description('string'),
    // storeName: Joi.string().description('string'),
    // storeLogo: Joi.string().description('string'),
    // sku: Joi.string().description('string'),
    // itemName: Joi.string().required().description('string'),
    // upc: Joi.string().description('string'),
    // itemImageURL: Joi.string().description('string'),
    quantity: Joi.number().required().description('string'),
    // unitPrice: Joi.number().required().description('string'),
    // totalPrice: Joi.number().required().description('string')
}
/**
 * A module that exports customer send otp handler, send otp validator!
 * @exports validator
 * @exports handler 
 */
module.exports = {
    handler,
    handlerWithAddOns,
    validator
}