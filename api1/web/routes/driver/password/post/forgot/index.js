'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:get 
 */
/** @global */
const headerValidator = require('../../../../../middleware/validator');
 
/** @namespace */
const postForgot = require('./post'); 
/** @namespace */
const i18n = require('../../../../../../locales/locales');
/** @global */
const Joi = require('joi');

module.exports =   [  
     
    {
        method: 'POST',
        path: '/driver/forgotPassword',
        config: {
            tags: ['api', 'driver'],
            description: 'Forgot password',
            notes: 'Api handles two process, 1) By email 2) By verification code. By email email goes to respective email and he chose by verification, api finds mobile number registerd with give mobile number and sends veficiatin code, and app side we need to call app/verifyiOtp service to verifyi code',
            auth: false,
            validate: {
                /** @memberof postForgot */
                payload: postForgot.validator,
                /** @memberof headerValidator */
                headers: headerValidator.languageDriver,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('supportForgotPassword')['200']) },
                    202: { message: Joi.any().default(i18n.__('supportForgotPassword')['202']) },
                    400: { message: Joi.any().default(i18n.__('supportForgotPassword')['400']) },
                    404: { message: Joi.any().default(i18n.__('supportForgotPassword')['404']) },
                     406: { message: Joi.any().default(i18n.__('supportForgotPassword')['406']) },
                    403: { message: Joi.any().default(i18n.__('supportForgotPassword')['403']) },
                    429: { message: Joi.any().default(i18n.__('supportForgotPassword')['429']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof postForgot */
        handler: postForgot.handler
    },
      ]