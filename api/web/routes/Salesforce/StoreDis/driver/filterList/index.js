/** @namespace */
/** @global */
const Joi = require('joi');
const get = require('./get');

/** @global */
const headerValidator = require('../../../../../middleware/validator');
/** @namespace */
const error = require('../../../../../../statusMessages/responseMessage');
/**
* A module that exports manager API  routes to hapi server!
* @exports 
*/

module.exports = [
    {
        method: 'GET', // Methods Type
        path: '/SF/dispatcher/drivers/{storeId}/{index}/{status}', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', '/SF/dispatcher'],
            description: 'This API is used to get store  drivers based on status of booking.',
            notes: "This API is used to get store  drivers based on status of booking.",
            //auth: 'managerJWT',
            auth: false,
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
                        message: error['driverList']['200'], data: Joi.any().example({
                            "data": "array"
                        })
                    },
                    500: { message: error['genericErrMsg']['500'] }
                }
            }
        },
        handler: get.handler
    }
]