
const entity = '/franchise';

const Joi = require('joi')
const get = require('./get');
const headerValidator = require('../../../middleware/validator');
const i18n = require('../../../../locales/locales');

module.exports = [

    {
        method: 'GET',
        path: entity + '/driver/{cityId}/{index}/{franchiseId}/{storeId}/{status}/{search}',
        handler: get.handler,
        config: {
            tags: ['api', entity],
            description: 'This API is used to get driver based storeid.',
            notes: "This API is used to get driver based storeid.",
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
    }, 
     {
        method: 'GET',
        path: '/driver/{cityId}/{index}/{franchiseId}/{storeId}/{status}/{search}',
        handler: get.handler,
        config: {
            tags: ['api', entity],
            description: 'This API is used to get driver based storeid.',
            notes: "This API is used to get driver based storeid.",
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
    }, 
]