/** @global */
const Joi = require('joi')
/** @global */
const headerValidator = require('../../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../../locales/locales');
/** @namespace */
const forgotPassword = require('./post');
/** @namespace */



/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-FORGOT-PASSWORD-API-ROUTES 
*/
module.exports = [

    /**
     * api to forgotPassword
     */
    {
        method: 'POST',
        path: '/customer/forgotPassword',
        config: {
            tags: ['api', 'customer'],
            description: 'Forgot password',
            notes: 'Api handles two process, 1) By email 2) By verification code. By email goes to respective email and he chose by verification, api finds mobile number registerd with give mobile number and sends veficiatin code, and app side we need to call app/verifyiOtp service to verifyi code',
            auth: false,
            validate: {
                /** @memberof forgotpassword */
                payload: forgotPassword.validator,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('supportForgotPassword')['200']) },
                    400: { message: Joi.any().default(i18n.__('supportForgotPassword')['400']) },
                    405: { message: Joi.any().default(i18n.__('signIn')['405']) },
                    402: { message: Joi.any().default(i18n.__('slaveSignIn')['402']) },
                    415: { message: Joi.any().default(i18n.__('slaveSignIn')['415']) },
                    406: { message: Joi.any().default(i18n.__('supportForgotPassword')['406']) },
                    403: { message: Joi.any().default(i18n.__('supportForgotPassword')['403']) },
                    429: { message: Joi.any().default(i18n.__('supportForgotPassword')['429']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof forgotpassword */
        handler: forgotPassword.handler
    },
]