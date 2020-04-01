
'use strict';

const entity = '/franchise';

const Joi = require('joi')
const post = require('./post');
const headerValidator = require('../../../middleware/validator');

module.exports = [
    {
        method: 'POST',
        path: entity + '/logout',
        handler: post.handler,
        config: {
            tags: ['api', entity],
            description: "This api used to logout to dispatcher",
            notes: "This api used to logout to dispatcher",
            auth: 'dispatcher',
            response: post.responseCode,
            validate: {
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    },


]