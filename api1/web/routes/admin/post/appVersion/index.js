let postAPI = require('./post');
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')
/** @global */
const headerValidator = require('../../../../middleware/validator');



 
module.exports = [
     
    {
        method: 'POST',
        path: '/admin/appVersion',
        config: {
            tags: ['api', 'admin'],
            description: 'Method to add a new app & its versions',
            notes: 'Method to add a new app & its versions',
            auth: false,
            validate: {
                /** @memberof postAPI */
                payload: postAPI.validator,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('appVersions')['200']) },
                    400: { message: Joi.any().default(i18n.__('appVersionAlreadyExist')['400']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof postAPI */
        handler: postAPI.handler

    }

];