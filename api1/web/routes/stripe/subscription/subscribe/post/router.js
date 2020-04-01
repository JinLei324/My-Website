
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "subscribe";

const postSubscribe = require('./post');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * api to subscribe to a plan
    */
    {
        method: 'POST',
        path: '/' + entity,
        handler: postSubscribe.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripeSubscribePost'],
            notes: errorMsg['apiDescription']['stripeSubscribePost'],
            auth: 'customerJWT',
            response: postSubscribe.responseCode,
            validate: {
                payload: postSubscribe.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]