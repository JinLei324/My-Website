/** @global */
const Joi = require('joi')
/** @namespace */
const getLogs = require('./get');
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
        path: '/dispatcher/order/logs/{orderId}',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'This api is used to get the logs of the order',
            notes: "This api is used to get the logs of the order",
            auth: 'managerJWT',
            validate: {
                /** @memberof validator */
                params: getLogs.validator,
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
        handler: getLogs.handler
    }
];