
'use strict';

/** @global */
const headerValidator = require('../../../middleware/validator');
const Joi = require('joi');
const testHandlerTurf = require('./post');
/** @namespace */
const i18n = require('../../../../locales/locales');

module.exports = [
    {
        method: 'GET',
        path: '/storeByStoreType/{storeType}/{latitude}/{longitude}',
        config: {// "tags" enable swagger to document API
            tags: ['api', 'store'],
            description: 'turf to check in zone or not',
            notes: "This api is used to get the zone id by lat and long", // We use Joi plugin to validate request
            // auth: false,
            auth: {
                strategies: ['AdminJWT', 'guestJWT']
            },
            validate: {
                /** @memberof nearestZones */
                // payload: testHandlerTurf.payload,
                params: testHandlerTurf.validator,
                /** @memberof headerValidator */
                // headers: headerValidator.language,
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('checkOperationZone')['200']),
                        data: Joi.any().example({
                            "_id": "5b7bf3fbf801683f1b14b3f6",
                            "city": "Bengaluru",
                            "currency": "INR",
                            "currencySymbol": "₹",
                            "mileageMetric": "0",
                            "weightMetric": "0",
                            "title": "Bengaluru-NORTH",
                            "zoneId": "5b7bf3fbf801683f1b14b3f6",
                            "cityId": "5b7aa229f801686e31123eb3"
                        }),
                        categoryData: Joi.any().example(

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
                                "availableInCities": ["5af45724f5a599527c31f68d", "5b4c7825f8016878841a09d4",],
                                "fileName": "/var/www/html/flexyAdmin/grocer_admin2.0_admin_flexy/Superadmin/../xml/5af35059f5a599016e366533.xml",
                                "colorCode": "7cb813",
                                "categoryName": "Boodschappen",
                                "catTypeGif": ""
                            }]
                        ),
                        storeData: Joi.any().example(

                            [{
                                "storeName": "Central Market",
                                "storeDescription": "",
                                "bannerImage": "https://images.deliv-x.com/banner/storeBanner/file2019426151342.png",
                                "logoImage": "https://images.deliv-x.com/logo/storeLogo/file2019426151339.png",
                                "type": 1,
                                "typeMsg": "",
                                "storeId": "5cc1c03f8422135d530b1baa",
                                "franchiseId": "",
                                "franchiseName": "",
                                "distanceMiles": 1.83,
                                "distanceKm": 2.94,
                                "distance": 2.94,
                                "storeTypeMsg": "Grocery",
                                "storeType": 2,
                                "cartsAllowed": 2,
                                "cartsAllowedMsg": "SinglecartMultiplestore",
                                "freeDeliveryAbove": "200.00",
                                "minimumOrder": "100.00",
                                "storeBillingAddr": "2, New BEL Road, RMV 2nd Stage, Jaladarsini Layout, Devasandra, Bengaluru, Karnataka 560054, India",
                                "storeAddr": "2, New BEL Road, RMV 2nd Stage, Jaladarsini Layout, Devasandra, Bengaluru, Karnataka 560054, India",
                                "streetName": "New BEL Road",
                                "localityName": "Jaladarsini Layout",
                                "areaName": "Sanjaynagar",
                                "addressCompo": {},
                                "storeOffer": 0,
                                "offerId": "",
                                "offerTitle": "",
                                "offerBanner": "",
                                "foodType": 1,
                                "foodTypeName": "VEG",
                                "costForTwo": 0,
                                "avgDeliveryTime": "15",
                                "averageRating": 0,
                                "storeSubCats": [],
                                "nextCloseTime": 1556562540,
                                "nextOpenTime": 0,
                                "storeIsOpen": true
                            }]
                        )
                    },
                    404: { message: Joi.any().default(i18n.__('checkOperationZone')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        handler: testHandlerTurf.APIHandler
    }
]