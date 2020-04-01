
'use strict';

const headerValidator = require('../../middleware/validator');
const postCronJobTrigger = require('./postCronJobTrigger');

module.exports = [
    {
        method: 'POST',
        path: '/cronJobTrigger',
        handler: postCronJobTrigger.APIHandler,
        config: {
            tags: ['api', 'cronJobTrigger'],
            description: 'This API allows call api on for cronjob.',
            notes: 'This API allows call api on for cronjob.',
            auth: false,
            validate: {
                // payload: postCronJobTrigger.payloadValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]