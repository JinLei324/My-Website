
'use strict';

const headerValidator = require('../../../../../middleware/validator');

const entity = "customer/card";

const deleteCard = require('./delete');
const errorMsg = require('../../../../../../locales');

module.exports = [
    /**
    * Api to Delete Card from stripe
    */
    {
        method: 'DELETE',
        path: '/' + entity,
        handler: deleteCard.APIHandler,
        config: {
            tags: ['api', entity],
            description: errorMsg['apiDescription']['stripeCardDelete'],
            notes: errorMsg['apiDescription']['stripeCardDelete'],
            auth: 'customerJWT',
            response: deleteCard.responseCode,
            validate: {
                payload: deleteCard.payload,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]