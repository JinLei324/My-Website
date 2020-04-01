'use strict';

const entity = '/laundry';
const post = require('./post');

const headerValidator = require('../../../middleware/validator');

module.exports = [

    {
        method: 'POST',
        path: entity + '/sendPacket',
        handler: post.APIHandler,
        config: {
            tags: ['api', 'laundry'],
            description: "new Order api for send anything",
            // auth: false,
            auth: 'customerJWT',
            // response: post.responseCode,
            validate: {
                headers: headerValidator.headerAuthValidator,
                // headers: headerValidator.language,
                payload: post.payloadValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
];
