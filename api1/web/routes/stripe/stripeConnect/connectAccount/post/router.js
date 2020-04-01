
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "connectAccount";

const postConnectAccount = require('./post');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * api to add or update account details
    */
    {
        method: 'POST',
        path: '/' + entity,
        handler: postConnectAccount.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripeConnectAccountPost'],
            notes: errorMsg['apiDescription']['stripeConnectAccountPost'],
            auth: 'driverJWT',
            response: postConnectAccount.responseCode,
            validate: {
                payload: postConnectAccount.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]