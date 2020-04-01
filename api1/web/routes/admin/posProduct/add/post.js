'use strict'

var childProducts = require('../../../../../models/childProducts');
var firstCategory = require('../../../../../models/firstCategory');
var stores = require('../../../../../models/stores');
var storesElastic = require('../../../../../models/storeElastic');
var childProductsElastic = require('../../../../../models/childProductsElastic');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Async = require('async');

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {


    Async.each(request.payload.data, function (item, callback) {

        childProducts.get({}, (err, result) => {


        let seqId = (typeof result.seqId == "undefined" || result.seqId == null) ? 1 : result.seqId + 1;


        let data = {
            "productName": [
                item.productName
            ],
            "firstCategoryId": item.firstCategoryId,
            "secondCategoryId": item.secondCategoryId || "",
            "thirdCategoryId": item.thirdCategoryId || "",
            "firstCategoryName": item.firstCategoryName,
            "secondCategoryName": item.secondCategoryName || "",
            "thirdCategoryName": item.thirdCategoryName || "",
            "sku": item.sku || "",
            "barcode": item.barcode || "",
            "shortDescription": item.shortDescription || "",
            "detailedDescription": item.detailedDescription || "",
            "POSName": item.POSName || "",
            "barcodeFormat": item.barcodeFormat || "",
            "THC": item.THC || "",
            "CBD": item.CBD || "",
            "units": item.units || "",
            "strainEffects": item.strainEffects || {},
            "medicalAttributes": item.medicalAttributes || {},
            "negativeAttributes": item.negativeAttributes || {},
            "flavours": item.flavours || {},
            "images": item.images || [],
            "type": "",
            "upc": "",
            "mpn": "",
            "model": "",
            "shelflifeuom": "",
            "storageTemperature": "",
            "storageTemperatureUOM": "",
            "warning": "",
            "allergyInformation": "",
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
            "container": "",
            "size": "",
            "sizeUom": "",
            "servingsPerContainer": "",
            "height": "",
            "width": "",
            "length": "",
            "weight": "",
            "genre": "",
            "label": "",
            "artist": "",
            "actor": "",
            "director": "",
            "clothingSize": "",
            "color": "",
            "features": "",
            "manufacturer": "",
            "brand": "",
            "publisher": "",
            "author": "",
            "currentDate": moment().format('YYYY-MM-DD HH:mm:ss'),
            "seqId": seqId,
            "storeId": item.storeData,
            "parentProductId": "",
            "itemKey": "",
            "fileName": "",
            "status": 1,
            "productPosId" : item.POSId
        }

      
          childProducts.insert(data, (err, result) => {
  //             result.ops[0].storeId = String(result.ops[0].storeId);
              // childProductsElastic.Insert(result.ops[0], (err, resultelastic) => {
//             //     if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[0] }).code(500);

//             //     return reply({ message: error['products']['200'][0], data: resultelastic }).code(200);
//             // })
              callback();
          })



                   })

    }, function(err){
            if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[0] }).code(500);

             return reply({ message: error['products']['200'][0], data : {} } ).code(200);


    })

   

};


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
   
    data: Joi.any().required().description("data")

    // productType: Joi.string().required().description('Mandatory field. Type of the product').error(new Error('Product type is missing')),
    // storeId: Joi.string().required().description('Mandatory Field. Id of the store').error(new Error('Store id is missing')),
    // productName: Joi.string().required().description('Mandatory Field. Name of the product').error(new Error('productName is missing')),
    // barcode: Joi.any().required().description('SKU for the product').allow('').error(new Error('barcode is missing')),
    // barcodeFormat: Joi.string().allow('').description('Barcode format').error(new Error('barcodeFormat is missing')),
    // firstCategoryId: Joi.string().required().description('Mandatory Field. First category id of the product').error(new Error('firstCategoryId is missing')),
    // secondCategoryId: Joi.string().allow('').description('Second category id of the product').error(new Error('secondCategoryId is missing')),
    // thirdCategoryId: Joi.string().allow('').description('Third category id of the product').error(new Error('secondCategoryId is missing')),
    // firstCategoryName: Joi.string().description('Name of the first category').error(new Error('firstCategoryName is missing')),
    // secondCategoryName: Joi.string().allow('').description('Name of the second category').error(new Error('secondCategoryName is missing')),
    // thirdCategoryName: Joi.string().allow('').description('Name of the third category').error(new Error('Third category id is missing')),
    // sku: Joi.string().required().description('SKU for the product').error(new Error('sku is missing')),
    // shortDescription: Joi.string().required().description('Mandatory Field. A short description about the product').error(new Error('shortDescription is missing')),
    // detailedDescription: Joi.string().allow('').description('Detailed description about the product').error(new Error('detailedDescription is missing')),
    // POSName: Joi.string().description('POS name').allow('').error(new Error('POSName is missing')),
    // POSId: Joi.string().required().description('Product id').error(new Error('Product id is missing')),
    // images: Joi.any().required().description('Images array').error(new Error('Images array')),
    // units: Joi.any().allow('').description('[{"title" : "fhsdhfsdh", "value" : "0.15", "unitId" : "5a61cdd3e0dc3f5e436d635d", "status" : "active", "count": 1 }]').error(new Error('Units are missingg')),
    // brands: Joi.any().allow('').description('Array of brands'),
    // season: Joi.any().allow('').description('Array of season'),
    // THC: Joi.string().allow('').error(new Error('THC is missing')),
    // CBD: Joi.string().allow('').error(new Error('CBD is missing')),
    // strainEffects: Joi.any().allow('').error(new Error('strainEffects is missing')),
    // medicalAttributes: Joi.any().allow('').error(new Error('medicalAttributes is missing')),
    // negativeAttributes: Joi.any().allow('').error(new Error('negativeAttributes is missing')),
    // flavours: Joi.any().allow('').error(new Error('flavours is missing'))

    // _id: Joi.string().required().description('_id'),
    // productName: Joi.array().items().description('productName'),
    // firstCategoryId: Joi.string().required().description('firstCategoryId'),
    // secondCategoryId: Joi.string().allow('').description('secondCategoryId'),
    // thirdCategoryId: Joi.string().allow('').description('thirdCategoryId'),
    // firstCategoryName: Joi.string().required().description('firstCategoryName'),
    // secondCategoryName: Joi.string().allow('').description('secondCategoryName'),
    // thirdCategoryName: Joi.string().allow('').description('thirdCategoryName'),
    // sku: Joi.string().allow('').description('sku'),
    // barcode: Joi.string().required().description('barcode'),
    // shortDescription: Joi.string().required().description('shortDescription'),
    // detailedDescription: Joi.string().allow('').description('detailedDescription'),
    // POSName: Joi.string().allow('').description('POSName'),
    // barcodeFormat: Joi.string().allow('').description('barcodeFormat'),
    // THC: Joi.string().required().description('THC'),
    // CBD: Joi.string().required().description('CBD'),
    // units: Joi.array().items().description('units'),
    // strainEffects: Joi.object().keys().description('strainEffects'),
    // medicalAttributes: Joi.object().keys().description('medicalAttributes'),
    // negativeAttributes: Joi.object().keys().description('negativeAttributes'),
    // flavours: Joi.object().keys().description('flavours'),
    // images: Joi.array().items().description('images'),
    // type: Joi.string().allow('').description('type'),
    // upc: Joi.string().allow('').description('upc'),
    // mpn: Joi.string().allow('').description('mpn'),
    // model: Joi.string().allow('').description('model'),
    // shelflifeuom: Joi.string().allow('').description('shelflifeuom'),
    // storageTemperature: Joi.string().allow('').description('storageTemperature'),
    // storageTemperatureUOM: Joi.string().allow('').description('storageTemperatureUOM'),
    // warning: Joi.string().allow('').description('warning'),
    // allergyInformation: Joi.string().allow('').description('allergyInformation'),
    // nutritionFacts: Joi.object().keys().description('nutritionFacts'),
    // container: Joi.string().allow('').description('container'),
    // size: Joi.string().allow('').description('size'),
    // sizeUom: Joi.string().allow('').description('sizeUom'),
    // servingsPerContainer: Joi.string().allow('').description('servingsPerContainer'),
    // height: Joi.string().allow('').description('height'),
    // width: Joi.string().allow('').description('width'),
    // length: Joi.string().allow('').description('length'),
    // weight: Joi.string().allow('').description('weight'),
    // genre: Joi.string().allow('').description('genre'),
    // label: Joi.string().allow('').description('label'),
    // artist: Joi.string().allow('').description('artist'),
    // actor: Joi.string().allow('').description('actor'),
    // director: Joi.string().allow('').description('director'),
    // clothingSize: Joi.string().allow('').description('clothingSize'),
    // color: Joi.string().allow('').description('color'),
    // features: Joi.string().allow('').description('features'),
    // manufacturer: Joi.string().allow('').description('manufacturer'),
    // brand: Joi.string().allow('').description('brand'),
    // publisher: Joi.string().allow('').description('publisher'),
    // author: Joi.string().allow('').description('author'),
    // currentDate: Joi.string().allow('').description('currentDate'),
    // itemKey: Joi.string().allow('').description('itemKey'),
    // fileName: Joi.string().allow('').description('fileName')

}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }





