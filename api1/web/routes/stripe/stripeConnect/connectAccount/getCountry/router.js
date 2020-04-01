
'use strict';

const headerValidator = require('../../../../../middleware/validator');
const entity = "connectAccount";
const getConnectAccountCountry = require('./get');
const errorMsg = require('../../../../../../locales');

module.exports = [
    {
        method: 'GET',
        path: '/connectAccountCountry',
        handler: getConnectAccountCountry.APIHandler,
        config: {
            tags: ['api', entity],
            description: "get list of supported country",
            notes: "get list of supported country",
            auth: false,
            // auth: 'driverJWT',
            response: getConnectAccountCountry.responseCode,
            validate: {
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]