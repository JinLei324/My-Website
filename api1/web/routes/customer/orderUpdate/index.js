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
const patch = require('../../../commonModels/orders/orderpatch.js');
/** @global */
const Joi = require('joi');
module.exports = [
    {
        method: 'PATCH',
        path: '/update/order',
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
            // response: {
            //     status: {
            //         200: { message: Joi.any().default(i18n.__('bookings')['200']), data: Joi.any() },
            //         404: { message: Joi.any().default(i18n.__('bookings')['404']) },
            //         405: { message: Joi.any().default(i18n.__('bookings')['405']) },
            //         500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            //     }
            // },
        },
        handler: patch.handler
    }
];