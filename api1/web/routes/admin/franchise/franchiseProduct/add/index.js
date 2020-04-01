/** @global */
const Joi = require('joi')
/** @namespace */
const product = require('./post');

/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const error = require('../../../../../locales');
/**
* A module that exports  API  routes to hapi server!
* @exports 
*/
module.exports = [
    /**
    * api to add product
    */
    {
        method: 'POST',
        path: '/franchise/product',
        config: {
            tags: ['api', 'franchiseProduct'],
            description: 'Api for adding child products.',
            notes: 'Api for adding child products ',//\n\n "productName" : [ "Cherry Kush" ]\n\n"firstCategoryId" : "5a0eb422e0dc3f06d21fb61d"\n\n"secondCategoryId" : "5a0eca5b85985b60fa3aa31d"\n\n"thirdCategoryId" : "5a716aa7e0dc3f0dcc3081c8"\n\n"firstCategoryName" : "INDICA"\n\n"secondCategoryName" : "Vaporizors"\n\n"thirdCategoryName" : "VAPORIZERS SUB SUB-CATEGORY"\n\n"sku" : "Ch-IN-Va-Va-IqDIhitE5p"\n\n"barcode" : "Cherry Kush1234"\n\n"shortDescription" : "Select Elite elevates your cannabis enjoyment to a higher level with luxuriant terpene-infused distillate in our award winning cartridges. This top-shelf product packs a powerful punch of flavor and potency with our highest concentration of THC."\n\n"detailedDescription" : "Select Elite elevates your cannabis enjoyment to a higher level with luxuriant terpene-infused distillate in our award winning cartridges. This top-shelf product packs a powerful punch of flavor and potency with our highest concentration of THC."\n\n"POSName" : "Cherry Kush_"\n\n"barcodeFormat" : "String"\n\n"THC" : "85"\n\n"CBD" : "0"\n\n"units" : [{"title" : "Small"\n\n"value" : 10.0\n\n"unitId" : ObjectId("5a716f33e0dc3f0dcc3081d1")\n\n"status" : "active"}\n\n{"title" : "Medium"\n\n"value" : 15.0\n\n"unitId" : ObjectId("5a716f33e0dc3f0dcc3081d2")\n\n"status" : "active"}\n\n{"title" : "Large"\n\n"value" : 20.0\n\n"unitId" : ObjectId("5a716f33e0dc3f0dcc3081d3")\n\n"status" : "active"}\n\n]\n\n"strainEffects" : {"relaxed" : 23.0,\n\n"happy" : 52.0\n\n"euphoric" : 24.0\n\n"uplifted" : 4.0\n\n"creative" : 56.0}\n\n"medicalAttributes" : {"stress" : 23.0\n\n"depression" : 56.0\n\n"pain" : 24.0\n\n"headaches" : 51.0,\n\n"fatigue" : 2.0}\n\n"negativeAttributes" : {"dryMouth" : 6.0\n\n"dryEyes" : 23.0\n\n"anxious" : 35.0\n\n"paranoid" : 7.0\n\n"dizzy" : 24.0}\n\n"flavours" : {"flavour1" : "Amounts are averages, individual items may vary.",\n\n "flavour2" : "",\n\n"flavour3" : ""}\n\n"images" : [ {"thumbnail" : " http://s3.amazonaws.com/grocer/thumb_1517383470867_Select_Indica_Cherry_Kush_Menu.jpg"\n\n"mobile" : " http://s3.amazonaws.com/grocer/mobile_1517383470867_Select_Indica_Cherry_Kush_Menu.jpg","image" : " http://s3.amazonaws.com/grocer/1517383470867_Select_Indica_Cherry_Kush_Menu.jpg",\n\n"imageid" : ObjectId("5a716f33e0dc3f0dcc3081d4")\n\n"imageText":"string"\n\n"title":"string"\n\n"description":"string"\n\n"keyword":"string"}]\n\n"type" : "(String)"\n\n"upc" : "(String)"\n\n"mpn" : "(String)"\n\n"model" : "(String)"\n\n"shelflifeuom" : "(String)"\n\n"storageTemperature" : "(String)"\n\n"storageTemperatureUOM" : "(String)"\n\n"warning" : "(String)"\n\n"allergyInformation" : "(String)"\n\n"nutritionFacts" : {        "caloriesPerServing" : "",\n\n"cholesterolUom" : "",\n\n"cholesterolPerServing" : "",\n\n"fatCaloriesPerServing" : "",\n\n"fibreUom" : "",\n\n"fibrePerServing" : "",\n\n"sodiumUom" : "",\n\n"sodiumPerServing" : "",\n\n"proteinUom" : "",\n\n"proteinPerServing" : "",\n\n"totalFatUom" : "",\n\n"totalFatPerServing" : "",\n\n"transFatUom" : "",\n\n"transFatPerServing" : "",\n\n"dvpCholesterol" : "",\n\n"dvpCalcium" : "",\n\n"dvpIron" : "",\n\n"dvpProtein" : "",\n\n"dvpSodium" : "",\n\n"dvpSaturatedFat" : "",\n\n"dvpTotalFat" : "",\n\n"dvpVitaminA" : "",\n\n"dvpVitaminC" : "",\n\n"dvpVitaminD" : ""    },\n\n"container" : ""\n\n"size" : ""\n\n"sizeUom" : ""\n\n"servingsPerContainer" : ""\n\n"height" : ""\n\n"width" : ""\n\n"length" : ""\n\n"weight" : ""\n\n"genre" : ""\n\n"label" : ""\n\n"artist" : ""\n\n"actor" : ""\n\n"director" : ""\n\n"clothingSize" : ""\n\n"color" : ""\n\n"features" : ""\n\n"manufacturer" : ""\n\n"brand" : ""\n\n"publisher" : ""\n\n"author" : ""\n\n"currentDate" : "2018-1-31 12:54:34"\n\n"storeId":"string"\n\n"parentProductId":"string"\n\n"itemKey":"string"\n\n"fileName":"string"\n\n',
            auth: false,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'json'
                }
            },
            validate: {
                /** @memberof validator */
                payload: product.validator,
                /** @memberof language */
                //  headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: error['products']['200'], data: Joi.any().example({

                        })
                    },
                    400: { message: error['products']['400'] },
                    500: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['500']), data: Joi.any().example({

                        })
                    }
                }
            }
        },
        /** @memberof manager */
        handler: product.handler,
    }
]