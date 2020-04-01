/** @global */
const Joi = require('joi')
/** @namespace */
const dispatch = require('./post');


/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/**
* A module that exports manager API  routes to hapi server!
* @exports 
*/


module.exports = [
    {
        method: 'POST', // Methods Type
        path: '/dispatcher/dispatchOrder', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'dispatcher'],
            description: 'This API is used to send booking to specific driver.',
            notes: "This API is used to send booking to specific driver.",
            auth: 'managerJWT',
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
                payload: dispatch.validator,
            },
            response: {
                status: {
                    200: {
                        // message: error['ordersList']['200']
                        message: Joi.any().default(i18n.__('ordersList')['200']), data: Joi.any().example({
                            "data": "object"
                        })
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        handler: dispatch.handler
    }
]