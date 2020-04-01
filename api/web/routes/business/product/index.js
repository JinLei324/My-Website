/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const getProducts = require('./get');

/** @namespace */
const getById = require('./get/getById');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi')
/**
 * A module that exports business API  routes to hapi server!
 * @exports BUSINESS-PRODUCT-API-ROUTES 
 */
module.exports = [{
    method: 'GET',
    path: '/business/products/{zoneId}/{categoryId}/{subCategoryId}/{storeId}/{latitude}/{longitude}/{skip}/{limit}',
    config: {
        tags: ['api', 'business'],
        description: 'Get store and products API',
        notes: 'Get products based on nearest store.',
        auth: false,
        validate: {
            /** @memberof getProducts */
            params: getProducts.validator,
            /** @memberof headerValidator */
            headers: headerValidator.language,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: {
                    message: Joi.any().default(i18n.__('stores')['200']),
                    data: Joi.any().example({
                        "storeAddr": "RT Nagar, Bengaluru, Karnataka, India",
                        "storeBillingAddr": "RT Nagar, Bengaluru, Karnataka, India",
                        "businessZoneId": "0",
                        "minimumOrder": "10",
                        "freeDeliveryAbove": "50",
                        "subSubCatWiseProductCount": [{
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bdedcf801683f1b14b3e9",
                            "thirdCategoryId": "5b7bf1e9f8016807815556b6",
                            "count": 1
                        }, {
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bef14f8016807815556b0",
                            "thirdCategoryId": "5b7bf0bbf801683f1b14b3ee",
                            "count": 2
                        }, {
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bf022f8016807815556b4",
                            "thirdCategoryId": "5b7bf052f801683f1b14b3ed",
                            "count": 2
                        }, {
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bf022f8016807815556b4",
                            "thirdCategoryId": "5b7bf085f8016807815556b5",
                            "count": 1
                        }, {
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bdedcf801683f1b14b3e9",
                            "thirdCategoryId": "5b7bf1ccf801683f1b14b3f2",
                            "count": 1
                        }, {
                            "firstCategoryId": "5b7c203bf801685b6701c34d",
                            "secondCategoryId": "5b7c206ef801685c0f3bb1ab",
                            "thirdCategoryId": "5b7c21a1f801685b6701c354",
                            "count": 0
                        }],
                        "businessAddress": "RT Nagar, Bengaluru, Karnataka, India",
                        "distanceMiles": 1.070622563816,
                        "distanceKm": 1.723,
                        "estimatedTime": "8 mins",
                        "businessName": "Marqt",
                        "businessImage": "http://s3.amazonaws.com/flexyapp/1534862694988_marqt1.jpg",
                        "bannerImage": "http://s3.amazonaws.com/flexyapp/1534862701249_marqt1.jpg",
                        "businessLatitude": 13.0195677,
                        "businessLongitude": 77.5968131,
                        "businessId": "5b7c25c2e809bd5f1b6dbbd4",
                        "businessRating": 0,
                        "storeType": 0,
                        "storeTypeMsg": "",
                        "subSubCategories": [{
                            "subCategoryId": "5b7bf022f8016807815556b4",
                            "categoryId": "5b7bdeb0f801683f1b14b3e8",
                            "description": "A potato chip or crisp is a thin slice of potato that has been deep fried or baked until crunchy. Potato chips are A potato chip or crisp is a thin slice of potato that has been deep fried or baked until crunchy. Potato chips are commonly served as a snack, side dish, or appetizer. commonly served as a snack, side dish, or appetizer. ",
                            "imageUrl": "https://s3.amazonaws.com/flexyapp/uploadImage/third_level_category/file2018821162824.jpg",
                            "subSubCategoryName": "Potato Chips",
                            "subSubCategoryId": "5b7bf052f801683f1b14b3ed",
                            "products": [{
                                "storeId": "5b7c25c2e809bd5f1b6dbbd4",
                                "productName": "Lay's Lightly Salted Lay's Lightly Salted Classic Potato Chips",
                                "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                                "secondCategoryId": "5b7bf022f8016807815556b4",
                                "thirdCategoryId": "5b7bf052f801683f1b14b3ed",
                                "firstCategoryName": "Biscuits, Snacks & Chocolates",
                                "secondCategoryName": "Chips & Crisps",
                                "thirdCategoryName": "Potato Chips",
                                "sku": "La-Bi-Ch-Ch-CFXCoBbztC",
                                "brand": "",
                                "THC": "0",
                                "CBD": "0",
                                "upc": "",
                                "categoryName": [
                                    "Biscuits, Snacks & Chocolates"
                                ],
                                "consumptionTime": [],
                                "catName": {
                                    "en": "Biscuits, Snacks & Chocolates"
                                },
                                "parentProductId": "5b7c291df80168642f7a6afb",
                                "addOns": [],
                                "childProductId": "5b7c2977f80168642e7e47a8",
                                "unitId": "5b7c2977f80168642e7e47a3",
                                "unitName": "20g",
                                "priceValue": 35,
                                "appliedDiscount": 0,
                                "finalPrice": 35,
                                "offerId": "",
                                "addOnAvailable": 1,
                                "mobileImage": [{
                                    "imageId": "5b7c2977f80168642e7e47a6",
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863621369_11.JPG",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863621369_11.JPG",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863621369_11.JPG",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }, {
                                    "imageId": "5b7c2977f80168642e7e47a7",
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863632796_12.JPG",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863632796_12.JPG",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863632796_12.JPG",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }]
                            }, {
                                "storeId": "5b7c25c2e809bd5f1b6dbbd4",
                                "productName": "Ruffles Original Potato Chips",
                                "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                                "secondCategoryId": "5b7bf022f8016807815556b4",
                                "thirdCategoryId": "5b7bf052f801683f1b14b3ed",
                                "firstCategoryName": "Biscuits, Snacks & Chocolates;",
                                "secondCategoryName": "Chips & Crisps;",
                                "thirdCategoryName": "Potato Chips;",
                                "sku": "Ru-Bi-Ch-Ch-P1Ma5mdAGu",
                                "brand": "",
                                "THC": "0",
                                "CBD": "0",
                                "upc": "",
                                "categoryName": [
                                    "Biscuits, Snacks & Chocolates",
                                    ""
                                ],
                                "consumptionTime": [],
                                "catName": {
                                    "en": "Biscuits, Snacks & Chocolates",
                                    "nl": ""
                                },
                                "parentProductId": "5b7c27fdf801685c0f3bb1d7",
                                "addOns": [],
                                "childProductId": "5b7c298ff801685c0f3bb1f1",
                                "unitId": "5b7ec065f8016851013c9465",
                                "unitName": "30g",
                                "priceValue": 55,
                                "appliedDiscount": 0,
                                "finalPrice": 55,
                                "offerId": "",
                                "addOnAvailable": 1,
                                "mobileImage": [{
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863335779_81.JPG",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863335779_81.JPG",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863335779_81.JPG",
                                    "imageId": "5b7c298ff801685c0f3bb1ef",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }, {
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863347678_82.JPG",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863347678_82.JPG",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863347678_82.JPG",
                                    "imageId": "5b7c298ff801685c0f3bb1f0",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }]
                            }]
                        }, {
                            "subCategoryId": "5b7bf022f8016807815556b4",
                            "categoryId": "5b7bdeb0f801683f1b14b3e8",
                            "description": "as Zea mays) are cultivated specifically as popping corns. Popcorn, or pop-corn, is a variety of corn kernel, which expands and puffs up when heated. ... Some strains of corn (taxonomized ",
                            "imageUrl": "https://s3.amazonaws.com/flexyapp/uploadImage/third_level_category/file2018821162916.jpg",
                            "subSubCategoryName": "Pop Corns",
                            "subSubCategoryId": "5b7bf085f8016807815556b5",
                            "products": [{
                                "storeId": "5b7c25c2e809bd5f1b6dbbd4",
                                "productName": "G.H. Cretors Popped Corn Just the Cheese Corn",
                                "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                                "secondCategoryId": "5b7bf022f8016807815556b4",
                                "thirdCategoryId": "5b7bf085f8016807815556b5",
                                "firstCategoryName": "Biscuits, Snacks & Chocolates",
                                "secondCategoryName": "Chips & Crisps",
                                "thirdCategoryName": "Pop Corns",
                                "sku": "G.-Bi-Ch-Ch-Y30iAjcU6t",
                                "brand": "",
                                "THC": "0",
                                "CBD": "0",
                                "upc": "",
                                "categoryName": [
                                    "Biscuits, Snacks & Chocolates"
                                ],
                                "consumptionTime": [],
                                "catName": {
                                    "en": "Biscuits, Snacks & Chocolates"
                                },
                                "parentProductId": "5b7c28adf801685c0f3bb1e6",
                                "addOns": [],
                                "childProductId": "5b7c2983f80168642e7e47ae",
                                "unitId": "5b7c2983f80168642e7e47aa",
                                "unitName": "10g",
                                "priceValue": 45,
                                "appliedDiscount": 0,
                                "finalPrice": 45,
                                "offerId": "",
                                "addOnAvailable": 0,
                                "mobileImage": [{
                                    "imageId": "5b7c2983f80168642e7e47ad",
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863526274_10.jpg",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863526274_10.jpg",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863526274_10.jpg",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }]
                            }]
                        }]
                    })
                },
                404: {
                    message: Joi.any().default(i18n.__('stores')['404'])
                },
                500: {
                    message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                }
            }
        }
    },
    /** @memberof getProducts */
    handler: getProducts.handler
}, {
    method: 'GET',
    path: '/business/product/{zoneId}/{storeId}/{timeStamp}/{latitude}/{longitude}/{skip}/{limit}',
    config: {
        tags: ['api', 'business'],
        description: 'Get store and products API',
        notes: 'Get products based on nearest store.',
        // auth: false,
        auth: {
            strategies: ['guestJWT', 'customerJWT']
        },
        validate: {
            /** @memberof getProducts */
            params: getProducts.getProductValidator,
            /** @memberof headerValidator */
            headers: headerValidator.headerAuthValidator,
            // headers: headerValidator.language,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: {
                    message: Joi.any().default(i18n.__('stores')['200']),
                    data: Joi.any().example({
                        "storeAddr": "RT Nagar, Bengaluru, Karnataka, India",
                        "storeBillingAddr": "RT Nagar, Bengaluru, Karnataka, India",
                        "businessZoneId": "0",
                        "minimumOrder": "10",
                        "freeDeliveryAbove": "50",
                        "subSubCatWiseProductCount": [{
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bdedcf801683f1b14b3e9",
                            "thirdCategoryId": "5b7bf1e9f8016807815556b6",
                            "count": 1
                        }, {
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bef14f8016807815556b0",
                            "thirdCategoryId": "5b7bf0bbf801683f1b14b3ee",
                            "count": 2
                        }, {
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bf022f8016807815556b4",
                            "thirdCategoryId": "5b7bf052f801683f1b14b3ed",
                            "count": 2
                        }, {
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bf022f8016807815556b4",
                            "thirdCategoryId": "5b7bf085f8016807815556b5",
                            "count": 1
                        }, {
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bdedcf801683f1b14b3e9",
                            "thirdCategoryId": "5b7bf1ccf801683f1b14b3f2",
                            "count": 1
                        }, {
                            "firstCategoryId": "5b7c203bf801685b6701c34d",
                            "secondCategoryId": "5b7c206ef801685c0f3bb1ab",
                            "thirdCategoryId": "5b7c21a1f801685b6701c354",
                            "count": 0
                        }],
                        "businessAddress": "RT Nagar, Bengaluru, Karnataka, India",
                        "distanceMiles": 1.070622563816,
                        "distanceKm": 1.723,
                        "estimatedTime": "8 mins",
                        "businessName": "Marqt",
                        "businessImage": "http://s3.amazonaws.com/flexyapp/1534862694988_marqt1.jpg",
                        "bannerImage": "http://s3.amazonaws.com/flexyapp/1534862701249_marqt1.jpg",
                        "businessLatitude": 13.0195677,
                        "businessLongitude": 77.5968131,
                        "businessId": "5b7c25c2e809bd5f1b6dbbd4",
                        "businessRating": 0,
                        "storeType": 0,
                        "storeTypeMsg": "",
                        "subSubCategories": [{
                            "subCategoryId": "5b7bf022f8016807815556b4",
                            "categoryId": "5b7bdeb0f801683f1b14b3e8",
                            "description": "A potato chip or crisp is a thin slice of potato that has been deep fried or baked until crunchy. Potato chips are A potato chip or crisp is a thin slice of potato that has been deep fried or baked until crunchy. Potato chips are commonly served as a snack, side dish, or appetizer. commonly served as a snack, side dish, or appetizer. ",
                            "imageUrl": "https://s3.amazonaws.com/flexyapp/uploadImage/third_level_category/file2018821162824.jpg",
                            "subSubCategoryName": "Potato Chips",
                            "subSubCategoryId": "5b7bf052f801683f1b14b3ed",
                            "products": [{
                                "storeId": "5b7c25c2e809bd5f1b6dbbd4",
                                "productName": "Lay's Lightly Salted Lay's Lightly Salted Classic Potato Chips",
                                "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                                "secondCategoryId": "5b7bf022f8016807815556b4",
                                "thirdCategoryId": "5b7bf052f801683f1b14b3ed",
                                "firstCategoryName": "Biscuits, Snacks & Chocolates",
                                "secondCategoryName": "Chips & Crisps",
                                "thirdCategoryName": "Potato Chips",
                                "sku": "La-Bi-Ch-Ch-CFXCoBbztC",
                                "brand": "",
                                "THC": "0",
                                "CBD": "0",
                                "upc": "",
                                "categoryName": [
                                    "Biscuits, Snacks & Chocolates"
                                ],
                                "consumptionTime": [],
                                "catName": {
                                    "en": "Biscuits, Snacks & Chocolates"
                                },
                                "parentProductId": "5b7c291df80168642f7a6afb",
                                "addOns": [],
                                "childProductId": "5b7c2977f80168642e7e47a8",
                                "unitId": "5b7c2977f80168642e7e47a3",
                                "unitName": "20g",
                                "priceValue": 35,
                                "appliedDiscount": 0,
                                "finalPrice": 35,
                                "offerId": "",
                                "addOnAvailable": 1,
                                "mobileImage": [{
                                    "imageId": "5b7c2977f80168642e7e47a6",
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863621369_11.JPG",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863621369_11.JPG",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863621369_11.JPG",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }, {
                                    "imageId": "5b7c2977f80168642e7e47a7",
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863632796_12.JPG",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863632796_12.JPG",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863632796_12.JPG",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }]
                            }, {
                                "storeId": "5b7c25c2e809bd5f1b6dbbd4",
                                "productName": "Ruffles Original Potato Chips",
                                "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                                "secondCategoryId": "5b7bf022f8016807815556b4",
                                "thirdCategoryId": "5b7bf052f801683f1b14b3ed",
                                "firstCategoryName": "Biscuits, Snacks & Chocolates;",
                                "secondCategoryName": "Chips & Crisps;",
                                "thirdCategoryName": "Potato Chips;",
                                "sku": "Ru-Bi-Ch-Ch-P1Ma5mdAGu",
                                "brand": "",
                                "THC": "0",
                                "CBD": "0",
                                "upc": "",
                                "categoryName": [
                                    "Biscuits, Snacks & Chocolates",
                                    ""
                                ],
                                "consumptionTime": [],
                                "catName": {
                                    "en": "Biscuits, Snacks & Chocolates",
                                    "nl": ""
                                },
                                "parentProductId": "5b7c27fdf801685c0f3bb1d7",
                                "addOns": [],
                                "childProductId": "5b7c298ff801685c0f3bb1f1",
                                "unitId": "5b7ec065f8016851013c9465",
                                "unitName": "30g",
                                "priceValue": 55,
                                "appliedDiscount": 0,
                                "finalPrice": 55,
                                "offerId": "",
                                "addOnAvailable": 1,
                                "mobileImage": [{
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863335779_81.JPG",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863335779_81.JPG",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863335779_81.JPG",
                                    "imageId": "5b7c298ff801685c0f3bb1ef",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }, {
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863347678_82.JPG",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863347678_82.JPG",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863347678_82.JPG",
                                    "imageId": "5b7c298ff801685c0f3bb1f0",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }]
                            }]
                        }, {
                            "subCategoryId": "5b7bf022f8016807815556b4",
                            "categoryId": "5b7bdeb0f801683f1b14b3e8",
                            "description": "as Zea mays) are cultivated specifically as popping corns. Popcorn, or pop-corn, is a variety of corn kernel, which expands and puffs up when heated. ... Some strains of corn (taxonomized ",
                            "imageUrl": "https://s3.amazonaws.com/flexyapp/uploadImage/third_level_category/file2018821162916.jpg",
                            "subSubCategoryName": "Pop Corns",
                            "subSubCategoryId": "5b7bf085f8016807815556b5",
                            "products": [{
                                "storeId": "5b7c25c2e809bd5f1b6dbbd4",
                                "productName": "G.H. Cretors Popped Corn Just the Cheese Corn",
                                "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                                "secondCategoryId": "5b7bf022f8016807815556b4",
                                "thirdCategoryId": "5b7bf085f8016807815556b5",
                                "firstCategoryName": "Biscuits, Snacks & Chocolates",
                                "secondCategoryName": "Chips & Crisps",
                                "thirdCategoryName": "Pop Corns",
                                "sku": "G.-Bi-Ch-Ch-Y30iAjcU6t",
                                "brand": "",
                                "THC": "0",
                                "CBD": "0",
                                "upc": "",
                                "categoryName": [
                                    "Biscuits, Snacks & Chocolates"
                                ],
                                "consumptionTime": [],
                                "catName": {
                                    "en": "Biscuits, Snacks & Chocolates"
                                },
                                "parentProductId": "5b7c28adf801685c0f3bb1e6",
                                "addOns": [],
                                "childProductId": "5b7c2983f80168642e7e47ae",
                                "unitId": "5b7c2983f80168642e7e47aa",
                                "unitName": "10g",
                                "priceValue": 45,
                                "appliedDiscount": 0,
                                "finalPrice": 45,
                                "offerId": "",
                                "addOnAvailable": 1,
                                "mobileImage": [{
                                    "imageId": "5b7c2983f80168642e7e47ad",
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863526274_10.jpg",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863526274_10.jpg",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863526274_10.jpg",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }]
                            }]
                        }]
                    })
                },
                404: {
                    message: Joi.any().default(i18n.__('stores')['404'])
                },
                500: {
                    message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                }
            }
        }
    },
    /** @memberof getProducts */
    handler: getProducts.handlerNew
},{
    method: 'GET',
    path: '/products/{categoryId}/{subCategoryId}/{storeId}/{skip}/{limit}',
    config: {
        tags: ['api', 'business'],
        description: 'Get store and products API',
        notes: 'Get products based on nearest store.',
        auth: false,
        validate: {
            /* @memberof getProducts */
            params: getProducts.productValidator,
            /* @memberof headerValidator */
            headers: headerValidator.language,
            /* @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: {
                    message: Joi.any().default(i18n.__('stores')['200']),
                    data: Joi.any().example({
                        "storeAddr": "RT Nagar, Bengaluru, Karnataka, India",
                        "storeBillingAddr": "RT Nagar, Bengaluru, Karnataka, India",
                        "businessZoneId": "0",
                        "minimumOrder": "10",
                        "freeDeliveryAbove": "50",
                        "subSubCatWiseProductCount": [{
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bdedcf801683f1b14b3e9",
                            "thirdCategoryId": "5b7bf1e9f8016807815556b6",
                            "count": 1
                        }, {
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bef14f8016807815556b0",
                            "thirdCategoryId": "5b7bf0bbf801683f1b14b3ee",
                            "count": 2
                        }, {
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bf022f8016807815556b4",
                            "thirdCategoryId": "5b7bf052f801683f1b14b3ed",
                            "count": 2
                        }, {
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bf022f8016807815556b4",
                            "thirdCategoryId": "5b7bf085f8016807815556b5",
                            "count": 1
                        }, {
                            "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                            "secondCategoryId": "5b7bdedcf801683f1b14b3e9",
                            "thirdCategoryId": "5b7bf1ccf801683f1b14b3f2",
                            "count": 1
                        }, {
                            "firstCategoryId": "5b7c203bf801685b6701c34d",
                            "secondCategoryId": "5b7c206ef801685c0f3bb1ab",
                            "thirdCategoryId": "5b7c21a1f801685b6701c354",
                            "count": 0
                        }],
                        "businessAddress": "RT Nagar, Bengaluru, Karnataka, India",
                        "distanceMiles": 1.070622563816,
                        "distanceKm": 1.723,
                        "estimatedTime": "8 mins",
                        "businessName": "Marqt",
                        "businessImage": "http://s3.amazonaws.com/flexyapp/1534862694988_marqt1.jpg",
                        "bannerImage": "http://s3.amazonaws.com/flexyapp/1534862701249_marqt1.jpg",
                        "businessLatitude": 13.0195677,
                        "businessLongitude": 77.5968131,
                        "businessId": "5b7c25c2e809bd5f1b6dbbd4",
                        "businessRating": 0,
                        "storeType": 0,
                        "storeTypeMsg": "",
                        "subSubCategories": [{
                            "subCategoryId": "5b7bf022f8016807815556b4",
                            "categoryId": "5b7bdeb0f801683f1b14b3e8",
                            "description": "A potato chip or crisp is a thin slice of potato that has been deep fried or baked until crunchy. Potato chips are A potato chip or crisp is a thin slice of potato that has been deep fried or baked until crunchy. Potato chips are commonly served as a snack, side dish, or appetizer. commonly served as a snack, side dish, or appetizer. ",
                            "imageUrl": "https://s3.amazonaws.com/flexyapp/uploadImage/third_level_category/file2018821162824.jpg",
                            "subSubCategoryName": "Potato Chips",
                            "subSubCategoryId": "5b7bf052f801683f1b14b3ed",
                            "products": [{
                                "storeId": "5b7c25c2e809bd5f1b6dbbd4",
                                "productName": "Lay's Lightly Salted Lay's Lightly Salted Classic Potato Chips",
                                "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                                "secondCategoryId": "5b7bf022f8016807815556b4",
                                "thirdCategoryId": "5b7bf052f801683f1b14b3ed",
                                "firstCategoryName": "Biscuits, Snacks & Chocolates",
                                "secondCategoryName": "Chips & Crisps",
                                "thirdCategoryName": "Potato Chips",
                                "sku": "La-Bi-Ch-Ch-CFXCoBbztC",
                                "brand": "",
                                "THC": "0",
                                "CBD": "0",
                                "upc": "",
                                "categoryName": [
                                    "Biscuits, Snacks & Chocolates"
                                ],
                                "consumptionTime": [],
                                "catName": {
                                    "en": "Biscuits, Snacks & Chocolates"
                                },
                                "parentProductId": "5b7c291df80168642f7a6afb",
                                "addOns": [],
                                "childProductId": "5b7c2977f80168642e7e47a8",
                                "unitId": "5b7c2977f80168642e7e47a3",
                                "unitName": "20g",
                                "priceValue": 35,
                                "appliedDiscount": 0,
                                "finalPrice": 35,
                                "offerId": "",
                                "addOnAvailable": 1,
                                "mobileImage": [{
                                    "imageId": "5b7c2977f80168642e7e47a6",
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863621369_11.JPG",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863621369_11.JPG",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863621369_11.JPG",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }, {
                                    "imageId": "5b7c2977f80168642e7e47a7",
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863632796_12.JPG",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863632796_12.JPG",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863632796_12.JPG",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }]
                            }, {
                                "storeId": "5b7c25c2e809bd5f1b6dbbd4",
                                "productName": "Ruffles Original Potato Chips",
                                "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                                "secondCategoryId": "5b7bf022f8016807815556b4",
                                "thirdCategoryId": "5b7bf052f801683f1b14b3ed",
                                "firstCategoryName": "Biscuits, Snacks & Chocolates;",
                                "secondCategoryName": "Chips & Crisps;",
                                "thirdCategoryName": "Potato Chips;",
                                "sku": "Ru-Bi-Ch-Ch-P1Ma5mdAGu",
                                "brand": "",
                                "THC": "0",
                                "CBD": "0",
                                "upc": "",
                                "categoryName": [
                                    "Biscuits, Snacks & Chocolates",
                                    ""
                                ],
                                "consumptionTime": [],
                                "catName": {
                                    "en": "Biscuits, Snacks & Chocolates",
                                    "nl": ""
                                },
                                "parentProductId": "5b7c27fdf801685c0f3bb1d7",
                                "addOns": [],
                                "childProductId": "5b7c298ff801685c0f3bb1f1",
                                "unitId": "5b7ec065f8016851013c9465",
                                "unitName": "30g",
                                "priceValue": 55,
                                "appliedDiscount": 0,
                                "finalPrice": 55,
                                "offerId": "",
                                "addOnAvailable": 1,
                                "mobileImage": [{
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863335779_81.JPG",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863335779_81.JPG",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863335779_81.JPG",
                                    "imageId": "5b7c298ff801685c0f3bb1ef",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }, {
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863347678_82.JPG",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863347678_82.JPG",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863347678_82.JPG",
                                    "imageId": "5b7c298ff801685c0f3bb1f0",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }]
                            }]
                        }, {
                            "subCategoryId": "5b7bf022f8016807815556b4",
                            "categoryId": "5b7bdeb0f801683f1b14b3e8",
                            "description": "as Zea mays) are cultivated specifically as popping corns. Popcorn, or pop-corn, is a variety of corn kernel, which expands and puffs up when heated. ... Some strains of corn (taxonomized ",
                            "imageUrl": "https://s3.amazonaws.com/flexyapp/uploadImage/third_level_category/file2018821162916.jpg",
                            "subSubCategoryName": "Pop Corns",
                            "subSubCategoryId": "5b7bf085f8016807815556b5",
                            "products": [{
                                "storeId": "5b7c25c2e809bd5f1b6dbbd4",
                                "productName": "G.H. Cretors Popped Corn Just the Cheese Corn",
                                "firstCategoryId": "5b7bdeb0f801683f1b14b3e8",
                                "secondCategoryId": "5b7bf022f8016807815556b4",
                                "thirdCategoryId": "5b7bf085f8016807815556b5",
                                "firstCategoryName": "Biscuits, Snacks & Chocolates",
                                "secondCategoryName": "Chips & Crisps",
                                "thirdCategoryName": "Pop Corns",
                                "sku": "G.-Bi-Ch-Ch-Y30iAjcU6t",
                                "brand": "",
                                "THC": "0",
                                "CBD": "0",
                                "upc": "",
                                "categoryName": [
                                    "Biscuits, Snacks & Chocolates"
                                ],
                                "consumptionTime": [],
                                "catName": {
                                    "en": "Biscuits, Snacks & Chocolates"
                                },
                                "parentProductId": "5b7c28adf801685c0f3bb1e6",
                                "addOns": [],
                                "childProductId": "5b7c2983f80168642e7e47ae",
                                "unitId": "5b7c2983f80168642e7e47aa",
                                "unitName": "10g",
                                "priceValue": 45,
                                "appliedDiscount": 0,
                                "finalPrice": 45,
                                "offerId": "",
                                "addOnAvailable": 1,
                                "mobileImage": [{
                                    "imageId": "5b7c2983f80168642e7e47ad",
                                    "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534863526274_10.jpg",
                                    "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534863526274_10.jpg",
                                    "image": " http://s3.amazonaws.com/flexyapp/1534863526274_10.jpg",
                                    "imageText": "",
                                    "title": "",
                                    "description": "",
                                    "keyword": ""
                                }]
                            }]
                        }]
                    })
                },
                404: {
                    message: Joi.any().default(i18n.__('stores')['404'])
                },
                500: {
                    message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                }
            }
        }
    },
    handler: getProducts.productHandler
}

].concat(getById);