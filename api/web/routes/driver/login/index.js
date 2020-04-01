'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:get 
 */
/** @global */
const headerValidator = require('../../../middleware/validator');
const post = require('./post');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi');

module.exports =   {
    method: 'POST',
    path: '/driver/signIn',
    config: {
        tags: ['api', 'driver'],
        description: 'Api for driver signIn.',
        notes: "This API allows user to sign in to the application, It allows you to sign in with facebook and google as well, if the registration is processed with the same ID.",
        auth: false,
        validate: {
            /** @memberof post */
            payload: post.validator,
            /** @memberof headerValidator */
            headers: headerValidator.languageDriver,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: {
                    message: Joi.any().default(i18n.__('postSignIn')['200']),
                    data: Joi.any()
                },
                400: { message: Joi.any().default(i18n.__('postSignIn')['400']) },
                401: { message: Joi.any().default(i18n.__('postSignIn')['401']) },
                405: { message: Joi.any().default(i18n.__('postSignIn')['405']) },
                403: { message: Joi.any().default(i18n.__('postSignIn')['403']) },
                500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            }
        }
    },
    /** @memberof post */
    handler: post.handler
};