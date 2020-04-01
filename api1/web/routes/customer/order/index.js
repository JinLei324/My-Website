/** @global */
const Joi = require('joi')
/** @namespace */
const get = require('./get');
/** @namespace */
const patch = require('./patch');
/** @namespace */
const getById = require('./get/getById');
/** @namespace */
const remove = require('../../../commonModels/orders/delete.js');
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-ORDER-HISTORY-API-ROUTES 
*/
module.exports = [
    {
        method: 'GET',
        path: '/customer/order/{pageIndex}/{status}/{storeType}',
        config: {
            tags: ['api', 'order'],
            description: 'Api for get the list of all the bookings.',
            notes: "Bookings history, can be filtered based on time.",
            auth: 'customerJWT',
            validate: {
                /** @memberof validator */
                params: get.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('getProfile')['200']), data: Joi.any() },
                    404: { message: Joi.any().default(i18n.__('getProfile')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        },
        handler: get.handler
    },
    {
        method: 'PUT',
        path: '/customer/order',
        config: {
            tags: ['api', 'order'],
            description: 'Api for cancel the bookings.',
            notes: "Bookings cancel based on orderId.",
            auth: 'customerJWT',
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
        method: 'PATCH',
        path: '/customer/order',
        config: {
            tags: ['api', 'order'],
            description: 'Api to re-order the bookings.',
            notes: "Api to re-order the bookings (creating cart based on order products).",
            auth: 'customerJWT',
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
                    201: { message: Joi.any().default(i18n.__('cart')['201']) },
                    404: { message: Joi.any().default(i18n.__('cart')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        },
        handler: patch.handler
    }
].concat(getById);