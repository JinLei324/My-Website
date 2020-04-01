
const entity = '/franchise';

const Joi = require('joi')
const post = require('./post');
const headerValidator = require('../../../middleware/validator');
const i18n = require('../../../../locales/locales');

module.exports = [

    {
        method: 'POST',
        path: entity + '/address',
        handler: post.handler,
        config: {
            tags: ['api', entity],
            description: 'This API is used to get driver based storeid.',
            notes: "This API is used to get driver based storeid.",
            auth: 'dispatcher',
            response: post.responseCode,
            validate: {
                payload: post.validator, 
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }, 
]