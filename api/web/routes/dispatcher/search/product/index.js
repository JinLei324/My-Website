/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const searchByName = require('../../../../commonModels/search/product/get.js');
/** @namespace */
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')
/**
* A module that exports business API  routes to hapi server!
* @exports DISPATCHER-SEARCH-PRODUCT-API-ROUTES
*/
module.exports = [
    {
        method: 'GET',
        path: '/dispatcher/search/{storeId}/{categoryId}/{subCategoryId}/{needle}/{latitude}/{longitude}',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Search products based on store API',
            notes: 'Search products based on store API.',
            auth: 'managerJWT',
            validate: {
                /** @memberof searchByName */
                params: searchByName.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('stores')['200']), data: Joi.any()
                    },
                    404: { message: Joi.any().default(i18n.__('stores')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof searchByName */
        handler: searchByName.handler
    }
     
]