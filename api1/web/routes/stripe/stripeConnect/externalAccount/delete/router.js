
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "externalAccount";

const deleteExternalAccount = require('./delete');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * Api to Delete Card from stripe
    */
    {
        method: 'DELETE',
        path: '/' + entity,
        handler: deleteExternalAccount.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripeExternalAccountDelete'],
            notes: errorMsg['apiDescription']['stripeExternalAccountDelete'],
            auth: 'driverJWT',
            response: deleteExternalAccount.responseCode,
            validate: {
                payload: deleteExternalAccount.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]