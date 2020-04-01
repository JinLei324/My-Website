/** @global */
const Joi = require('joi')
/** @namespace */
const store = require('./patch');

/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../locales/locales');


/**
* A module that exports  API  routes to hapi server!
* @exports 
*/
module.exports = [

    {
        method: 'PATCH',
        path: '/storeToUpdateStatus',
        config: {
            tags: ['api', 'store'],
            description: 'Api for updating store ',
            notes: 'api for change status for store ',
            auth: false,
            validate: {
                /** @memberof validator */
                payload: store.validator,
                /** @memberof language */
                //  headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('store')['200']), data: Joi.any().example({})
                    },
                    400: { message: Joi.any().default(i18n.__('store')['400']) },
                    404: { message: Joi.any().default(i18n.__('store')['404']) },
                    500: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['500']), data: Joi.any().example({
                        })
                    }
                }
            }
        },
        /** @memberof manager */
        handler: store.handler,
    }
]