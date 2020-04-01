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

module.exports = {
    method: 'GET',
    path: '/productsSearchByStoreId/{storeId}/{index}/{limit}/{search}',
    config: {
        tags: ['api', 'driver'],
        description: 'get product to replace',
        notes: 'api returns, product related search',
        auth: 'driverJWT',
        validate: {
            params: get.validator,
            /** @memberof headerValidator */
            headers: headerValidator.headerAuthValidatorDriver,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        // response: {
        //     status: {
        //         200: { message: Joi.any().default(i18n.__('getData')['200']), data: Joi.any() },
        //         500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
        //     }
        // }
    },
    handler: get.handler
};