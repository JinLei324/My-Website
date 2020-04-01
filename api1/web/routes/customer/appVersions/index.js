'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:get 
 */
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const post = require('./post');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi');

module.exports = {
    method: 'POST',
    path: '/customer/version',
    config: {
        tags: ['api', 'customer'],
        description: 'get app configuration',
        notes: 'api returns, unique configuration which is handled by admin',
        auth: false,
        validate: {
            /** @memberof validator */
            payload: post.validator,
            /** @memberof headerValidator */
            headers: headerValidator.language,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: { message: Joi.any().default(i18n.__('appVersions')['200']) },
                404: { message: Joi.any().default(i18n.__('appVersions')['404']) },
                400: { message: Joi.any().default(i18n.__('appVersions')['400']) , data : Joi.any()},
                500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            }
        }
    },
    handler: post.handler
};