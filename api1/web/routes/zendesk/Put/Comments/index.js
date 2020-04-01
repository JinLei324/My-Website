'use strict';

const headerValidator = require('../../../../middleware/validator');
const post = require('./post');

module.exports = {
    method: 'PUT',
    path: '/zendesk/ticket/comments',
    handler: post.APIHandler,
    config: {
        description: 'create ticket comments',
        tags: ['api', 'ticket'],
        validate: {
            headers: headerValidator.headerAuthValidator,
            payload: post.Validator,
        },
    }
}