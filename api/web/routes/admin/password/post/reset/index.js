/** @global */
const Joi = require('joi') 
/** @global */
const headerValidator = require('../../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../../locales/locales');
/** @namespace */
const resetPassword = require('./post');
/**
* A module that exports Customer API  routes to hapi server!
* @exports FRANCHISE-EMAIL-PHONE-VALIDATION-API-ROUTES 
*/
module.exports = [
     /**
     * api to resetPassword
     */
    {
        method: 'POST',
        path: '/superadmin/resetPassword',
        config: {
            tags: ['api', 'superadmin'],
            description: 'API to reset password',
            notes: 'API to reset password',
            auth: false,
            validate: {
                /** @memberof resetPassword */
                payload: resetPassword.validator
            }
        },
        /** @memberof resetPassword */
        handler: resetPassword.handler
    },
]