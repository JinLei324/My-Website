let get = require('./get');
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')

/** @global */
const headerValidator = require('../../../../middleware/validator');

const error = require('../../../../../locales');
module.exports = [

    {
        method: 'GET',
        path: '/logs/appVersion/{type}',
        config: {
            tags: ['api', 'admin'],
            description: 'get all app versions logs',
            notes: 'get all app versions logs.',
            auth: false,
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof get */
                params: get.validator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('getData')['200']), data: Joi.any() },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) },
                    404: { message: Joi.any().default(i18n.__('getData')['404']) }
                }
            }
        },
        /** @memberof get */
        handler: get.handler

    }

];