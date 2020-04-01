/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
/** @namespace */
const getHomeCategories = require('./get');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @namespace */
const get = require('../../../commonModels/home/get');
/** @global */
const Joi = require('joi')
/**
* A module that exports business API  routes to hapi server!
* @exports BUSINESS-CATEGORIES-API-ROUTES 
*/
module.exports = [
    {
        method: 'GET',
        path: '/productAndCategories/{zoneId}/{storeType}/{stroeCategoryId}/{storeId}/{latitude}/{longitude}',
        config: {
            tags: ['api', 'product'],
            description: 'Get categories and sub categories API',
            notes: 'This api is used only for non restaurant types. Returns preferred store with categories, sub categories and all stores belonging to that zone .',
            // auth: 'guestJWT',
            auth: {
                strategies: ['guestJWT', 'customerJWT']
            },
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
        /** @memberof get */
        handler: get.handler
    }

]