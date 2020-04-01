
'use strict';

const entity = '/admin';

const postSignIn = require('./post');

const errorMsg = require('../../../../locales');

const headerValidator = require('../../../middleware/validator');

module.exports = [
    /**
     * @name POST /admin/signIn
     */
    {
        method: 'POST',
        path: entity + '/store/signIn',
        handler: postSignIn.handler,
        config: {
            tags: ['api', 'admin'],
            description: errorMsg['apiDescription']['adminPostSignIn'],
            notes: errorMsg['apiDescription']['adminPostSignIn'],
            auth: false,
            // response: postSignIn.responseCode,
            validate: {
                headers: headerValidator.headerLanValidator,
                payload: postSignIn.payload,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
];