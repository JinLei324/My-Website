/** @global */
const Joi = require('joi')
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @namespace */
const emailPhoneValidate = require('./post');
/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-EMAIL-PHONE-VALIDATION-API-ROUTES 
*/
module.exports = [

    /**
     * api to email-phone Validate
     */
    {
        method: 'POST',
        path: '/customer/emailPhoneValidate',
        config: {
            tags: ['api', 'customer'],
            description: 'Verifyi email and phone number',
            notes: "This API is used to verify email and phone if already registered. <br>Response mesasge : <br> {message: Success.} -> Available to use <br> { message: This phone number is already registered with us, please try a different number.} -> Not availabe",
            auth: false,
            validate: {
                /** @memberof emailPhoneValidate */
                payload: emailPhoneValidate.validator,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('postPhoneValidation')['200']), data: Joi.any() },
                    400: { message: Joi.any().default(i18n.__('postPhoneValidation')['400']) },
                    412: { message: Joi.any().default(i18n.__('postPhoneValidation')['412']), data: Joi.any() },
                    413: { message: Joi.any().default(i18n.__('postPhoneValidation')['413']), data: Joi.any() },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof emailPhoneValidate */
        handler: emailPhoneValidate.handler
    },
]