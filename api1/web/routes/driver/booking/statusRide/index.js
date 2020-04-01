
'use strict';

const headerValidator = require('../../../../middleware/validator');
const i18n = require('../../../../../locales/locales');



const postStatusRide = require('./post');

module.exports = [
    {
        method: 'POST', // Methods Type
        path: '/driver/bookingStatusRide', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'booking'],
            description: 'This API allows user to update Booking status.',
            notes: "This API allows user to update Booking status",
            auth: 'driverJWT',
            validate: {
                payload: postStatusRide.payload,
                /** @memberof headerValidator */
                headers: headerValidator.driverHeaderAuthValidator,//headerAuthValidator,
                /** @memberof headerValidator */
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        },
        handler: postStatusRide.APIHandler
    }
]