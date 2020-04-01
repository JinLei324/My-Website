/** @global */
const Joi = require('joi')
/** @namespace */

const currentOrder = require('./get');
/** @global */
const headerValidator = require('../../../../../middleware/validator');
/** @namespace */
const error = require('../../../../../../locales');
/**
* A module that exports manager API  routes to hapi server!
* @exports 
*/
const entity = '/SF/dispatcher';
module.exports = [
    {
        method: 'GET', // Methods Type
        path: '/SF/dispatcher/currentOrders/{driverId}/{index}', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', entity],
            description: 'This API is used to get drivers current jobs.',
            notes: "This API is used to get drivers current jobs.",
            //auth: 'managerJWT',
            auth: false,
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
                params: currentOrder.validator,
            },
            response: {
                status: {
                    200: {
                        // message: error['ordersList']['200']
                        message: error['driverList']['200'], data: Joi.any().example({
                            "data": "array"
                        })
                    },
                    500: { message: error['genericErrMsg']['500'] }
                }
            }
        },
        handler: currentOrder.handler
    },
]