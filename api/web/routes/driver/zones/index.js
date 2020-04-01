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
const getZones = require('./get');

module.exports =  {
    method: 'GET',
    path: '/driver/zone',
    config: {
        tags: ['api', 'driver'],
        description: 'get operator list',
        notes: 'while signup, driver need to select operator,in case of freelancer',
        auth: false,
        validate: {
            /** @memberof headerValidator */
            headers: headerValidator.languageDriver,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: {
                    message: Joi.any().default(i18n.__('stores')['200']),
                    data: Joi.any()
                },
                500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            }
        }

    },
    handler: getZones.handler
}