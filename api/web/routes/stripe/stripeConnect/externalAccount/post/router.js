
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "externalAccount";

const postExternalAccount = require('./post');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * api to add new bank
    */
    {
        method: 'POST',
        path: '/' + entity,
        handler: postExternalAccount.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripeExternalAccountPost'],
            notes: errorMsg['apiDescription']['stripeExternalAccountPost'],
            auth: 'driverJWT',
            response: postExternalAccount.responseCode,
            validate: {
                payload: postExternalAccount.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]