
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "driver/card";

const getCard = require('./get');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * api to get stored cards
    */
    {
        method: 'GET',
        path: '/' + entity,
        handler: getCard.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripeCardGet'],
            notes: errorMsg['apiDescription']['stripeCardGet'],
            auth: 'driverJWT',
            response: getCard.responseCode,
            validate: {
                params: getCard.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]