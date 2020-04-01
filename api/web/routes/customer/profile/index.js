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
module.exports = [{
    method: 'GET',
    path: '/customer/profile',
    config: {
        tags: ['api', 'customer'],
        description: 'GET user profile info',
        notes: "Get email, phone and pass",
        auth: 'customerJWT',
        validate: {
            /** @memberof headerValidator */
            headers: headerValidator.headerAuthValidator,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: {
                    message: Joi.any().default(i18n.__('getProfile')['200']),
                    data: Joi.any().example({
                        "name": "Testing",
                        "countryCode": "+91",
                        "mobile": "9898989897",
                        "email": "test@email.com",
                        "profilePic": "",
                        "mmjCard": {
                            "url": "",
                            "verified": false
                        },
                        "identityCard": {
                            "url": "",
                            "verified": false
                        }
                    })
                },
                498: {
                    message: Joi.any().default(i18n.__('genericErrMsg')['498'])
                },
                500: {
                    message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                }
            }
        },
    },
    handler: getByToken.handler
}, {
    method: 'PATCH',
    path: '/customer/profile',
    config: {
        tags: ['api', 'customer'],
        description: 'Update profile API',
        notes: "API to update the password, name, email, profile pic etc",
        auth: 'customerJWT',
        validate: {
            payload: patchByToken.validator,
            /** @memberof headerValidator */
            headers: headerValidator.headerAuthValidator,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: {
                    message: Joi.any().default(i18n.__('patchProfile')['200'])
                },
                400: {
                    message: Joi.any().default(i18n.__('patchProfile')['400'])
                },
                412: {
                    message: Joi.any().default(i18n.__('slavePhoneValidation')['412'])
                },
                413: {
                    message: Joi.any().default(i18n.__('slaveEmailValidation')['413'])
                },
                500: {
                    message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                }
            }
        }
    },
    handler: patchByToken.handler
},]