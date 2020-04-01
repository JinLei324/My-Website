
const entity = '/franchise';

const Joi = require('joi')
const login = require('./post');
const i18n = require('../../../../locales/locales');
const headerValidator = require('../../../middleware/validator');


module.exports = [
    /**
    * api to managerLogin
    */
    {
        method: 'POST',
        path: entity + '/logIn',
        handler: login.handler,
        config: {
            tags: ['api', entity],
            description: "Api for franchise",
            notes: 'dispatcher',
            auth: false,
            validate: {
                headers: headerValidator.language,
                payload: login.validator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    },
]