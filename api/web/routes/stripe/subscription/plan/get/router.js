
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "plan";

const getPlan = require('./get');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * api to get stored cards
    */
    {
        method: 'GET',
        path: '/' + entity,
        handler: getPlan.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripePlanGet'],
            notes: errorMsg['apiDescription']['stripePlanGet'],
            // auth: 'customerJWT',
            response: getPlan.responseCode,
            validate: {
                // params: getPlan.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]