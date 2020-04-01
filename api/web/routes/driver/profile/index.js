/** @global */
const Joi = require('joi')
/** @namespace */
const getByToken = require('./get');
/** @namespace */
const patchByToken = require('./patch');
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-VERIFICATIONCODE-API-ROUTES 
*/
module.exports = [
    {
        method: 'GET',
        path: '/driver/profile',
        config: {
            tags: ['api', 'driver'],
            description: 'GET user profile info',
            notes: "Get email, phone and pass",
            auth: 'driverJWT',
            validate: {
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidatorDriver,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('getProfile')['200']), data: Joi.any() },
                    404: { message: Joi.any().default(i18n.__('getProfile')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        },
        handler: getByToken.handler
    },
    {
        method: 'PATCH',
        path: '/driver/profile',
        config: {
            tags: ['api', 'driver'],
            description: 'Update profile API',
            notes: "API to update the password, name, email, profile pic etc",
            auth: 'driverJWT',
            validate: {
                payload: patchByToken.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidatorDriver,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: { message: Joi.any().default(i18n.__('patchProfile')['200']) },
                    400: { message: Joi.any().default(i18n.__('patchProfile')['400']) },
                    // 406: { message: Joi.any().default(i18n.__('rejectedAccount']['406']) },
                    412: { message: Joi.any().default(i18n.__('slaveEmailValidation')['412']) },
                    413: { message: Joi.any().default(i18n.__('slaveEmailValidation')['413']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        },
        handler: patchByToken.handler
    }
]