'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:get 
 */
/** @global */
const headerValidator = require('../../../middleware/validator');

/** @namespace */
const patch = require('./patch');

/** @namespace */
const post = require('./post'); 
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi');

module.exports = [
 
    /**
* api to update the password
*/
    {
        method: 'PATCH',
        path: '/driver/password',
        config: {
            tags: ['api', 'driver'],
            description: 'API to update the password.',
            notes: "This API to update the password.",
            auth: false,
            validate: {
                /** @memberof patch */
                payload: patch.validator,
                /** @memberof headerValidator */
                headers: headerValidator.languageDriver,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('driverUpdatePassword')['200']) },
                    401: { message: Joi.any().default(i18n.__('driverUpdatePassword')['401']) },
                    402: { message: Joi.any().default(i18n.__('driverUpdatePassword')['402']) },
                    406: { message: Joi.any().default(i18n.__('supportVerifyOTP')['406']) },
                    440: { message: Joi.any().default(i18n.__('driverUpdatePassword')['440']) },
                    405: { message: Joi.any().default(i18n.__('supportVerifyOTP')['405']) },
                    410: { message: Joi.any().default(i18n.__('supportVerifyOTP')['410']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof patch */
        handler: patch.handler
    },
].concat(post)