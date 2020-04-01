/** @global */
const Joi = require('joi')
/** @namespace */
const order = require('./get');


/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../locales/locales');

/**
* A module that exports manager API  routes to hapi server!
* @exports 
*/

module.exports = [

    /**
  * api to get orders
  */
    {
        method: 'GET', // Methods Type
        path: '/order/{orderId}', // Url

        config: {// "tags" enable swagger to document API 
            tags: ['api', 'staff'],
            description: 'This API is used to get order details.',
            notes: "This API is used to get order details.",
            auth: 'managerJWT',
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
                params: order.validator,
            },
            response: {
                status: {
                    200: {
                        // message: error['ordersList']['200']
                        message: Joi.any().default(i18n.__('ordersList')['200']), data: Joi.any().example({
                            "data": "array"
                        })
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        handler: order.handler
    }
]