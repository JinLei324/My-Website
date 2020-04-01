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
const patchStatus = require('./patch');

module.exports =   [ 
{
    method: 'PATCH',
    path: '/driver/status',
    config: {
        tags: ['api', 'driver'],
        description: 'driver status offline | online',
        notes: "API to update driver status online or offline",
        auth: 'driverJWT',
        validate: {
            /** @memberof patchStatus */
            payload: patchStatus.validator,
            /** @memberof headerValidator */
            headers: headerValidator.headerAuthValidator,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                498 :{ message: Joi.any().default(i18n.__('genericErrMsg')['498'])},
                200: { message: Joi.any().default(i18n.__('slaveUpdateProfile')['200']) },
                500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            }
        }
    },
    handler: patchStatus.handler
}];