/** @global */

/** @namespace */
const product = require('./get');

/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const error = require('../../../../../locales');
/**
 * A module that exports  API  routes to hapi server!
 * @exports 
 */

const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')

module.exports = [
    /**
     * api to add product
     */
    {
        method: 'GET',
        path: '/child/product',
        config: {
            tags: ['api', 'childProduct'],
            description: 'This api is used to get all child products',
            notes: 'This api is used to get all child products',
            auth: false,
            validate: {
                /** @memberof validator */
                // params: product.validator,
                /** @memberof language */
                // headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('products')['200']),
                        data: Joi.any().example(
                            [{
                                "_id": "5b6ddc44f8016859a04b0926",
                                "storeId": "5b6ddba39b77d94c2a954f47",
                                "CBD": "0",
                                "POSNam": [
                                    "",
                                    ""
                                ],
                                "POSName": "",
                                "THC": "0",
                                "UOMstorageTemperature": {
                                    "en": "",
                                    "nl": ""
                                },
                                "actions": [{
                                    "statusMsg": "Approved",
                                    "userType": "admin",
                                    "timeStamp": 1533926469,
                                    "isoDate": "2018-08-10T18:41:09.015Z"
                                }],
                                "actor": "",
                                "actorName": {
                                    "en": "",
                                    "nl": ""
                                },
                                "addOns": [],
                                "allergyInfo": {
                                    "en": "",
                                    "nl": ""
                                },
                                "allergyInformation": "",
                                "artist": "",
                                "artistName": {
                                    "en": "",
                                    "nl": ""
                                },
                                "author": "",
                                "authorName": {
                                    "en": "",
                                    "nl": ""
                                },
                                "barcode": "",
                                "barcodeFormat": "",
                                "brand": "",
                                "brandName": "",
                                "catName": {
                                    "en": "Cash Top Up!",
                                    "nl": "",
                                    "fr": ""
                                },
                                "categoryName": [
                                    "Cash Top Up!",
                                    "",
                                    ""
                                ],
                                "cityId": "5b572fbff8016878841a0d70",
                                "clothingSize": "",
                                "colors": [],
                                "container": "",
                                "containerName": {
                                    "en": "",
                                    "nl": ""
                                },
                                "containerPerServings": {
                                    "en": "",
                                    "nl": ""
                                },
                                "createdTimestamp": 1533926469,
                                "currentDate": "2018-8-10 15:41:8",
                                "detailedDesc": [
                                    "",
                                    ""
                                ],
                                "detailedDescription": "",
                                "director": "",
                                "directorName": {
                                    "en": "",
                                    "nl": ""
                                },
                                "featureName": {
                                    "en": "",
                                    "nl": ""
                                },
                                "features": "",
                                "fileName": "/var/www/html/flexyAdmin/grocer_admin2.0_admin_flexy/Business/../xml/5b6ddbd2f8016859a04b0921.xml",
                                "firstCategoryId": "5b6ddbd2f8016859a04b0921",
                                "firstCategoryName": "Cash Top Up!;;",
                                "genre": "",
                                "genreName": {
                                    "en": "",
                                    "nl": ""
                                },
                                "height": "",
                                "hsnCode": {
                                    "en": "",
                                    "nl": ""
                                },
                                "images": [{
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1533926459312_FlexyApp_Logo-e1531222437283.png",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1533926459312_FlexyApp_Logo-e1531222437283.png",
                                    "image": " http://s3.amazonaws.com/flexyapp/1533926459312_FlexyApp_Logo-e1531222437283.png",
                                    "imageId": "5b6ddc44f8016859a04b0925",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }],
                                "itemKey": "FlexY-Cash-Top-Up!,",
                                "label": "",
                                "labelName": {
                                    "en": "",
                                    "nl": ""
                                },
                                "length": "",
                                "location": {
                                    "lat": 5.8286088,
                                    "lon": -55.1566648
                                },
                                "manufacturerName": "",
                                "medicalAttributes": {
                                    "stress": 0,
                                    "depression": 0,
                                    "pain": 0,
                                    "headaches": 0,
                                    "fatigue": 0
                                },
                                "model": "",
                                "modelName": {
                                    "en": "",
                                    "nl": ""
                                },
                                "mpn": "",
                                "mpnName": {
                                    "en": "",
                                    "nl": ""
                                },
                                "negativeAttributes": {
                                    "dryMouth": 0,
                                    "dryEyes": 0,
                                    "anxious": 0,
                                    "paranoid": 0,
                                    "dizzy": 0
                                },
                                "nutritionFacts": {
                                    "caloriesPerServing": "",
                                    "cholesterolUom": "",
                                    "cholesterolPerServing": "",
                                    "fatCaloriesPerServing": "",
                                    "fibreUom": "",
                                    "fibrePerServing": "",
                                    "sodiumUom": "",
                                    "sodiumPerServing": "",
                                    "proteinUom": "",
                                    "proteinPerServing": "",
                                    "totalFatUom": "",
                                    "totalFatPerServing": "",
                                    "transFatUom": "",
                                    "transFatPerServing": "",
                                    "dvpCholesterol": "",
                                    "dvpCalcium": "",
                                    "dvpIron": "",
                                    "dvpProtein": "",
                                    "dvpSodium": "",
                                    "dvpSaturatedFat": "",
                                    "dvpTotalFat": "",
                                    "dvpVitaminA": "",
                                    "dvpVitaminC": "",
                                    "dvpVitaminD": ""
                                },
                                "nutritionFactsInfo": {
                                    "servingPerCalories": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "uomCholesterol": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "servingPerCholesterol": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "servingPerFatCalories": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "uomFibre": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "servingPerFibre": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "uomSodium": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "sodiumPerServing": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "uomProtein": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "servingPerProtein": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "uomTotalFat": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "servingPerTotalFat": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "uomTransFat": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "servingPerTransFat": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "cholesterolDVP": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "calciumDVP": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "ironDVP": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "sodiumDVP": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "saturatedFatDVP": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "totalFatDVP": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "vitaminADvp": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "vitaminCDvp": {
                                        "en": "",
                                        "nl": ""
                                    },
                                    "vitaminDDvp": {
                                        "en": "",
                                        "nl": ""
                                    }
                                },
                                "parentProductId": "",
                                "pos": {
                                    "en": "",
                                    "nl": ""
                                },
                                "productName": [
                                    "FlexY Cash Top Up!",
                                    ""
                                ],
                                "productname": {
                                    "en": "FlexY Cash Top Up!",
                                    "nl": ""
                                },
                                "publisher": "",
                                "publisherName": {
                                    "en": "",
                                    "nl": ""
                                },
                                "secondCategoryId": "",
                                "secondCategoryName": "",
                                "seqId": 854,
                                "servingsPerContainer": "",
                                "shelflifeuom": "",
                                "shortDesc": [
                                    "FlexY Cash Top Up!",
                                    ""
                                ],
                                "shortDescription": "FlexY Cash Top Up!",
                                "sizeUom": "",
                                "sizes": [],
                                "sku": "",
                                "status": 1,
                                "statusMsg": "Approved",
                                "storageTemperature": "",
                                "storageTemperatureUOM": "",
                                "store": {
                                    "en": "FlexY Store Services"
                                },
                                "storeAverageRating": "",
                                "storeLatitude": 5.8286088,
                                "storeLongitude": -55.1566648,
                                "storeName": [
                                    "FlexY Store Services"
                                ],
                                "strainEffects": {
                                    "relaxed": 0,
                                    "happy": 0,
                                    "euphoric": 0,
                                    "uplifted": 0,
                                    "creative": 0
                                },
                                "subCatName": {
                                    "en": ""
                                },
                                "subCategoryName": [
                                    ""
                                ],
                                "subSubCatName": {
                                    "en": ""
                                },
                                "subSubCategoryName": [
                                    ""
                                ],
                                "taxes": [],
                                "thirdCategoryId": "",
                                "thirdCategoryName": "",
                                "type": "",
                                "units": [{
                                    "name": {
                                        "en": "100",
                                        "nl": "100"
                                    },
                                    "price": {
                                        "en": "100",
                                        "nl": "100"
                                    },
                                    "floatValue": 100,
                                    "unitId": "5b6ddc44f8016859a04b0922",
                                    "sizeAttributes": [],
                                    "status": "active"
                                }, {
                                    "name": {
                                        "en": "100",
                                        "nl": "100"
                                    },
                                    "price": {
                                        "en": "100",
                                        "nl": "100"
                                    },
                                    "floatValue": 100,
                                    "unitId": "5b6ddc44f8016859a04b0923",
                                    "sizeAttributes": [],
                                    "status": "active"
                                }, {
                                    "name": {
                                        "en": "100",
                                        "nl": "100"
                                    },
                                    "price": {
                                        "en": "100",
                                        "nl": "100"
                                    },
                                    "floatValue": 100,
                                    "unitId": "5b6ddc44f8016859a04b0924",
                                    "sizeAttributes": [],
                                    "status": "active"
                                }],
                                "uomShelfLife": {
                                    "en": "",
                                    "nl": ""
                                },
                                "upc": "",
                                "upcName": {
                                    "en": "",
                                    "nl": ""
                                },
                                "warning": "",
                                "warningName": {
                                    "en": "",
                                    "nl": ""
                                },
                                "weight": "",
                                "width": "",
                                "zoneId": [
                                    "5b573540f80168788164c01c",
                                    "5b573605f80168788164c01d",
                                    "5b57368af80168788164c01e"
                                ],
                                "viewCount": 2,
                                "views": [{
                                    "userId": "5b520dfc6584e1963acfb65e",
                                    "createdBy": "customer",
                                    "timeStamp": 1533926481
                                }],
                                "addedToCart": [{
                                    "userId": "5b520dfc6584e1963acfb65e",
                                    "unitId": "5b6ddc44f8016859a04b0922",
                                    "createdBy": "customer",
                                    "timeStamp": 1533926495,
                                    "isoDate": "2018-08-10T18:41:35.957Z"
                                }],
                                "addedToCartCount": 2,
                                "ordered": [{
                                    "userId": "5b520dfc6584e1963acfb65e",
                                    "orderId": 1534020671492,
                                    "createdBy": "customer",
                                    "timeStamp": 1534020671,
                                    "isoDate": "2018-08-11T20:51:11.497Z"
                                }],
                                "orderedCount": 1

                            }]


                        )
                    },
                    400: {
                        message: Joi.any().default(i18n.__('products')['400'])
                    },
                    404: {
                        message: Joi.any().default(i18n.__('products')['404'])
                    },
                    500: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                    }
                }
            },
        },
        /** @memberof manager */
        handler: product.handler,
    }
]