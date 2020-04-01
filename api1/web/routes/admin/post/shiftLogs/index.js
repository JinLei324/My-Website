let postAPI = require('./post');
 
/** @global */
const headerValidator = require('../../../../middleware/validator');

const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')

const error = require('../../../../../locales'); 
module.exports = [
     
    {
        method: 'POST',
        path: '/admin/shiftlogs',
        config: {
            tags: ['api', 'admin'],
            description: 'API to get shifts of the driver',
            notes: 'API to get shifts of the driver',
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
                    200: { message: Joi.any().default(i18n.__('genericErrMsg')['200']), data : Joi.any()},
                    404: { message: Joi.any().default(i18n.__('getData')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof postAPI */
        handler: postAPI.handler

    }

];