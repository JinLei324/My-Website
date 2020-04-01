'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:get 
 */
/** @global */
const headerValidator = require('../../../middleware/validator');
const get = require('./get');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi');

module.exports = {
    method: 'GET',
    path: '/customer/config',
    config: {
        tags: ['api', 'customer'],
        description: 'get app configuration',
        notes: 'api returns, unique configuration which is handled by admin',
        auth: false,
        validate: {
            /** @memberof headerValidator */
            headers: headerValidator.language,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: {
                    message: Joi.any().default(i18n.__('getData')['200']),
                    data: Joi.any().example({
                        "pubnubkeys": "",
                        "custGoogleMapKeys": [
                            "AIzaSyBOqakmNqRQtQHS5j1R5yvsr1rQirKoP50",
                            "AIzaSyBal29fcMJVfW2HXX_VXR5sZsarI19YwLQ"
                        ],
                        "custGooglePlaceKeys": [
                            "AIzaSyBOqakmNqRQtQHS5j1R5yvsr1rQirKoP50",
                            "AIzaSyBal29fcMJVfW2HXX_VXR5sZsarI19YwLQ"
                        ],
                        "allCustomerspushTopics": "allCustomers_1507987086680",
                        "aallCitiesCustomerspushTopics": "allCitiesCustomers_1507987086680",
                        "outZoneCustomerspushTopics": "",
                        "customerApiInterval": 0,
                        "paidByReceiver": false,
                        "stripeKey": "pk_test_IBYk0hnidox7CDA3doY6KQGi",
                        "latebookinginterval": 3600,
                        "termsAndConditionsUrl": "http://superadmin.flexyapp.com/appWebPages/Customer/Termsen.html",
                        "privacyPoliciesUrl": "http://superadmin.flexyapp.com/appWebPages/Customer/Privacyen.html",
                        "activeLanguages": []
                    })
                },
                500: {
                    message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                }
            }
        }
    },
    handler: get.handler
};