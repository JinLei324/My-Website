'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:get 
 */
/** @global */
const headerValidator = require('../../../../middleware/validator'); 
/** @namespace */
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi'); 
/** @namespace */
const patchLocationLogs = require('./patch'); 

module.exports =   [ 
{
    method: 'PATCH',
    path: '/driver/locationLogs',
    config: {
        tags: ['api', 'driver'],
        description: 'driver update location Logs',
        notes: "API to update driver location Logs",
        auth: 'driverJWT',
        validate: {
            /** @memberof patchLocationLogs */
            payload: patchLocationLogs.validator,
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
    handler: patchLocationLogs.handler
}];