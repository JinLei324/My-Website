'use strict';

const entity = '/admin';
const post = require('./post'); 
const postUser = require('./postUser'); 
const headerValidator = require('../../middleware/validator');

module.exports = [
    {
        method: 'POST',
        path: entity + '/payoff',
        config: {
            auth: 'guestJWT',
            handler: post.handler,
            tags: ['api', 'admin'],
            description: 'This Api used to Payoff users from admin.',
            notes: 'This Api used to Payoff users from admin.',
            validate: {
                payload: post.payload,
                headers: headerValidator.headerAuthValidator, 
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    },
    {
        method: 'POST',
        path: entity + '/user/payoff',
        config: {
            auth: 'guestJWT',
            handler: postUser.handler,
            tags: ['api', 'admin'],
            description: 'This Api used to Payoff user from admin.',
            notes: 'This Api used to Payoff user from admin.',
            validate: {
                payload: postUser.payload,
                headers: headerValidator.headerAuthValidator, 
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }

];