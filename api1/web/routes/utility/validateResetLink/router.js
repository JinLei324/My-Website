'use strict';

const entity = '/utility';
const errorMsg = require('../../../../locales');
const get = require('./get');

const headerValidator = require('../../../middleware/validator');

module.exports = [
    {
        method: 'GET',
        path: entity + '/validateResetLink',
        handler: get.handler,
        config: {
            tags: ['api', 'utility'],
            description: 'API for validate reset link.',
            notes: 'API for validate reset link.',
            // auth: {
            //     strategies: ['slaveJWT', 'driverJWT', 'dispatcherJWT', 'adminJwt']
            // },
            auth: false,
            response: get.responseCode,
            validate: {
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    console.log('fail action', error);
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
];