'use strict';

const entity = '/laundry';
const post = require('./post');
const Joi = require('joi');
const i18n = require('../../../../locales/locales');
const headerValidator = require('../../../middleware/validator');

module.exports = [

    {
        method: 'POST',
        path: entity + '/estimate',
        handler: post.APIHandler,
        config: {
            tags: ['api', 'laundry'],
            description: "Estimate Delivery api for Laundry",
            auth: {
                strategies: ['guestJWT', 'customerJWT']
            },

            validate: {
                headers: headerValidator.headerAuthValidator,
                payload: post.payloadValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['200']),
                        data: Joi.any().example([{

                            "deliveryFee": {
                                "estimateAmount": 39.38,
                                "expressDeliveryCharge": 20,
                                "deliveryPriceFromCustomerToLaundromat": 8.75,
                                "deliveryPriceFromLaundromatToCustomer": 10.63
                            },
                            "taxData": [{
                                'taxname': "CGST",
                                'taxAmount': 5
                            }],
                            "currencySymbol": "₹"

                        }])
                    },
                    402: { message: Joi.any().default(i18n.__('estimateDelivery')['402']) },
                    403: { message: Joi.any().default(i18n.__('estimateDelivery')['403']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            },
        }
    }
];
