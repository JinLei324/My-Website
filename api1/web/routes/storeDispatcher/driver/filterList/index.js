/** @namespace */
/** @global */
const Joi = require('joi');
const get = require('./get');

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
        method: 'GET', // Methods Type
        path: '/dispatcher/drivers/{storeId}/{index}/{status}', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'dispatcher'],
            description: 'This API is used to get store  drivers based on status of booking.',
            notes: "This API is used to get store  drivers based on status of booking.",
            auth: 'managerJWT',
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
                params: get.validator,
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
        handler: get.handler
    }
]