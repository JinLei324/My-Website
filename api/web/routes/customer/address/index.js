/** @global */
const Joi = require('joi')
/** @namespace */
const getByToken = require('./get');
/** @namespace */
const postByToken = require('./post');
/** @namespace */
const patchByToken = require('./patch');
/** @namespace */
const deleteByTokenId = require('./delete');
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
// const i18n = require('../../../../locales/locales');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @namespace */


/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-ADDRESS-API-ROUTES 
*/
module.exports = [

    /**
     * user save address in google formate
     */
    {
        method: 'POST',
        path: '/address',
        config: {
            tags: ['api', 'address'],
            description: 'This API allows you to add the address of the user, it picks up the location from the google maps set by the user.',
            notes: "This API allows you to add the address the user and save the address.",
            auth: 'customerJWT',
            validate: {
                /** @memberof validator */
                payload: postByToken.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('addAddress')['200']), data: Joi.any() },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) },
                    498: { message: Joi.any().default(i18n.__('genericErrMsg')['498']) },
                    440: { message: Joi.any().default(i18n.__('genericErrMsg')['440']) },
                }
            }
        },
        handler: postByToken.handler
    },
    /**
    * user save address in google formate
    */
    {
        method: 'PATCH',
        path: '/address',
        config: {
            tags: ['api', 'address'],
            description: 'This API allows you to update the address of the user.',
            notes: "This API allows you to update the address of the user.",
            auth: 'customerJWT',
            validate: {
                /** @memberof patchByToken */
                payload: patchByToken.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('editAddress')['200']) ,data: Joi.any() },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) },
                    498: { message: Joi.any().default(i18n.__('genericErrMsg')['498']) },
                    440: { message: Joi.any().default(i18n.__('genericErrMsg')['440']) }
                }
            }
        },
        handler: patchByToken.handler
    },
    /**
    * user save address in google formate
    */
    {
        method: 'GET',
        path: '/address/{userId}',
        config: {
            tags: ['api', 'address'],
            description: 'This API allows you to get Addresses of users.',
            notes: "This API allows you to get Addresses of users.",
            auth: 'customerJWT',
            validate: {
                params : getByToken.validator,
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('getAddress')['200']), data: Joi.any() },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) },
                    498: { message: Joi.any().default(i18n.__('genericErrMsg')['498']) },
                    440: { message: Joi.any().default(i18n.__('genericErrMsg')['440']) },
                }
            }
        },
        handler: getByToken.handler
    },
    /**
    * user save address in google formate
    */
    {
        method: 'DELETE',
        path: '/address/{id}',
        config: {
            tags: ['api', 'address'],
            description: 'This API allows you to delete the address of the user.',
            notes: "This API allows you to delete the address of the user.",
            auth: 'customerJWT',
            validate: {
                /** @memberof removeValidator */
                params: deleteByTokenId.validator,
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('removeAddress')['200']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) },
                    498: { message: Joi.any().default(i18n.__('genericErrMsg')['498']) },
                    440: { message: Joi.any().default(i18n.__('genericErrMsg')['440']) }
                }
            }
        },
        handler: deleteByTokenId.handler
    }
]