
'use strict';

const headerValidator = require('../../../middleware/validator');

const entity = "/utility";

const getLanguages = require('./get');
const errorMsg = require('../../../../locales');

module.exports = [
    /**
    * api to get languages
    */
    {
        method: 'GET',
        path: entity + '/languages',
        handler: getLanguages.APIHandler,
        config: {
            tags: ['api', 'languages'],
            description: errorMsg['apiDescription']['customerGetLanguages'],
            notes: errorMsg['apiDescription']['customerGetLanguages'],
            auth: false,
            validate: {
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]