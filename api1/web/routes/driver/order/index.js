'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:get 
 */
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @namespace */
const remove = require('../../../commonModels/orders/delete.js');
/** @namespace */
const patch = require('../../../commonModels/orders/patch.js');
/** @global */
const Joi = require('joi');
/** @namespace */
const getAssignedTrips = require('./get');
/** @namespace */
const orderHistory = require('./get/history');
module.exports = [
    {
        method: 'GET',
        path: '/driver/assignedTrips',
        config: {
            tags: ['api', 'driver'],
            description: 'get trips assigned to driver',
            notes: 'get trips assigned to driver',
            auth: 'driverJWT',
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidatorDriver,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('getProfile')['200']), data: Joi.any() },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        handler: getAssignedTrips.handler
    },
    {
        method: 'PATCH',
        path: '/driver/order',
        config: {
            tags: ['api', 'driver'],
            description: 'Api for update the list of all the bookings.',
            notes: "Bookings update the list of all the bookings.",
            auth: 'driverJWT',
            validate: {
                /** @memberof validator */
                payload: patch.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidatorDriver,
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
        path: '/driver/order',
        config: {
            tags: ['api', 'driver'],
            description: 'Api for cancel the bookings.',
            notes: "Bookings cancel based on orderId.",
            auth: 'driverJWT',
            validate: {
                /** @memberof validator */
                payload: remove.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidatorDriver,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                // status: {
                //     201: { message: Joi.any().default(i18n.__('bookings')['201']), data: Joi.any() },
                //     404: { message: Joi.any().default(i18n.__('bookings')['404']) },
                //     500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                // }
            },
        },
        handler: remove.handler
    }
].concat(orderHistory);