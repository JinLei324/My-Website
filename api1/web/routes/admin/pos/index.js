/** @global */
const Joi = require('joi')
/** @namespace */

const pos = require('./get');
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
        method: 'GET', // Methods Type
        path: '/posPage/{locationId}/{string}/{address}/{email_address}/{phone}/{locationName}/{paymentsEnabled}/{posId}/{qcWalletId}', // Url
        config: { // "tags" enable swagger to document API 
            tags: ['api', 'pos'],
            description: 'This API is used to get pos page.',
            notes: "This API is used to get pos page.",
            auth: false,
            validate: {
                /** @memberof headerValidator */
                // headers: headerValidator.headerAuthValidator,
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError,
                params: pos.validator,
            },
        },
        handler: pos.handler
    },
]