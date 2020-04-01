/** @global */
const Joi = require('joi')
/** @namespace */
const patch = require('./patch');

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
        method: 'patch',
        path: '/manufacturer',
        config: {
            tags: ['api', 'admin'],
            description: 'Api for deleting the brand',
            notes: 'Api for deleting the brand.',
            auth: false,
            validate: {
                /** @memberof validator */
                payload: patch.validator,
                /** @memberof language */
                //  headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            // response: {
            //     status: {
            //         200: {
            //             message: error['store']['200'], data: Joi.any().example({
            //             })
            //         },
            //         400: { message: error['store']['400'] },
            //         404: { message: error['store']['404'] },
            //         500: {
            //             message: Joi.any().default(i18n.__('genericErrMsg')['500']), data: Joi.any().example({
            //             })
            //         }
            //     }
            // }
        },
        /** @memberof manager */
        handler: patch.handler,
    }
]