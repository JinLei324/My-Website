
const entity = '/SF/franchise';

const Joi = require('joi')
const get = require('./get');
const headerValidator = require('../../../../../middleware/validator');
const error = require('../../../../../../locales');

module.exports = [

    {
        method: 'GET',
        path: entity + '/driver/{cityId}/{index}/{franchiseId}/{storeId}/{status}/{search}',
        handler: get.handler,
        config: {
            tags: ['api', entity],
            description: 'This API is used to get driver based storeid.',
            notes: "This API is used to get driver based storeid.",
            //auth: 'dispatcher',
            auth: false,
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