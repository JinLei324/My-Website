/** @global */
const Joi = require('joi')
/** @namespace */
const get = require('./get');  
/** @global */
const headerValidator = require('../../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../../locales/locales');/**
* A module that exports Customer API  routes to hapi server!
* @exports DRIVER-ORDER-HISTORY-API-ROUTES 
*/
module.exports = [
    {
        method: 'POST',
        path: '/driver/order',
        config: {
            tags: ['api', 'driver'],
            description: 'Api for get the list of all the bookings.',
            notes: "Bookings history, can be filtered based on time.",
            auth: 'driverJWT',
            validate: {
                /** @memberof validator */
                payload: get.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidatorDriver,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('getProfile')['200']), data: Joi.any() },
                    404: { message: Joi.any().default(i18n.__('bookings')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        },
        handler: get.handler
    }
    
    
]