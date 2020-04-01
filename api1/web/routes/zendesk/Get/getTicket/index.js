
'use strict';

const headerValidator = require('../../../../middleware/validator');
const get = require('./get');

module.exports = ({
    method: 'GET',
    path: '/zendesk/user/ticket/{emailId}',
    handler: get.APIHandler,
    config: {
        description: 'get singale ticket details',
        tags: ['api', 'ticket'],
        auth: false,
        validate: {
            headers: headerValidator.headerAuthValidator,
            params: get.Validator
        },
    }
})
