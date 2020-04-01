/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const get = require('./get');
/** @namespace */
const add = require('./post');
/** @namespace */
const remove = require('./delete');
/** @namespace */
const patch = require('./patch');
/** @namespace */
const product = require('./product');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi')
/**
* A module that exports business API  routes to hapi server!
* @memberof WISHLIST-API-ROUTES 
*/
module.exports = [
    {
        method: 'POST',
        path: '/wishList',
        config: {
            tags: ['api', 'wishList'],
            description: 'Add items to wish list',
            notes: 'Add items to wish list.',
            auth: 'guestJWT',
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
                    201: { message: Joi.any().default(i18n.__('wishList')['201']), data: Joi.any() },
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
        method: 'DELETE',
        path: '/wishList/{listId}',
        config: {
            tags: ['api', 'wishList'],
            description: 'Delete cart API',
            notes: 'Modify the wishList details.',
            auth: 'guestJWT',
            validate: {
                /** @memberof remove */
                params: remove.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    202: {
                        message: Joi.any().default(i18n.__('wishList')['202'])
                    },
                    404: { message: Joi.any().default(i18n.__('wishList')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof remove */
        handler: remove.handler
    },
    {
        method: 'GET',
        path: '/wishList/{zoneId}/{listId}/{storeId}',
        config: {
            tags: ['api', 'wishList'],
            description: 'Get shoppingList details API',
            notes: 'Get shoppingList product details API',
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
                        message: Joi.any().default(i18n.__('wishList')['200']), data: Joi.any()
                    },
                    404: { message: Joi.any().default(i18n.__('wishList')['404']) },
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
        method: 'PATCH',
        path: '/wishList',
        config: {
            tags: ['api', 'wishList'],
            description: 'Get shoppingList details API',
            notes: 'Get shoppingList product details API',
            auth: 'guestJWT',
            validate: {
                /** @memberof patch */
                payload: patch.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    203: {
                        message: Joi.any().default(i18n.__('wishList')['203']), data: Joi.any()
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) },
                    498: { message: Joi.any().default(i18n.__('genericErrMsg')['498']) },
                    440: { message: Joi.any().default(i18n.__('genericErrMsg')['440']) }
                }
            }
        },
        /** @memberof patch */
        handler: patch.handler
    }


].concat(product);