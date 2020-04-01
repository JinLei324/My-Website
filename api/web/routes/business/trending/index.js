/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const get = require('./get');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi')
/**
* A module that exports business API  routes to hapi server!
* @exports BUSINESS-HOME-API-ROUTES 
*/
module.exports = [
    {
        method: 'GET',
        path: '/business/home/{zoneId}/{storeId}/{index}/{type}/{offerId}',
        config: {
            tags: ['api', 'business'],
            description: 'Get Pagination wise trending or favorite products',
            notes: 'Get Pagination wise trending or favorite products',
            auth: 'guestJWT',
            validate: {
                /** @memberof get */
                params: get.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('shoppingList')['200']), data: Joi.any()
                    },
                    404: { message: Joi.any().default(i18n.__('shoppingList')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) },
                    498: { message: Joi.any().default(i18n.__('genericErrMsg')['498']) },
                    440: { message: Joi.any().default(i18n.__('genericErrMsg')['440']) }
                }
            }
        },
        /** @memberof get */
        handler: get.handler
    },
    {
        method: 'GET',
        path: '/business/subProducts/{zoneId}/{storeId}/{index}/{type}',
        config: {
            tags: ['api', 'business'],
            description: 'Get Pagination wise trending or favorite products',
            notes: 'Get Pagination wise trending or favorite products',
            auth: 'guestJWT',
            validate: {
                /** @memberof get */
                params: get.arrayWiseProducts,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('shoppingList')['200']), data: Joi.any()
                    },
                    404: { message: Joi.any().default(i18n.__('shoppingList')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) },
                    498: { message: Joi.any().default(i18n.__('genericErrMsg')['498']) },
                    440: { message: Joi.any().default(i18n.__('genericErrMsg')['440']) }
                }
            }
        },
        /** @memberof get */
        handler: get.arrayWiseProdHandler
    },
];