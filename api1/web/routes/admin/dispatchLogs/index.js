/** @global */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi')
/** @namespace */

const dispatchLogs = require('./get');
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
/**
* A module that exports manager API  routes to hapi server!
* @exports 
*/

module.exports = [
    {
        method: 'GET', // Methods Type
        path: '/dispatchLogs/{index}', // Url
        config: { // "tags" enable swagger to document API 
            tags: ['api', 'admin'],
            description: 'This API is used to get dispatch logs.',
            notes: "This API is used to get dispatch logs.",
            auth: false,
            validate: {
                /** @memberof headerValidator */
                // headers: headerValidator.headerAuthValidator,
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
                params: dispatchLogs.validator,
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('driverList')['200']), data: Joi.any().example({
                            "data": "array"
                        })
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        handler: dispatchLogs.handler
    },
]