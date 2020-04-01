'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:get 
 */
/** @global */
const headerValidator = require('../../../middleware/validator');
const get = require('./get');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi');

module.exports =   {
    method: 'GET',
    path: '/driver/config',
    config: {
        tags: ['api', 'driver'],
        description: 'get app configuration',
        notes: 'api returns, unique configuration which is handled by admin',
        auth: 'driverJWT',
        validate: {
            /** @memberof headerValidator */
            headers: headerValidator.headerAuthValidatorDriver,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: { message: Joi.any().default(i18n.__('getData')['200']), data: Joi.any() },
                500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            }
        }
    },
    handler: get.handler
};