//  childProducts.get({}, (err, result) => {


//         let seqId = (typeof result.seqId == "undefined" || result.seqId == null) ? 1 : result.seqId + 1;


//         let data = {
//             "productName": [
//                 request.payload.productName
//             ],
//             "firstCategoryId": request.payload.firstCategoryId,
//             "secondCategoryId": request.payload.secondCategoryId,
//             "thirdCategoryId": request.payload.thirdCategoryId,
//             "firstCategoryName": request.payload.firstCategoryName,
//             "secondCategoryName": request.payload.secondCategoryName,
//             "thirdCategoryName": request.payload.thirdCategoryName,
//             "sku": request.payload.sku,
//             "barcode": request.payload.barcode,
//             "shortDescription": request.payload.shortDescription,
//             "detailedDescription": request.payload.detailedDescription,
//             "POSName": request.payload.POSName,
//             "barcodeFormat": request.payload.barcodeFormat,
//             "THC": request.payload.THC,
//             "CBD": request.payload.CBD,
//             "units": request.payload.units,
//             "strainEffects": request.payload.strainEffects || {},
//             "medicalAttributes": request.payload.medicalAttributes || {},
//             "negativeAttributes": request.payload.negativeAttributes || {},
//             "flavours": request.payload.flavours || {},
//             "images": request.payload.images,
//             "type": "",
//             "upc": "",
//             "mpn": "",
//             "model": "",
//             "shelflifeuom": "",
//             "storageTemperature": "",
//             "storageTemperatureUOM": "",
//             "warning": "",
//             "allergyInformation": "",
//             "nutritionFacts": {
//                 "caloriesPerServing": "",
//                 "cholesterolUom": "",
//                 "cholesterolPerServing": "",
//                 "fatCaloriesPerServing": "",
//                 "fibreUom": "",
//                 "fibrePerServing": "",
//                 "sodiumUom": "",
//                 "sodiumPerServing": "",
//                 "proteinUom": "",
//                 "proteinPerServing": "",
//                 "totalFatUom": "",
//                 "totalFatPerServing": "",
//                 "transFatUom": "",
//                 "transFatPerServing": "",
//                 "dvpCholesterol": "",
//                 "dvpCalcium": "",
//                 "dvpIron": "",
//                 "dvpProtein": "",
//                 "dvpSodium": "",
//                 "dvpSaturatedFat": "",
//                 "dvpTotalFat": "",
//                 "dvpVitaminA": "",
//                 "dvpVitaminC": "",
//                 "dvpVitaminD": ""
//             },
//             "container": "",
//             "size": "",
//             "sizeUom": "",
//             "servingsPerContainer": "",
//             "height": "",
//             "width": "",
//             "length": "",
//             "weight": "",
//             "genre": "",
//             "label": "",
//             "artist": "",
//             "actor": "",
//             "director": "",
//             "clothingSize": "",
//             "color": "",
//             "features": "",
//             "manufacturer": "",
//             "brand": "",
//             "publisher": "",
//             "author": "",
//             "currentDate": moment().format('YYYY-MM-DD HH:mm:ss'),
//             "seqId": seqId,
//             "storeId": new ObjectID(request.payload.storeId),
//             "parentProductId": "",
//             "itemKey": "",
//             "fileName": "",
//             "status": 1,
//             "productPosId" : request.payload.POSId
//         }


//         childProducts.insert(data, (err, result) => {
          
//             if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[0] }).code(500);

//             // childProductsElastic.Insert(result.ops[0], (err, resultelastic) => {
//             //     if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[0] }).code(500);

//             //     return reply({ message: error['products']['200'][0], data: resultelastic }).code(200);
//             // })

//              return reply({ message: error['products']['200'][0], data : {} } ).code(200);
//         });

//     });