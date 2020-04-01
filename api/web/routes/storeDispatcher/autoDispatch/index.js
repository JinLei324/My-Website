/** @global */
const Joi = require('joi')
/** @namespace */

const autodispatch = require('./post');

/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const error = require('../../../../statusMessages/responseMessage');
/**
* A module that exports manager API  routes to hapi server!
* @exports 
*/

module.exports = [
    {
        method: 'POST', // Methods Type
        path: '/autodispatch', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'autodispatcher'],
            description: 'This API is used to send booking to  driver.',
            notes: "This API is used to send booking to  driver.",
            auth: false,
            validate: {
                /** @memberof headerValidator */
                // headers: headerValidator.headerValidator,
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
                payload: autodispatch.validator,
            },
        },
        handler: autodispatch.handler
    },
    {
        method: 'POST', // Methods Type
        path: '/server/autodispatch', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'autodispatcher'],
            description: 'This API is used to send booking to  driver.',
            notes: "This API is used to send booking to  driver.",
            auth: false,
            validate: {
                /** @memberof headerValidator */
                // headers: headerValidator.headerAuthValidator,
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
                payload: autodispatch.validator,
            }
        },
        handler: autodispatch.dispatchhandler
    },
    {
        method: 'POST', // Methods Type
        path: '/cancelautodispatch', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'dispatcher'],
            description: 'This API is used to send booking to  driver.',
            notes: "This API is used to send booking to  driver.",
            auth: 'managerJWT',
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
                payload: autodispatch.cancelAutoDispatchValidator,
            },
        },
        handler: autodispatch.cancelAutoDispatchHandler
    }
]