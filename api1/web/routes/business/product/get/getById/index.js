/** @global */
const headerValidator = require('../../../../../middleware/validator');
/** @namespace */
const getProductDetails = require('./get');
/** @namespace */
const i18n = require('../../../../../../locales/locales');/** @global */
const Joi = require('joi')
/**
 * A module that exports business API  routes to hapi server!
 * @exports BUSINESS-PRODUCT-API-ROUTES 
 */
module.exports = [{
    method: 'GET',
    path: '/business/productDetails/{productId}/{latitude}/{longitude}',
    config: {
        tags: ['api', 'business'],
        description: 'Get product details API',
        notes: 'Get product details based on product id.',
        // auth: 'guestJWT',
        auth: {
            strategies: ['guestJWT', 'customerJWT']
        },
        validate: {
            /** @memberof getProductDetails */
            params: getProductDetails.validator,
            /** @memberof headerValidator */
            headers: headerValidator.headerAuthValidator,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        response: {
            status: {
                200: {
                    message: Joi.any().default(i18n.__('stores')['200']),
                    data: Joi.any().example({
                        "storeId": "5b7acf9e891e366e55e5fba5",
                        "productName": "Chicken Sausage Pizza (Personal)",
                        "sku": "Ch-Pi-No-No-rIotXAkFXe",
                        "shortDescription": "Cheesy sausage & onion.",
                        "detailedDescription": "",
                        "THC": "0",
                        "CBD": "0",
                        "units": [{
                            "unitId": "5b7c00b7f8016807815556c5",
                            "status": "active",
                            "floatValue": 195,
                            "appliedDiscount": 0,
                            "offerId": "",
                            "title": "1",
                            "value": 195,
                            "finalPrice": 195
                        }],
                        "ingredients": "",
                        "nutritionFactsInfo": {
                            "servingPerCalories": {
                                "en": "",
                                "keyName": {
                                    "en": "Servings per calories"
                                }
                            },
                            "uomCholesterol": {
                                "en": "",
                                "keyName": {
                                    "en": "Cholesterol"
                                }
                            },
                            "servingPerCholesterol": {
                                "en": "",
                                "keyName": {
                                    "en": "Cholesterol per serving"
                                }
                            },
                            "servingPerFatCalories": {
                                "en": "",
                                "keyName": {
                                    "en": "Fat-calories per serving"
                                }
                            },
                            "uomFibre": {
                                "en": "",
                                "keyName": {
                                    "en": "Fibre"
                                }
                            },
                            "servingPerFibre": {
                                "en": "",
                                "keyName": {
                                    "en": "Fibre per serving"
                                }
                            },
                            "uomSodium": {
                                "en": "",
                                "keyName": {
                                    "en": "Sodium"
                                }
                            },
                            "sodiumPerServing": {
                                "en": "",
                                "keyName": {
                                    "en": "Sodium per serving"
                                }
                            },
                            "uomProtein": {
                                "en": "",
                                "keyName": {
                                    "en": "Protein"
                                }
                            },
                            "servingPerProtein": {
                                "en": "",
                                "keyName": {
                                    "en": "Protein per serving"
                                }
                            },
                            "uomTotalFat": {
                                "en": "",
                                "keyName": {
                                    "en": "Total-fat"
                                }
                            },
                            "servingPerTotalFat": {
                                "en": "",
                                "keyName": {
                                    "en": "Total-fat per serving"
                                }
                            },
                            "uomTransFat": {
                                "en": "",
                                "keyName": {
                                    "en": "Trans-fat"
                                }
                            },
                            "servingPerTransFat": {
                                "en": "",
                                "keyName": {
                                    "en": "Trans-fat per serving"
                                }
                            },
                            "cholesterolDVP": {
                                "en": "",
                                "keyName": {
                                    "en": "DVP Cholesterol"
                                }
                            },
                            "calciumDVP": {
                                "en": "",
                                "keyName": {
                                    "en": "DVP Calcium"
                                }
                            },
                            "ironDVP": {
                                "en": "",
                                "keyName": {
                                    "en": "DVP Iron"
                                }
                            },
                            "sodiumDVP": {
                                "en": "",
                                "keyName": {
                                    "en": "DVP Sodium"
                                }
                            },
                            "saturatedFatDVP": {
                                "en": "",
                                "keyName": {
                                    "en": "DVP Saturated Fat"
                                }
                            },
                            "totalFatDVP": {
                                "en": "",
                                "keyName": {
                                    "en": "DVP Total Fat"
                                }
                            },
                            "vitaminADvp": {
                                "en": "",
                                "keyName": {
                                    "en": "DVP vitamin A"
                                }
                            },
                            "vitaminCDvp": {
                                "en": "",
                                "keyName": {
                                    "en": "DVP vitamin C"
                                }
                            },
                            "vitaminDDvp": {
                                "en": "",
                                "keyName": {
                                    "en": "DVP vitamin D"
                                }
                            }
                        },
                        "catName": {
                            "en": "Pizza"
                        },
                        "subCatName": {
                            "en": "Non-Veg Pan Pizzas"
                        },
                        "subSubCatName": {
                            "en": "Classic"
                        },
                        "strainEffects": {
                            "relaxed": 0,
                            "happy": 0,
                            "euphoric": 0,
                            "uplifted": 0,
                            "creative": 0
                        },
                        "parentProductId": "5b7bbf0cf801683f1b14b3cd",
                        "taxes": [],
                        "addOns": [{
                            "id": "5b7bfdadf80168038b205dd6",
                            "name": "Toppings",
                            "mandatory": 1,
                            "addOnLimit": 1,
                            "description": "",
                            "addOnGroup": [{
                                "id": "5b7c00b7f8016807815556c7",
                                "name": "Chicken",
                                "price": "25"
                            }, {
                                "id": "5b7c00b7f8016807815556c8",
                                "name": "Jalapenos",
                                "price": "24"
                            }, {
                                "id": "5b7c00b7f8016807815556c9",
                                "name": " Paneer",
                                "price": "23"
                            }, {
                                "id": "5b7c00b7f8016807815556ca",
                                "name": "Capsicum",
                                "price": "27"
                            }, {
                                "id": "5b7c00b7f8016807815556cb",
                                "name": "Onions",
                                "price": "10"
                            }, {
                                "id": "5b7c00b7f8016807815556cc",
                                "name": "Mushrooms",
                                "price": "15"
                            }, {
                                "id": "5b7c00b7f8016807815556cd",
                                "name": " Black Olives",
                                "price": "19"
                            }]
                        }, {
                            "id": "5b7bff97f80168038b205dd7",
                            "name": "Complete Your Meal",
                            "mandatory": 1,
                            "addOnLimit": 1,
                            "description": "",
                            "addOnGroup": [{
                                "id": "5b7c00b7f8016807815556ce",
                                "name": "Fries",
                                "price": "45"
                            }, {
                                "id": "5b7c00b7f8016807815556cf",
                                "name": "Chicken fingers & Fries",
                                "price": "56"
                            }, {
                                "id": "5b7c00b7f8016807815556d0",
                                "name": "Chocolate Milk Shake",
                                "price": "67"
                            }, {
                                "id": "5b7c00b7f8016807815556d1",
                                "name": "Sweet Potato Fries",
                                "price": "24"
                            }]
                        }],
                        "businessName": "Pizza Hut",
                        "businessAddress": "RT Nagar, Bengaluru, Karnataka, India",
                        "businessImage": "http://s3.amazonaws.com/flexyapp/1534775094995_pizza-hut-taps-book-it-literacy--9a4e4d3792.jpg",
                        "bannerImage": "http://s3.amazonaws.com/flexyapp/1534775105341_hut-660x330.jpg",
                        "businessLatitude": 12.983132726989,
                        "businessLongitude": 77.5833,
                        "businessId": "5b7acf9e891e366e55e5fba5",
                        "businessRating": 0,
                        "storeType": 1,
                        "storeTypeMsg": "Restaurant",
                        "addOnAvailable": 1,
                        "additionalEffects": [{
                            "name": "Nutrition Facts",
                            "data": {
                                "Servings per calories": "",
                                "Cholesterol": "",
                                "Cholesterol per serving": "",
                                "Fat-calories per serving": "",
                                "Fibre": "",
                                "Fibre per serving": "",
                                "Sodium": "",
                                "Sodium per serving": "",
                                "Protein": "",
                                "Protein per serving": "",
                                "Total-fat": "",
                                "Total-fat per serving": "",
                                "Trans-fat": "",
                                "Trans-fat per serving": "",
                                "DVP Cholesterol": "",
                                "DVP Calcium": "",
                                "DVP Iron": "",
                                "DVP Sodium": "",
                                "DVP Saturated Fat": "",
                                "DVP Total Fat": "",
                                "DVP vitamin A": "",
                                "DVP vitamin C": "",
                                "DVP vitamin D": ""
                            }
                        }, {
                            "name": "Strain Effects",
                            "data": {
                                "relaxed": 0,
                                "happy": 0,
                                "euphoric": 0,
                                "uplifted": 0,
                                "creative": 0
                            }
                        }],
                        "mobileImage": [{
                            "imageId": "5b7c00b7f8016807815556c6",
                            "thumbnail": " http://s3.amazonaws.com/flexyapp/thumb_1534836462926_1371008.png",
                            "mobile": " http://s3.amazonaws.com/flexyapp/mobile_1534836462926_1371008.png",
                            "image": " http://s3.amazonaws.com/flexyapp/1534836462926_1371008.png",
                            "imageText": "",
                            "title": "",
                            "description": "",
                            "keyword": ""
                        }],
                        "wishList": [],
                        "productId": "5b7c00b7f8016807815556d2",
                        "subCategoryName": "Non-Veg Pan Pizzas",
                        "isFavorite": false,
                        "distanceMiles": 3.7126928722,
                        "distanceKm": 5.975,
                        "estimatedTime": "16 mins"
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
    /** @memberof getProductDetails */
    handler: getProductDetails.handler
}]