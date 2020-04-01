let postAPI = require('./post');
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')
 
/** @global */
const headerValidator = require('../../../../middleware/validator');

const error = require('../../../../../locales'); 
module.exports = [
     
    {
        method: 'POST',
        path: '/admin/operations',
        config: {
            tags: ['api', 'admin'],
            description: 'make offline logout from admin.',
            notes: 'make offline logout from admin.',
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
                    200: { message: Joi.any().default(i18n.__('genericErrMsg')['200'])},
                    400: { message: Joi.any().default(i18n.__('emails')['400']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof postAPI */
        handler: postAPI.handler

    }

];