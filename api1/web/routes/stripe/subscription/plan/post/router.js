
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "plan";

const postPlan = require('./post');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * api to add new Plan
    */
    {
        method: 'POST',
        path: '/' + entity,
        handler: postPlan.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripePlanPost'],
            notes: errorMsg['apiDescription']['stripePlanPost'],
            // auth: 'customerJWT',
            response: postPlan.responseCode,
            validate: {
                payload: postPlan.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]