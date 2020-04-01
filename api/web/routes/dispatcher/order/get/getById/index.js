/** @global */
const Joi = require('joi')
/** @namespace */
const getById = require('./get');
/** @global */
const headerValidator = require('../../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../../locales/locales');/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-ORDER-HISTORY-API-ROUTES 
*/
module.exports = [
    {
        method: 'GET',
        path: '/dispatcher/order/detail/{orderId}',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Api for get the details of the bookings.',
            notes: "Api for get the details of the bookings.",
            auth: 'managerJWT',
            validate: {
                /** @memberof validator */
                params: getById.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('getProfile')['200']), data: Joi.any() },
                    404: { message: Joi.any().default(i18n.__('getProfile')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        },
        handler: getById.handler
    }
];