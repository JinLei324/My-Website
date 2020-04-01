/** @global */
const Joi = require('joi')
/** @namespace */

const autodispatch = require('./post');

/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../statusMessages/responseMessage');
/**
* A module that exports manager API  routes to hapi server!
* @exports 
*/

module.exports = [
 {
        method: 'PATCH', // Methods Type
        path: '/dispatchOrder', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'staff'],
            description: 'This API is used to send booking to  driver.',
            notes: "This API is used to send booking to  driver.",
            auth: 'managerJWT',
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
                payload: autodispatch.validator,
            },
        },
        handler: autodispatch.handler
    },
]