/** @global */
const Joi = require('joi') 
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales'); 
/** @namespace */
const signIn = require('./post');
/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-SIGNIN-API-ROUTES 
*/
module.exports = [
     /**
     * api to signIn
     */
    {
        method: 'POST',
        path: '/customer/signIn',
        config: {
            tags: ['api', 'customer'],
            description: 'Api for customer signIn.',
            notes: "This API allows user to sign in to the application, It allows you to sign in with facebook and google as well, if the registration is processed with the same ID.",
            auth: false,
            validate: {
                /** @memberof signIn */
                payload: signIn.validator,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('slaveSignIn')['200']), data: Joi.any().example({
                            "token": "string",
                            "sid": "string",
                            "mobile": "string",
                            "email": "string",
                            "name": "string",
                            "referralCode": "string",
                            "pushTopic": "string"
                        })
                    },
                    400: { message: Joi.any().default(i18n.__('slaveSignIn')['400']) },
                    403: { message: Joi.any().default(i18n.__('slaveSignIn')['403']) },
                    401: { message: Joi.any().default(i18n.__('slaveSignIn')['401']) },
                    402: { message: Joi.any().default(i18n.__('slaveSignIn')['402']) },
                    404: { message: Joi.any().default(i18n.__('slaveSignIn')['404']) },
                    405: { message: Joi.any().default(i18n.__('slaveSignIn')['405']) },
                    415: { message: Joi.any().default(i18n.__('slaveSignIn')['415']) },
                    406: { message: Joi.any().default(i18n.__('slaveSignIn')['406']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500'])}
                }
            }
        },
        /** @memberof signIn */
        handler: signIn.handler
    }

]