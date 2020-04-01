
const Joi = require('joi')
const get = require('./get');
const headerValidator = require('../../../middleware/validator');
const i18n = require('../../../../locales/locales');

module.exports = [
    {
        method: 'GET',
        path: '/customer/lastDue',
        config: {
            tags: ['api', 'order'],
            description: 'Api for get the last due.',
            notes: "Api for get the last due.",
            auth: 'customerJWT',
            validate: {
                headers: headerValidator.headerAuthValidator,
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('getProfile')['200']), data: Joi.any() },
                    404: { message: Joi.any().default(i18n.__('getProfile')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        },
        handler: get.handler
    }
]