/** @global */

/** @namespace */
const product = require('./put');

/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')
/**
* A module that exports  API  routes to hapi server!
* @exports 
*/
module.exports = [
    /**
    * api to add product
    */
    {
        method: 'PATCH',
        path: '/child/product/{productId}/{status}',
        config: {
            tags: ['api', 'childProduct'],
            description: 'Api for ban reject approve child product.',
            notes: 'Api for ban reject approve child product ',
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
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof manager */
        handler: product.handler,
    }
]