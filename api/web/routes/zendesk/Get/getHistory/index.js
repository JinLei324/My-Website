
'use strict';

const headerValidator = require('../../../../middleware/validator');
const get = require('./get');

module.exports = {
    method: 'GET',
    path: '/zendesk/ticket/history/{id}',
    handler: get.APIHandler,
    config: {
        description: 'display ticket history',
        tags: ['api', 'ticket'],
        validate: {
            headers: headerValidator.headerAuthValidator,
            params: get.Validator
        },
    }
}