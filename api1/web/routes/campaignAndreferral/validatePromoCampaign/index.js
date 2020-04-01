/**/
const postRequest = require('./post');
/** @namespace */
const error = require('../../../../statusMessages/responseMessage');
/** @global */
const Joi = require('joi');


module.exports = [{
        method  : 'POST',
        path    : '/request',
        config  : {
                auth        : false,
                handler     : postRequest.postRequestHandler,
                validate    : postRequest.postRequestValidator,
                tags        : ['api', 'Campaigns'],
                description : 'This API checks if any campaign available or not. If availabe then unlocks it',
                notes       : 'Booking details needed to check the offer details',
                plugins     : {
                                'hapi-swagger': {
                                    payloadType: 'json'
                                    }
                                },
                response    : postRequest.response
        
        }
    },
];