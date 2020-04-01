
// 'use strict';

// const headerValidator = require('../../../../middleware/validator');
// //const i18n = require('../../../../../locales/locales');



// const post = require('./post');


'use strict';

const headerValidator = require('../../../../middleware/validator');

// const entity = "/driver";

const postBookingAck = require('./post');

module.exports = [
    /**
    * api to post ack bookings
    */
    {
        method: 'POST',
        path: '/driver/bookingAck',
        handler: postBookingAck.APIHandler,
        config: {
            tags: ['api', 'booking'],
            description: 'This API allows user to post booking ACK.',
            notes: 'This API allows user to post booking ACK.',
            auth: 'driverJWT',
            //            response: postBookingAck.responseCode,
            validate: {
                headers: headerValidator.driverHeaderAuthValidator,//headerAuthValidator,
                payload: postBookingAck.payload,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]

// module.exports = [
//      {
//         method: 'POST', // Methods Type
//         path: '/driver/bookingAck', // Url
//         config: {// "tags" enable swagger to document API 
//             tags: ['api', 'booking'],
//             description: 'This API allows user to post booking ACK.',
//             notes: "This API allows user to post booking ACK..", // We use Joi plugin to validate request 
//             auth: 'driverJWT',
//             validate: {

//                 /** @memberof headerValidator */
//                 headers: headerValidator.headerAuthValidator,
//                 /** @memberof headerValidator */
//                  payload: post.payload,
//                 //failAction: headerValidator.customError,
//                 failAction: (req, reply, source, error) => {
//                     return reply({ message: error.output.payload.message }).code(error.output.statusCode);
//                 }
//             },
//             // response: {
//             //     status: {
//             //         200: {
//             //             message: error['driverList']['200']['0']
//             //         },
//             //         500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
//             //     }
//             // }
//         },
//         handler: post.APIHandler
//     }
// ]



