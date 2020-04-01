/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
/** @namespace */
const getHomeCategories = require('./get');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi')
/** @namespace */
const get = require('../../../commonModels/home/get');
/**
* A module that exports business API  routes to hapi server!
* @exports BUSINESS-CATEGORIES-API-ROUTES 
*/
module.exports = [
    {
        method: 'GET',
        path: '/dispatcher/categories/{storeId}',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Get categories and sub categories API',
            notes: 'Get preferred store with categories, sub categories and all stores belonging to that zone.',
            auth: 'managerJWT',
            validate: {
                /** @memberof getHomeCategories */
                params: getHomeCategories.validator,
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
        /** @memberof getHomeCategories */
        handler: getHomeCategories.handler
    },
    {
        method: 'GET',
        path: '/dispatcher/subSubCategories/{storeId}/{categoryId}/{subCategoryId}',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Get sub sub categories API',
            notes: 'Get preferred store with categories, sub categories and all stores belonging to that zone.',
            auth: 'managerJWT',
            validate: {
                /** @memberof getHomeCategories */
                params: getHomeCategories.subSubCatsValidator,
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
        /** @memberof getHomeCategories */
        handler: getHomeCategories.subsubCatsHandler
    }
]