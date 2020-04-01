
'use strict';

const headerValidator = require('../../../../middleware/validator');
const error = require('../../../../../locales');

const postRespondTo = require('./post');

module.exports = [
    {
        method: 'POST', // Methods Type
        path: '/driver/bookingStatusCourier', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'booking'],
            description: 'This API allows user to update Booking status.',
            notes: "This API allows user to update Booking status",
            auth: 'driverJWT',
            validate: {
                payload: postRespondTo.payload,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            },
        },
        handler: postRespondTo.APIHandler
    }
]