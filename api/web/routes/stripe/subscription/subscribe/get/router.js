
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "subscribe";

const getSubscribe = require('./get');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * api to get subscription details
    */
    {
        method: 'GET',
        path: '/' + entity,
        handler: getSubscribe.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripeSubscribeGet'],
            notes: errorMsg['apiDescription']['stripeSubscribeGet'],
            auth: 'customerJWT',
            response: getSubscribe.responseCode,
            validate: {
                // params: getSubscribe.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]