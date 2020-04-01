
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "plan";

const deletePlan = require('./delete');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * Api to Delete Plan from stripe
    */
    {
        method: 'DELETE',
        path: '/' + entity,
        handler: deletePlan.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripePlanDelete'],
            notes: errorMsg['apiDescription']['stripePlanDelete'],
            // auth: 'customerJWT',
            response: deletePlan.responseCode,
            validate: {
                payload: deletePlan.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]