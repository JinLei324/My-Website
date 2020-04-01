'use strict';

const entity = '/customer';
const get = require('./get');
const post = require('./post');
const errorMsg = require('../../../../locales');
const headerValidator = require('../../../middleware/validator');

module.exports = [
    {
        method: 'POST',
        path: entity + '/referralCodeValidation',
        handler: post.handler,
        config: {
            tags: ['api', 'Promo And Referral'],
            description: 'This API ensures that a referal code is used only once by one user',
            notes: 'This API ensures that a referal code is used only once by one user',
            auth: false,
            response: post.responseCode,
            validate: {
                headers: headerValidator.headerLanValidator,
                payload: post.payload,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    },
    {
        method: 'GET',
        path: entity + '/referralCode',
        handler: get.handler,
        config: {
            tags: ['api', 'Promo And Referral'],
            description: 'This API ensures that a referal code is used only once by one user',
            notes: 'This API ensures that a referal code is used only once by one user',
            auth: 'customerJWT',
            response: get.responseCode,
            validate: {
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    },

];