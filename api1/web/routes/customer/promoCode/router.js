'use strict';

const entity = '/customer';
const get = require('./get');
const post = require('./post');
const headerValidator = require('../../../middleware/validator');

module.exports = [
    {
        method: 'POST',
        path: entity + '/promoCodeValidation',
        handler: post.handler,
        config: {
            tags: ['api', 'Promo And Referral'],
            description: 'This API ensures that a referal code is used only once by one user',
            notes: 'This API ensures that a referal code is used only once by one user',
            auth: 'customerJWT',
            // response: post.responseCode,
            validate: {
                headers: headerValidator.headerAuthValidator,
                payload: post.payload,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    },
    {
        method: 'GET',
        path: entity + '/promoCode/{lat}/{long}',
        handler: get.handler,
        config: {
            tags: ['api', 'Promo And Referral'],
            description: "This API use to get all promoCode",
            notes: 'This API use to get all promoCode',
            auth: 'customerJWT',
            // response: post.responseCode,
            validate: {
                params: get.params,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    },
];
