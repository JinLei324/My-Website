let patch = require('./patch');
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')


/** @global */
const headerValidator = require('../../../../middleware/validator');

const error = require('../../../../../locales');
module.exports = [

    {
        method: 'PATCH',
        path: '/admin/appVersion/mandatory',
        config: {
            tags: ['api', 'admin'],
            description: 'Method to make the current version mandatory or not',
            notes: 'Method to make the current version mandatory or not',
            auth: false,
            validate: {
                /** @memberof patch */
                payload: patch.validator,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('appVersions')['200']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof patch */
        handler: patch.handler

    },
    {
        method: 'PATCH',
        path: '/admin/appVersion',
        config: {
            tags: ['api', 'admin'],
            description: 'Method to make the current version mandatory or not',
            notes: 'Method to make the current version mandatory or not',
            auth: false,
            validate: {
                /** @memberof patch */
                payload: patch.newVersionValidator,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('appVersions')['200']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof patch */
        handler: patch.newVersionHandler

    }

];