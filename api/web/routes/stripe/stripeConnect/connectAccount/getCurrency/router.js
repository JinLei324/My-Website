
'use strict';

const headerValidator = require('../../../../../middleware/validator');
const entity = "connectAccount";
const getConnectAccountCurrency = require('./get');
const errorMsg = require('../../../../../../locales');

module.exports = [
    {
        method: 'GET',
        path: '/connectAccountCurrency' + '/{countryId}',
        handler: getConnectAccountCurrency.APIHandler,
        config: {
            tags: ['api', entity],
            description: "get list of supported currency by country",
            notes: "get list of supported currency by country",
            auth: false,
            // auth: 'driverJWT',
            // response: getConnectAccountCurrency.responseCode,
            validate: {
                params: getConnectAccountCurrency.paramsValidator,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]