/** @global */
const Joi = require('joi')
/** @namespace */
const sendOtp = require('./post'); 
/** @global */
const headerValidator = require('../../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../../locales/locales');
/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-VERIFICATIONCODE-API-ROUTES 
*/
module.exports = [
 /**
     * api to sendOtp
     */
    {
        method: 'POST',
        path: '/customer/sendOtp',
        config: {
            tags: ['api', 'customer'],
            description: 'API to send the code',
            notes: "This API is used to send the Verification code through Twilio.",
            auth: false,
            validate: {
                /** @memberof sendOtp */
                payload: sendOtp.validator,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('supportForgotPassword')['200']) },
                    429: { message: Joi.any().default(i18n.__('supportForgotPassword')['429']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof sendOtp */
        handler: sendOtp.handler
    },
     
]