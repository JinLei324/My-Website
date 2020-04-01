'use strict';

const entity = '/laundry';
const get = require('./get');

'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:POST 
 */
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi');

module.exports = [

    {
        method: 'GET',
        path: entity + '/store/{type}/{lat}/{long}/{offset}/{limit}',
        config: {
            tags: ['api', 'laundry'],
            description: 'Api for get the stores based on type.',
            notes: "Api for get the stores based on type",
            auth: false,
            validate: {
                /** @memberof validator */
                params: get.paramsValidator,
                /** @memberof headerValidator */
                headers: headerValidator.languageDriver,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('stores')['200']),
                        data: Joi.any().example(
                            [{
                                "_id": "5af35059f5a599016e366533",
                                "bannerImage": "https://s3.amazonaws.com/flexyapp/storeCategory/bannerImages/file201851011732.jpg",
                                "logoImage": "https://s3.amazonaws.com/flexyapp/storeCategory/logoImages/file201881120221.png",
                                "description": "In some countries such as the United States, grocery stores descended from trading posts, which sold not only food but clothing, furniture, household items, tools, and other miscellaneous merchandise. ",
                                "visibility": 1,
                                "type": 2,
                                "typeName": "Store",
                                "seqId": 2,
                                "typeMsg": "Store",
                                "visibilityMsg": "Unhidden",
                                "availableInCities": [
                                    "5af45724f5a599527c31f68d",
                                    "5b4c7825f8016878841a09d4",
                                ],
                                "fileName": "/var/www/html/flexyAdmin/grocer_admin2.0_admin_flexy/Superadmin/../xml/5af35059f5a599016e366533.xml",
                                "colorCode": "7cb813",
                                "categoryName": "Boodschappen",
                                "catTypeGif": ""
                            }]
                        )
                    },
                    404: {
                        message: Joi.any().default(i18n.__('stores')['404'])
                    },
                    500: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                    }
                }
            },
        },
        handler: get.APIHandler
    }
];
