/** @global */
const Joi = require('joi')
/** @namespace */
const voucher = require('./get');

/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../locales/locales');
/**
* A module that exports  API  routes to hapi server!
* @exports 
*/
module.exports = [
    /**
    * api to get voucher
    */
    {
        method: 'GET',
        path: '/voucher',
        config: {
            tags: ['api', 'vouchers'],
            description: 'Api for get vouchers.',
            notes: 'Api for get vouchers list.',
            auth: false,
            validate: {
                /** @memberof validator */
                // params: product.validator,
                /** @memberof language */
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['200']), data: Joi.any().example({

                        })
                    }, 
                    404: { message: Joi.any().default(i18n.__('getProfile')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        },
        /** @memberof manager */
        handler: voucher.handler,
    }
]