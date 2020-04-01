'use strict';

const entity = '/utility';
const errorMsg = require('../../../../locales'); 
const post = require('./post');

const headerValidator = require('../../../middleware/validator');

module.exports = [
    {
        method: 'POST',
        path: entity + '/resetPassword',
        handler: post.handler,
        config: {            
            tags: ['api', 'utility'],
            description: "Reset password",
            notes: "Reset password",
            auth: false,
            // response: post.responseCode,
            validate: {
                payload: post.payloadValidator,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    console.log('fail action', error);
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
];