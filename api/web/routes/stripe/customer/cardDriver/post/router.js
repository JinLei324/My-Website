
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "driver/card";

const postCard = require('./post');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * api to add new card
    */
    {
        method: 'POST',
        path: '/' + entity,
        handler: postCard.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripeCardPost'],
            notes: errorMsg['apiDescription']['stripeCardPost'],
            auth: 'driverJWT',
            response: postCard.responseCode,
            validate: {
                payload: postCard.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]