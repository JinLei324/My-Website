
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "subscribe";

const deleteSubscribe = require('./delete');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * Api to Delete subscription
    */
    {
        method: 'DELETE',
        path: '/' + entity,
        handler: deleteSubscribe.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripeSubscribeDelete'],
            notes: errorMsg['apiDescription']['stripeSubscribeDelete'],
            auth: 'customerJWT',
            response: deleteSubscribe.responseCode,
            validate: {
                payload: deleteSubscribe.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]