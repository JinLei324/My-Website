/** @namespace */
/** @global */
const Joi = require('joi');
const get = require('./get');

/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const error = require('../../../../../locales');
/**
* A module that exports manager API  routes to hapi server!
* @exports 
*/

module.exports = [
    {
        method: 'GET', // Methods Type
        path: '/dispatcher/drivers/{storeId}/{index}', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'dispatcher'],
            description: 'This API is used to get store  drivers.',
            notes: "This API is used to get store  drivers.",
            auth: 'managerJWT',
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
                params: get.validator,
            // },
            // response: {
            //     status: {
            //         200: {
            //             // message: error['ordersList']['200']
            //             message: error['driverList']['200'], data: Joi.any().example({
            //                 "data": "array"
            //             })
            //         },
            //         500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            //     }
            }
        },
        handler: get.handler
    }
]