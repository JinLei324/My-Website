/** @global */
const Joi = require('joi')
/** @namespace */
const workingHourDelete = require('./delete');

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
    * api to add product
    */
    {
        method: 'Delete',
        path: '/store/workingHour/{workingHourId}',
        config: {
            tags: ['api', 'workingHour'],
            description: 'Api for deleting workingHour.',
            notes: 'Api for deleting workingHour',
            auth: false,
            validate: {
                /** @memberof validator */
                params: workingHourDelete.validator,
                /** @memberof language */
                //  headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('getData')['200']), data: Joi.any().example({
                        })
                    },
                    404: { message: Joi.any().default(i18n.__('getData')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof manager */
        handler: workingHourDelete.handler,
    }
]