
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "subscribe";

const patchSubscribe = require('./patch');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * API to update subscription
    */
    {
        method: 'PATCH',
        path: '/' + entity,
        handler: patchSubscribe.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripeSubscribePatch'],
            notes: errorMsg['apiDescription']['stripeSubscribePatch'],
            auth: 'customerJWT',
            response: patchSubscribe.responseCode,
            validate: {
                payload: patchSubscribe.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]