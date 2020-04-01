/** @global */
const Joi = require('joi')
/** @namespace */
const ordersList = require('./get');


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
        path: '/userHistory/{storeId}/{userId}/{index}', // Url

        config: {// "tags" enable swagger to document API 
            tags: ['api', 'staff'],
            description: 'This API is used to get user past orders based storeid.',
            notes: "This API is used to get user past orders based storeid.",
            auth: 'managerJWT',
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
                params: ordersList.validator,
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
        handler: ordersList.handler
    }
]