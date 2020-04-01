'use strict';

const entity = '/admin';
const post = require('./post');



const headerValidator = require('../../../../middleware/validator');

module.exports = [


    {
        method: 'POST',
        path: entity + '/sendTopicPush',
        handler: post.handler,
        config: {
            tags: ['api', 'admin'],
            description: "send push to a topic",
            auth: false,
            // response: postForgot.responseCode,
            validate: {
                headers: headerValidator.language,
                payload: post.payload,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
];