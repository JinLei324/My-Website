'use strict'
/** 
 * This const requires the modules get model
 * @const
 * @requires module:POST 
 */
/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const categories = require('../../../commonModels/store/categories/get');
/** @namespace */
const stores = require('../../../commonModels/store/get');

/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi');
module.exports = [
    //     {
    //     method: 'GET',
    //     path: '/dispatcher/categories/{storeId}',
    //     config: {
    //         tags: ['api', 'dispatcher'],
    //         description: 'Api for get the product categories and sub-categories.',
    //         notes: "Api for get the categories based on store and sub categories.",
    //         auth: 'managerJWT',
    //         validate: {
    //             /** @memberof validator */
    //             params: categories.validator,
    //             /** @memberof headerValidator */
    //             headers: headerValidator.headerAuthValidator,
    //             /** @memberof headerValidator */
    //             failAction: headerValidator.customError
    //         },
    //         response: {
    //             status: {
    //                 200: { message: Joi.any().default(i18n.__('stores')['200'], data: Joi.any() },
    //                 404: { message: Joi.any().default(i18n.__('stores')['404'] },
    //                 500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
    //             }
    //         },
    //     },
    //     handler: categories.handler
    // },
    {
        method: 'GET',
        path: '/store/categories/{cityId}',
        config: {
            tags: ['api', 'store'],
            description: 'Api to get the store categories based on city.',
            notes: "Api to get the store categories based on city.",
            auth: false,
            validate: {
                /** @memberof validator */
                params: categories.catByCityIdValidator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
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
                                "availableInCities": ["5af45724f5a599527c31f68d", "5b4c7825f8016878841a09d4", ],
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
        handler: categories.storeCategoryHandler
    }, {
        method: 'GET',
        path: '/store/favourite/{type}/{categoryId}/{lat}/{long}/{zoneId}/{offset}/{limit}',
        config: {
            tags: ['api', 'store'],
            description: 'Api for get the stores based on type.',
            notes: "Api for get the stores based on type",
            // auth: false,
            auth: {
                strategies: ['customerJWT']
            },
            validate: {
                /** @memberof validator */
                params: categories.catValidator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
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
        handler: categories.storeCategoryHandlerFavourite
    }, {
        method: 'GET',
        path: '/store/{type}/{categoryId}/{lat}/{long}/{zoneId}/{offset}/{limit}',
        config: {
            tags: ['api', 'store'],
            description: 'Api for get the stores based on type.',
            notes: "Api for get the stores based on type",
            // auth: false,
            auth: {
                strategies: ['guestJWT', 'customerJWT']
            },
            validate: {
                /** @memberof validator */
                params: categories.catValidator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
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
                        ),
                        offerData: Joi.any().example(
                            [{
                                "_id": "5bebeb11f801685e19cbf122",
                                "startDateTime": 1542148200,
                                "perUserLimit": 15,
                                "globalUsageLimit": 15,
                                "offerType": 1,
                                "status": 1,
                                "applicableOnStatus": "Product",
                                "description": "Choose from a wide range of refreshing and invigorating fruit juices from leading brands such as Tropicana, Traders Joe and many more",
                                "name": "15% off on Juices & Nectars",
                                "storeId": "5be9379e39050c5f52cb2b3f",
                                "images": {
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1542187706012_JuiceandNectars.png",
                                    "image": " http://s3.amazonaws.com/flexyapp/1542187706012_JuiceandNectars.png",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1542187706012_JuiceandNectars.png"
                                },
                                "minimumPurchaseQty": 15,
                                "endDateTime": 1561645800,
                                "offerTypeString": "Percentage Discount",
                                "discountValue": 10,
                                "offerId": "5bebeb11f801685e19cbf122"
                            }]
                        ),
                        favStore: Joi.any().example(
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
        handler: categories.storeCategoryHandlerById
    }, {
        method: 'GET',
        path: '/store/{type}/{categoryId}/{subcategoryId}/{lat}/{long}/{zoneId}/{offset}/{limit}',
        config: {
            tags: ['api', 'store'],
            description: 'Api for get the stores based on type.',
            notes: "Api for get the stores based on type",
            auth: false,
            validate: {
                /** @memberof validator */
                params: categories.subcatValidator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
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
                        ),
                        storeCount: Joi.any()
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
        handler: categories.storeSubCategoryHandlerById
    }, {
        method: 'GET',
        path: '/store/{categoryId}/{search}/{serviceType}/{lat}/{long}',
        config: {
            tags: ['api', 'store'],
            description: 'Api to search store based on address selected',
            notes: "Api to search store based on address selected",
            // auth: false,
            auth: {
                strategies: ['guestJWT', 'customerJWT']
            },
            validate: {
                /** @memberof validator */
                params: stores.searchValidator,
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            // response: {
            //     status: {
            //         200: {
            //             message: Joi.any().default(i18n.__('stores')['200']),
            //             data: Joi.any().example(
            //                 [{
            //                     "_id": "5af35059f5a599016e366533",
            //                     "bannerImage": "https://s3.amazonaws.com/flexyapp/storeCategory/bannerImages/file201851011732.jpg",
            //                     "logoImage": "https://s3.amazonaws.com/flexyapp/storeCategory/logoImages/file201881120221.png",
            //                     "description": "In some countries such as the United States, grocery stores descended from trading posts, which sold not only food but clothing, furniture, household items, tools, and other miscellaneous merchandise. ",
            //                     "visibility": 1,
            //                     "type": 2,
            //                     "typeName": "Store",
            //                     "seqId": 2,
            //                     "typeMsg": "Store",
            //                     "visibilityMsg": "Unhidden",
            //                     "availableInCities": [
            //                         "5af45724f5a599527c31f68d",
            //                         "5b4c7825f8016878841a09d4",
            //                     ],
            //                     "fileName": "/var/www/html/flexyAdmin/grocer_admin2.0_admin_flexy/Superadmin/../xml/5af35059f5a599016e366533.xml",
            //                     "colorCode": "7cb813",
            //                     "categoryName": "Boodschappen",
            //                     "catTypeGif": ""
            //                 }]
            //             ),
            //         },
            //         404: {
            //             message: Joi.any().default(i18n.__('stores')['404'])
            //         },
            //         500: {
            //             message: Joi.any().default(i18n.__('genericErrMsg')['500'])
            //         }
            //     }
            // },
        },
        handler: stores.searchHandler
    },
];