'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:get 
 */
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const emailPhoneValidate = require('./post');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi');

module.exports =   {
    method: 'POST',
    path: '/driver/emailPhoneValidate',
    config: {
        tags: ['api', 'driver'],
        description: 'Veriy email and phone',
        notes: "This API is to verify email and phone if already registered.",
        auth: false,
        validate: {
            payload: emailPhoneValidate.validator,
            /** @memberof headerValidator */
            headers: headerValidator.languageDriver,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: { message: Joi.any().default(i18n.__('postPhoneValidation')['200']) },
                400: { message: Joi.any().default(i18n.__('postPhoneValidation')['400']) },
                412: { message: Joi.any().default(i18n.__('postPhoneValidation')['412']) },
                413: { message: Joi.any().default(i18n.__('postPhoneValidation')['413']) },
                500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            }
        }
    },
    handler: emailPhoneValidate.handler
};