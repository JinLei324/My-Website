/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
/** @namespace */
const get = require('./get/get');
/** @namespace */
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')
/**
* A module that exports business API  routes to hapi server!
* @memberof CART-API-ROUTES 
*/
module.exports = [
    {
        method: 'GET',
        path: '/customerDetailsById/{customerId}',
        config: {
            tags: ['api', 'customer'],
            description: 'Get user details by user Id',
            notes: 'Get user details by user Id',
            auth: false,
            validate: {
                 /** @memberof remove */
                 params: get.customerDetailsByIdValidator,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('customer')['200']), data: Joi.any() },
                    404: { message: Joi.any().default(i18n.__('customer')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof get */
        handler: get.customerDetailsByIdHandler
    }


]