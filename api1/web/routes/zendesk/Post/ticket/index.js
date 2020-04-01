'use strict';

const headerValidator = require('../../../../middleware/validator');
const post = require('./post');
module.exports = {
    method: 'POST',
    path: '/zendesk/ticket',
    handler: post.APIHandler,
    config: {
        description: 'create single ticket',
        tags: ['api', 'ticket'],
        validate: {
            headers: headerValidator.headerAuthValidator,
            payload: post.Validator,
        },
    }
}