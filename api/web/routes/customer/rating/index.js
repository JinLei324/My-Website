/** @global */
const Joi = require('joi')
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @namespace */
const reasons = require('./get');
/** @namespace */
const post = require('./post');
/**
 * A module that exports Customer API  routes to hapi server!
 * @exports CUSTOMER-RATING-API-ROUTES 
 */
module.exports = [
    /**
     * api to signIn
     */
    {
        method: 'GET',
        path: '/customer/rating/{storeType}',
        config: {
            tags: ['api', 'customer'],
            description: 'Api for customer ratings list.',
            notes: "This API for customer ratings list.",
            auth: 'customerJWT',
            validate: {
                /** @memberof validator */
                params: reasons.validator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('getData')['200']),
                        data: Joi.any().example({
                            "_id": "5b7aaba5f801686e296b9435",
                            "associated": 2,
                            "associatedMsg": "Associated with Order",
                            "name": "Delivery Staff\t",
                            "attributes": {
                                "1": [
                                    "Delayed Delivery",
                                    "Wrong Address Delivery",
                                    "Executive",
                                    "Unfamiliar with delivery route",
                                    "Unprofessional Executive",
                                    "Untrained Executive",
                                    "My reason is not listed",
                                    "Didn"
                                ],
                                "2": [
                                    "Executive didn",
                                    "Executive couldn",
                                    "Delayed Delivery",
                                    "No bill given",
                                    "Package was torn",
                                    "My reason is not listed"
                                ]
                            }
                        })
                    },
                    500: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                    }
                }
            }
        },
        /** @memberof reasons */
        handler: reasons.handler
    },
    /**
     * api to customer transaction
     */
    {
        method: 'PATCH', // Methods Type
        path: '/customer/rating', // Url
        config: { // "tags" enable swagger to document API 
            tags: ['api', 'customer'],
            description: 'This API is used to update rating of the booking.',
            notes: "This API is used to update rating of the booking.", // We use Joi plugin to validate request 
            auth: 'customerJWT',
            validate: {
                /** @memberof post validator */
                payload: {
                    orderId: Joi.number().integer().required().description('orderId'),
                    tip: Joi.string().description('tip amount').allow(""),
                    // rating: Joi.string().required().description('ratingMsg'),
                    review: Joi.array().items().required().description('review example [{"name":"quality","message":"More than Enough","id":"5ab387bb10da0226d2a6d585","rating":4,"associated":2, }]'),
                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('slaveUpdateProfile')['200'])
                    },
                    404: {
                        message: Joi.any().default(i18n.__('getData')['404'])
                    },
                    500: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                    }
                }
            }
        },
        handler: post.handler
    }

]