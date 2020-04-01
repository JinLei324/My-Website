/** @global */
const headerValidator = require('../../../../middleware/validator'); 
/** @namespace */
const patch = require('./patch');
/** @namespace */
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi');
/**
* A module that exports business API  routes to hapi server!
* @exports BUSINESS-FARE-API-ROUTES 
*/
module.exports = [
  
    {
        method: 'PATCH',
        path: '/checkout',
        config: {
            tags: ['api', 'checkout'],
            description: 'Update cart API',
            notes: 'Modify the cart details if any price changes.',
            auth: 'customerJWT',
            validate: {
                /** @memberof patch */
                payload: patch.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    203: { message: Joi.any().default(i18n.__('checkout')['203']) },
                    200: { message: Joi.any().default(i18n.__('checkout')['200'])  },
                    203: { message: Joi.any().default(i18n.__('checkout')['203'])  },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof patch */
        handler: patch.handler
    },

]