
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "driver/card";

const patchCard = require('./patch');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * API to make card as a default
    */
    {
        method: 'PATCH',
        path: '/' + entity,
        handler: patchCard.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripeCardPatch'],
            notes: errorMsg['apiDescription']['stripeCardPatch'],
            auth: 'driverJWT',
            response: patchCard.responseCode,
            validate: {
                payload: patchCard.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]