'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:POST 
 */
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const patch = require('../../../commonModels/orders/patch.js');
/** @namespace */
const remove = require('../../../commonModels/orders/delete.js');
/** @namespace */
const postNew = require('../../../commonModels/orders/postNew.js');
/** @namespace */
const getById = require('./get/getById');
/** @namespace */
const getLogs = require('./get/logs');
/** @namespace */
const getOrderType = require('./get/orderType');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi');

module.exports = [{
    method: 'PATCH',
    path: '/dispatcher/order',
    config: {
        tags: ['api', 'dispatcher'],
        description: 'Api for update the bookings.',
        notes: "Bookings update based on orderId.",
        auth: 'managerJWT',
        validate: {
            /** @memberof validator */
            payload: patch.validator,
            /** @memberof headerValidator */
            headers: headerValidator.headerAuthValidator,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: { message: Joi.any().default(i18n.__('bookings')['200']), data: Joi.any() },
                404: { message: Joi.any().default(i18n.__('bookings')['404']) },
                500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            }
        },
    },
    handler: patch.handler
},
{
    method: 'PUT',
    path: '/dispatcher/order',
    config: {
        tags: ['api', 'dispatcher'],
        description: 'Api for cancel the bookings.',
        notes: "Bookings cancel based on orderId.",
        auth: 'managerJWT',
        validate: {
            /** @memberof validator */
            payload: remove.validator,
            /** @memberof headerValidator */
            headers: headerValidator.headerAuthValidator,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                201: { message: Joi.any().default(i18n.__('bookings')['201']), data: Joi.any() },
                404: { message: Joi.any().default(i18n.__('bookings')['404']) },
                500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            }
        },
    },
    handler: remove.handler
},
{
    method: 'POST',
    path: '/dispatcher/orderNew',
    config: {
        tags: ['api', 'dispatcher'],
        description: 'Api for placing the bookings.',
        notes: "Bookings placing based.",
        auth: 'managerJWT',
        validate: {
            /** @memberof validator */
            payload: {
                customerId: Joi.string().required().min(24).max(24).required().description('customerId'),
                addressId: Joi.any().description('addressId').error(new Error('address Id missing')).allow("").default(""),
                address1: Joi.string().description('string').error(new Error('address Line1 missing')).allow(""),
                address2: Joi.string().description('string').error(new Error('address Line2 missing')).allow(""),
                paymentType: Joi.number().min(1).max(3).required().description('1-card, 2 cash 3 -wallet 4-'),
                // cart: Joi.array().items().min(1).required().description('array').error(new Error('cart is missing')),
                couponCode: Joi.string().description('coupon code').allow(""),
                discount: Joi.number().required().description('discount').error(new Error('discount missing')),
                // currency: Joi.string().required().description('currency eg: "INR"'),
                //  currencySymbol: Joi.string().required().description('currency Symbol eg: "$"'),
                //  mileageMetric: Joi.string().required().description('mileageMetric 0-km 1-miles').error(new Error('mileageMetric missing')),
                cartId: Joi.string().required().description('cart Id').error(new Error('cart id missing')),
                cityId: Joi.string().description('city Id').error(new Error('city id missing')).allow(""),
                // city: Joi.string().description('city Name').error(new Error('city name missing')).allow(""),
                // deviceId: Joi.string().required().description('device id'),
                // appVersion: Joi.string().required().description('app version'),
                // deviceMake: Joi.string().required().description('Device Make'),
                // deviceModel: Joi.string().required().description('Device model'),
                // deviceType: Joi.number().required().integer().min(1).max(2).description('1- IOS , 2- Android, 3- Web'),
                latitude: Joi.number().required().description("Customer Latitude is required").default(13.0195677),
                longitude: Joi.number().required().description("Customer Longitude is required").default(77.5968131),
                bookingDate: Joi.string().required().description("Order dateTime is required"),
                dueDatetime: Joi.string().required().description("Schedule datetime or Due dateTime is required").default("2017-07-17 02:30:33"),
                serviceType: Joi.number().integer().min(1).max(2).required().description('1 for delivery ,2 for pickup'),
                bookingType: Joi.number().integer().min(1).max(2).required().description('2 -schedule booking  or later booking , 1 for now booking'),
                zoneType: Joi.number().integer().min(1).max(2).description('1 for short zone ride booking, 2 for long zone'),
                // extraNote: Joi.string().description('extra note').allow(""),
                extraNote: Joi.object().keys().description("extraNote"),
                transaction: Joi.object().keys().description('transaction'),
                ipAddress: Joi.string().description('Ip Address'),
                cardId: Joi.string().description('if payment card selected cardId').allow(""),
                storeType: Joi.number().description('  storeType 0 for food, 1 for grocery ,2  for dailyneeds ,3 for online').allow(""),
                storeTypeMsg: Joi.string().description('storeTypeMsg food or grocery etc').allow(""),
                deviceTime: Joi.any().description('device time').error(new Error('deviceTime is missing')),
                pickUpLat: Joi.number().allow("").description("Pick up lat"),
                pickUpLong: Joi.number().allow("").description("Pick up long"),
                pickUpPhoneNumber: Joi.number().allow("").description("Pick Up Phone Number"),
                estimatedPackageValue: Joi.number().allow("").description("Estimated package value"),



            },
            /** @memberof headerValidator */
            headers: headerValidator.headerAuthValidator,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        // response: {
        //     status: {
        //         200: {
        //             message: Joi.any().default(i18n.__('orders')['200'])
        //         },
        //         404: { message: Joi.any().default(i18n.__('slaveSignIn')['404'])) },
        //         401: { message: Joi.any().default(i18n.__('genericErrMsg')['401'])) },
        //         402: { message: Joi.any().default(i18n.__('verifyId')['402']) },
        //         500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
        //     }
        // },
    },
    handler: postNew.handlerNew
}].concat(getById, getLogs, getOrderType);