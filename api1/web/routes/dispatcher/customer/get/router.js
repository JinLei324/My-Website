/** @global */
const Joi = require('joi')
/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../locales/locales');
// const errorMsg = require('../../../../../locales');
/** @namespace */
const getCustomer = require('./get');
/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-SIGNUP-API-ROUTES 
*/
module.exports = [
    /**
    * api to signUp
    */
    {
        method: 'GET',
        path: '/dispatcher/customer/{customerId}',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'API for customer signup',
            notes: "This API allows the User to sign up using his phone number and email ID ,google account or facebook account",
            auth: 'managerJWT',
            validate: {
                /** @memberof getCustomer validator */
                params: {
                    customerId: Joi.string().min(24).max(24).required().description('customerId')
                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['200']), data: Joi.any()
                    },
                    404: { message: Joi.any().default(i18n.__('getData')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof getCustomer */
        handler: getCustomer.handler
    }
];