/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const getProducts = require('./get');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi')
/**
* A module that exports business API  routes to hapi server!
* @exports BUSINESS-PRODUCT-API-ROUTES 
*/
module.exports = [
    {
        method: 'GET',
        path: '/dispatcher/products/{customerId}/{storeId}/{categoryId}/{subCategoryId}/{subSubCategoryId}/{pageIndex}/{productName}',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Get store and products API',
            notes: 'Get products based on nearest store.',
            auth: 'managerJWT',
            validate: {
                /** @memberof getProducts */
                params: getProducts.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
                // },
                // response: {
                //     status: {
                //         200: {
                //             message: Joi.any().default(i18n.__('stores']['200'], data: Joi.any()
                //         },
                //         404: { message: Joi.any().default(i18n.__('stores']['404'] },
                //         500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                //     }
            }
        },
        /** @memberof getProducts */
        handler: getProducts.handler
    }

];