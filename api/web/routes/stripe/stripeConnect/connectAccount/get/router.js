
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "connectAccount";

const getConnectAccount = require('./get');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * api to post ack bookings
    */
    {
        method: 'GET',
        path: '/' + entity,
        handler: getConnectAccount.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripeConnectAccountGet'],
            notes: errorMsg['apiDescription']['stripeConnectAccountGet'],
            auth: 'driverJWT',
            response: getConnectAccount.responseCode,
            validate: {
                params: getConnectAccount.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]