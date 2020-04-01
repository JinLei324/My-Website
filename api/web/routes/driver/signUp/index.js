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

module.exports =    {
    method: 'POST',
    path: '/driver/signUp',
    config: {
        tags: ['api', 'driver'],
        description: 'API for driver signup',
        notes: "This API allows the User to sign up using his phone number and email ID ,google account or facebook account",
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
                    message: Joi.any().default(i18n.__('postSignUp')['200']),
                    data: Joi.any().example([{ providerId: 'string' }])
                },
                412: { message: Joi.any().default(i18n.__('postSignUp')['412']) },
                413: { message: Joi.any().default(i18n.__('postSignUp')['413']) },
                500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            }
        }
    },
    /** @memberof post */
    handler: post.handler
};