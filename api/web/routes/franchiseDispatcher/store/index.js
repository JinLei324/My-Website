
const entity = '/franchise';

const Joi = require('joi')
const get = require('./get'); 
const i18n = require('../../../../locales/locales');
const headerValidator = require('../../../middleware/validator');

module.exports = [
    {
        method: 'GET',
        path: entity + '/store/{franchiseId}',
        handler: get.handler,
        config: {
            tags: ['api', entity],
            description: "This API is used to get store based on franchiseId.",
            notes: "This API is used to get store based on franchiseId.",
            auth: 'dispatcher',
            response: get.responseCode,
            validate: {
                params: get.validator,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }  
]