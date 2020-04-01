/** @global */
const Joi = require('joi')
/** @namespace */

const product = require('./delete');
const productDelete = require('./deleteItem');
/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../locales/locales');
/**
* A module that exports  API  routes to hapi server!
* @exports 
*/
module.exports = [
    /**
    * api to add product
    */
    {
        method: 'DELETE',
        path: '/product/{productId}',
        config: {
            tags: ['api', 'Product'],
            description: 'Api for deleting product.',
            notes: 'Api for deleting product ',
            auth: false,
            validate: {
                /** @memberof validator */
                params: product.validator,
                /** @memberof language */
                //  headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('products')['200']), data: Joi.any().example({
                        })
                    },
                    400: { message: Joi.any().default(i18n.__('products')['400']) },
                    404: { message: Joi.any().default(i18n.__('products')['404']) },
                    500: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['500']), data: Joi.any().example({

                        })
                    }
                }
            }
        },
        /** @memberof manager */
        handler: product.handler,
    },
    {
        method: 'DELETE',
        path: '/productDelete/{productId}/{storeId}',
        config: {
            tags: ['api', 'Product'],
            description: 'Api for deleting product permanent.',
            notes: 'Api for deleting product permanent',
            auth: false,
            validate: {
                /** @memberof validator */
                params: productDelete.validator,
                /** @memberof language */
                //  headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            // },
            // response: {
            //     status: {
            //         200: {
            //             message: error['products']['200'], data: Joi.any().example({
            //             })
            //         },
            //         400: { message: error['products']['400'] },
            //         404: { message: error['products']['404'] },
            //         500: {
            //             message: Joi.any().default(i18n.__('genericErrMsg')['500']), data: Joi.any().example({

            //             })
            //         }
            //     }
            }
        },
        /** @memberof manager */
        handler: productDelete.handler,
    }
]