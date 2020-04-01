/** @global */
const Joi = require('joi')
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @namespace */
const reasons = require('./post');
/**
 * A module that exports Customer API  routes to hapi server!
 * @exports CUSTOMER-CANCELLATION-API-ROUTES 
 */
module.exports = [
    /**
     * api to signIn
     */
    {
        method: 'GET',
        path: '/reasons',
        config: {
            tags: ['api', 'customer'],
            description: 'Api for customer cancellation reasons.',
            notes: "This API allows user to get Api for customer cancellation reasons.",
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
                        message: Joi.any().default(i18n.__('genericErrMsg')['200']),
                        data: Joi.any().example([{
                            "_id": "5b7ac4d6f801686e31123ec0",
                            "res_id": 1,
                            "reasonObj": {
                                "en": "I needed earlier delivery."
                            },
                            "reasons": "I needed earlier delivery."
                        }, {
                            "_id": "5b7ac4e4f801687075535eef",
                            "res_id": 2,
                            "reasonObj": {
                                "en": "I was trying out of Flexy."
                            },
                            "reasons": "I was trying out of Flexy."
                        }, {
                            "_id": "5b7ac4f8f801686e296b944a",
                            "res_id": 3,
                            "reasonObj": {
                                "en": "Forgot to add/remove items."
                            },
                            "reasons": "Forgot to add/remove items."
                        }, {
                            "_id": "5b7ac504f801686e31123ec1",
                            "res_id": 4,
                            "reasonObj": {
                                "en": "Not available to receive order."
                            },
                            "reasons": "Not available to receive order."
                        }, {
                            "_id": "5b7ac50ef801687075535ef0",
                            "res_id": 5,
                            "reasonObj": {
                                "en": "I don't need the products anymore."
                            },
                            "reasons": "I don't need the products anymore."
                        }, {
                            "_id": "5b7ac51cf801686e296b944b",
                            "res_id": 6,
                            "reasonObj": {
                                "en": "I selected the wrong address."
                            },
                            "reasons": "I selected the wrong address."
                        }])
                    },
                    500: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                    }
                }
            }
        },
        /** @memberof reasons */
        handler: reasons.handler
    }

]