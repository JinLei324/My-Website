
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "plan";

const patchPlan = require('./patch');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * API to update plan data
    */
    {
        method: 'PATCH',
        path: '/' + entity,
        handler: patchPlan.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripePlanPatch'],
            notes: errorMsg['apiDescription']['stripePlanPatch'],
            // auth: 'customerJWT',
            response: patchPlan.responseCode,
            validate: {
                payload: patchPlan.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]