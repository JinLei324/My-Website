/** @global */
const Joi = require('joi') 
/** @namespace */
const patch = require('./patch');  
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-Delivery-Check-API-ROUTES 
*/
module.exports = [   
    {
        method: 'POST',
        path: '/delivery',
        config: {
            tags: ['api', 'customer'],
            description: 'Api to check the delivery type based on stores.',
            notes: "Api to check the delivery type based on stores",
            auth: 'customerJWT',
            validate: {
                /** @memberof validator */
                payload: patch.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    201: { message: Joi.any().default(i18n.__('bookings')['201']), data: Joi.any() },
                    404: { message: Joi.any().default(i18n.__('bookings')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        },
        handler: patch.handler
    } 
];