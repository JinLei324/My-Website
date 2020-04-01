/** @global */
const Joi = require('joi')
/** @namespace */

const post = require('./post');
/** @global */
const headerValidator = require('../../../../middleware/validator');
/**
* A module that exports manager API  routes to hapi server!
* @exports 
*/ 

module.exports = [
    /**
    * api to post ack bookings
    */
    {
        method: 'POST',
        path: '/dispatcher/unAssign',
        handler: post.APIHandler,
        config: {
            tags: ['api', 'dispatcher'],
            description: 'This API is used to Assign job Un-Assign.',
            notes: "This API is used to Assign job Un-Assign.",
            auth: 'managerJWT',
            //            response: postBookingAck.responseCode,
            validate: {
                headers: headerValidator.headerAuthValidator,
                payload: post.payload,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]