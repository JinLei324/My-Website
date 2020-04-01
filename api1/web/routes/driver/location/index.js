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
/** @global */
const Joi = require('joi');
/** @namespace */
const patchLocation = require('./patch');

module.exports = [{
    method: 'PATCH',
    path: '/driver/location',
    config: {
        tags: ['api', 'driver'],
        description: 'driver update location',
        notes: "API to update driver location",
        auth: 'driverJWT',
        validate: {
            /** @memberof patchLocation */
            payload: patchLocation.validator,
            /** @memberof headerValidator */
            headers: headerValidator.headerAuthValidator,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                498: { message: Joi.any().default(i18n.__('genericErrMsg')['498']) },
                200: { message: Joi.any().default(i18n.__('slaveUpdateProfile')['200']), data: Joi.any() },
                500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            }
        }
    },
    handler: patchLocation.handler
}
];