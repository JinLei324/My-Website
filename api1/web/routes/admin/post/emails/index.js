let postAPI = require('./post');
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')
 
/** @global */
const headerValidator = require('../../../../middleware/validator');



 
module.exports = [
     
    {
        method: 'POST',
        path: '/admin/email',
        config: {
            tags: ['api', 'admin'],
            description: 'send emails',
            notes: 'send emails from admin.',
            auth: false,
            validate: {
                /** @memberof emails */
                payload: postAPI.validator,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('emails')['200']) },
                    400: { message: Joi.any().default(i18n.__('emails')['400']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof postAPI */
        handler: postAPI.handler

    }

];