/** @global */
const Joi = require('joi')
/** @namespace */
const verifyOtp = require('./post'); 
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
    * api to verifyOtp
    */
    {
        method: 'POST',
        path: '/customer/verifyOtp',

        config: {
            tags: ['api', 'customer'],
            description: 'API to verify the code receives from Twilio.',
            notes: "This API is used to verify the Verification code which the user receives from Twilio.",
            auth: false,
            validate: {
                /** @memberof verifyOtp */
                payload: verifyOtp.validator,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('supportVerifyOTP')['200'])},
                    400: { message: Joi.any().default(i18n.__('supportVerifyOTP')['400'])},
                    401: { message: Joi.any().default(i18n.__('supportVerifyOTP')['401'])},
                    406: { message: Joi.any().default(i18n.__('supportVerifyOTP')['406'])},
                    405: { message: Joi.any().default(i18n.__('supportVerifyOTP')['405'])},
                    429: { message: Joi.any().default(i18n.__('supportVerifyOTP')['429'])},
                    410: { message: Joi.any().default(i18n.__('supportVerifyOTP')['410'])},
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof verifyOtp */
        handler: verifyOtp.handler
    },
]