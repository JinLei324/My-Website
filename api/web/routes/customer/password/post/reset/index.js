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
* @exports CUSTOMER-EMAIL-PHONE-VALIDATION-API-ROUTES 
*/
module.exports = [
     /**
     * api to resetPassword
     */
    {
        method: 'POST',
        path: '/customer/resetPassword',
        config: {
            tags: ['api', 'customer'],
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