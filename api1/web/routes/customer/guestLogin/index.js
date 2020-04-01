/** @global */
const Joi = require('joi')
/** @namespace */
const guest = require('./post'); 
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-VERIFICATIONCODE-API-ROUTES 
*/
module.exports = [
     /**
     * api to guestLogin
     */
    {
        method: 'POST',
        path: '/guest/signIn',
        config: {
            tags: ['api', 'guest'],
            description: 'Api for guest users.',
            notes: "This will enable the customer to get a feel of the application.Please note in order for the customer to process a booking , login/sign up is mandatory.",
            auth: false,
            validate: {
                /** @memberof validator */
                payload: guest.validator,
                /** @memberof language */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('guestRegisterUser')['200']), data: Joi.any() },
                    400: { message: Joi.any().default(i18n.__('guestRegisterUser')['400']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        },
        /** @memberof guest */
        handler: guest.handler,
    },
]