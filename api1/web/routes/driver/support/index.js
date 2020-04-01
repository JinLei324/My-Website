'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:get 
 */
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi');
/** @namespace */
const support = require('./get');

module.exports = {
    method: 'GET',
    path: '/driver/support',
    config: {
        tags: ['api', 'driver'],
        description: 'Get support data',
        notes: 'Api to get support data',
        auth: false,
        validate: {
            /** @memberof headerValidator */
            headers: headerValidator.languageDriver,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: { message: Joi.any().default(i18n.__('supportReview')['200']) , data : Joi.any()},
                404: { message: Joi.any().default(i18n.__('supportReview')['404']) },
                500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            }
        }

    },
    handler: support.handler
}