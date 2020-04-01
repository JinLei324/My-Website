
'use strict';

const entity = "webhooks";

const postStripe = require('./post');

module.exports = [
    /**
    * 'Stripe webhook for handling an event ',
    */
    {
        method: 'POST',
        path: '/' + entity + '/stripe',
        handler: postStripe.APIHandler,
        config: {
            tags: ['api', entity],
            description: 'Stripe webhook for handling an event ',
            notes: 'Stripe webhook for handling an event ',
            response: postStripe.responseCode,
            validate: {
                payload: postStripe.payload,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]