/** @global */
const Joi = require('joi')
/** @namespace */
const addOnPatch = require('./patch');

/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const error = require('../../../../../locales');


/**
* A module that exports  API  routes to hapi server!
* @exports 
*/
module.exports = [

    {
        method: 'PATCH',
        path: '/addOn',
        config: {
            tags: ['api', 'admin'],
            description: 'Api for updating addOnPatch ',
            notes: 'Api for update addOnPatch.',
            auth: false,
            validate: {
                /** @memberof validator */
                payload: addOnPatch.validator,
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
        handler: addOnPatch.handler,
    }
]