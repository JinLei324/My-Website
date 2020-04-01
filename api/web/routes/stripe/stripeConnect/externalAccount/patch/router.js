
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "externalAccount";

const patchExternalAccount = require('./patch');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * API to make card as a default
    */
    {
        method: 'PATCH',
        path: '/' + entity,
        handler: patchExternalAccount.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripeExternalAccountPatch'],
            notes: errorMsg['apiDescription']['stripeExternalAccountPatch'],
            auth: 'driverJWT',
            response: patchExternalAccount.responseCode,
            validate: {
                payload: patchExternalAccount.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]