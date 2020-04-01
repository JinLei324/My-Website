
'use strict';

const headerValidator = require('../../../middleware/validator');

const postRedisEvent = require('./postRedisEvent');

module.exports = [
    /**
    * api to post ride booking test
    */
    {
        method: 'POST',
        path: '/redisEvent',
        handler: postRedisEvent.APIHandler,
        config: {
            tags: ['api', 'redisEvent'],
            description: 'This API allows call api on redis Event.',
            notes: 'This API allows call api on redis Event.',
            auth: false,
            validate: {
                payload: postRedisEvent.payloadValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]