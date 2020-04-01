/** @global */
const Joi = require('joi')
/** @namespace */

const updateStatus = require('./patch');

/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../locales/locales');
/**
* A module that exports manager API  routes to hapi server!
* @exports 
*/

module.exports = [
{
        method: 'PATCH', // Methods Type
        path: '/order', // Url

        config: {   // "tags" enable swagger to document API 
            tags: ['api', 'staff'],
            description: 'This API is used to change the order status.',
            notes: "This API is used to change the order status.",
            auth: 'managerJWT',
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
                payload: updateStatus.validator,
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('ordersList')['200']), data: Joi.any().example({ "data": "object" })
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        handler: updateStatus.handler
    }
]