/** @global */
const headerValidator = require('../../../../middleware/validator'); 
/** @namespace */
const add = require('./post');
/** @namespace */
const patch = require('./patch');
/** @namespace */
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')
/**
* A module that exports business API  routes to hapi server!
* @memberof WISHLIST-API-ROUTES 
*/
module.exports = [
    {
        method: 'POST',
        path: '/wishList/product',
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
        method: 'PATCH',
        path: '/wishList/product',
        config: {
            tags: ['api', 'wishList'],
            description: 'Remove items from wish list',
            notes: 'Remove items from wish list.',
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
                    202: { message: Joi.any().default(i18n.__('wishList')['202']), data: Joi.any() },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) },
                    498: { message: Joi.any().default(i18n.__('genericErrMsg')['498']) },
                    440: { message: Joi.any().default(i18n.__('genericErrMsg')['440']) }
                }
            }
        },
        /** @memberof patch */
        handler: patch.handler
    }  

]