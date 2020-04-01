/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
/** @namespace */
const get = require('./get');
const add = require('./post');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi')
/**
* A module that exports business API  routes to hapi server!
* @memberof SHOPPINGLIST-API-ROUTES 
*/
module.exports = [
    {
        method: 'POST',
        path: '/favorite',
        config: {
            tags: ['api', 'shoppingList'],
            description: 'Add or remove items from favorite list',
            notes: 'Add or remove items from favorite list.',
            auth: 'customerJWT',
            validate: {
                /** @memberof add */
                payload: add.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    201: { message: Joi.any().default(i18n.__('shoppingList')['201']) },
                    202: { message: Joi.any().default(i18n.__('shoppingList')['202']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) },
                    498: { message: Joi.any().default(i18n.__('genericErrMsg')['498']) },
                    440: { message: Joi.any().default(i18n.__('genericErrMsg')['440']) },
                }
            }
        },
        /** @memberof add */
        handler: add.handler
    },

    {
        method: 'GET',
        path: '/favorite/{zoneId}/{storeId}',
        config: {
            tags: ['api', 'shoppingList'],
            description: 'Get shoppingList details API',
            notes: 'Get shoppingList product details API',
            auth: 'guestJWT',
            validate: {
                /** @memberof add */
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



]