'use strict'

var childProducts = require('../../../../../models/childProducts');
var childProductsElastic = require('../../../../../models/childProductsElastic');
var stores = require('../../../../../models/stores');
var storesElastic = require('../../../../../models/storeElastic');
const error = require('../../../../../statusMessages/responseMessage');   // response messages based on language 
var inventoryMethod = require('../../../../commonModels/inventory');
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Async = require('async');

/** salesforce
* @library 
* @author Umesh Beti
*/
const superagent = require('superagent');
const salesforce = require('../../../../../library/salesforce');

/*salesforce*/
const handler = (request, reply) => {

    let productId = new ObjectID(request.payload.productId)
    let salesforceProdcutId = request.payload.productId;
    childProducts.getOne({ "_id": productId }, (err, result) => {
        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        if (result === null)
            return reply({ message: request.i18n.__('products')['404'] }).code(404);

        delete request.payload.productId;
        request.payload.location = { lat: request.payload.storeLatitude, lon: request.payload.storeLongitude };
        request.payload.productname = request.payload.name;
        delete request.payload.name;
        request.payload.storeId = new ObjectID(request.payload.storeId);
        request.payload.brand = (request.payload.brand && request.payload.brand.length == 24) ? new ObjectID(request.payload.brand) : "";
        childProducts.update({
            q: { "_id": productId }, data: {
                $set: request.payload,
                $push: {
                    actions: {
                        statusMsg: 'Updated',
                        userType: 'admin',
                        timeStamp: moment().unix(),
                        isoDate: new Date()
                    }
                }
            }
        }, (err, updateObj) => {

            if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

            request.payload.storeId = String(request.payload.storeId);
            request.payload.brand = String(request.payload.brand);
            delete request.payload.actions;
            childProductsElastic.Update(productId.toString(), request.payload, (err, resultelastic) => {
                // if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']), data: err }).code(500);//yun
                return reply({ message: error['products']['200'], data: resultelastic }).code(200);
            })

            // stores.getOne({ _id: result.storeId, firstCategory: new ObjectID(result.firstCategoryId) }, (err, storedata) => {
            //     if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500);
            //     if (storedata) {
            //         if (config.salesforceService) {
            //             /*salesforce By Umesh Beti */
            //             salesforce.login(() => { });
            //             var authData = salesforce.get();
            //             var addonss = [];
            //             let obj = {};
            //             request.payload.addOns && request.payload.addOns.map((element, index) => {
            //                 obj = {};
            //                 obj["addOnsName"] = element.addOns[0].name.en ? element.addOns[0].name.en : "";
            //                 obj["addOnsMongoId"] = element.addOns[0].id ? element.addOns[0].id : "";
            //                 obj["price"] = element.addOns[0].price ? element.addOns[0].price : 0;
            //                 obj["storeAddOnsId"] = element.addOns[0].storeAddOnId ? element.addOns[0].storeAddOnId : "";
            //                 addonss.push(obj);
            //             });
            //             var untiss = [];
            //             let obj1 = {};
            //             request.payload.units && request.payload.units.map((element, index) => {
            //                 obj1 = {};
            //                 obj1["ProductMongoId"] = request.payload._id ? request.payload._id : "";
            //                 obj1["Name"] = element.name.en ? element.name.en : "";
            //                 obj1["unitMongoId"] = element.unitId ? element.unitId : "";
            //                 obj1["price"] = element.price.en ? element.price.en : 0;
            //                 obj1["status"] = element.status == "active" ? true : false;
            //                 //obj1["size"] = element.quantity ? element.quantity.en : 0;
            //                 //obj1["floatValue"] = element.floatValue ? element.floatValue : "";
            //                 untiss.push(obj1);
            //             });


            //             var FirstCate = request.payload.firstCategoryName;
            //             FirstCate = FirstCate.replace(";", "");
            //             var SecondCate = request.payload.secondCategoryName;
            //             SecondCate = SecondCate.replace(";", "");
            //             var ThirdCate = request.payload.thirdCategoryName;
            //             ThirdCate = ThirdCate.replace(";", "");
            //             var DataToSF =
            //             {
            //                 "mongoId": salesforceProdcutId ? salesforceProdcutId : "",
            //                 "picUrl": result.images[0].image,
            //                 "productName": request.payload.productName[0],
            //                 "productCode": "0012",
            //                 "firstCategory": FirstCate ? FirstCate : "",
            //                 "secondCategory": SecondCate ? SecondCate : "",
            //                 "thirdCategory": ThirdCate ? ThirdCate : "",
            //                 "status": true,
            //                 "barCode": result.barcode ? result.barcode : "",
            //                 "brandName": result.brandName ? result.brandName : "",
            //                 "manufactureName": result.manufacturerName ? result.manufacturerName : "",
            //                 "sku": result.sku ? result.sku : "",
            //                 "storeMongoId": result.storeId ? result.storeId : "",
            //                 "un": untiss,
            //                 "ad": addonss,
            //                 "description": result.sDescription.en ? result.sDescription.en : ""

            //             }

            //             if (authData) {
            //                 superagent
            //                     .put(authData.instanceUrl + '/services/apexrest/delivx/Pro')
            //                     .send(DataToSF) // sends a JSON post body
            //                     .set('Accept', 'application/json')
            //                     .set('Authorization', 'Bearer ' + authData.accessToken)
            //                     .end((err, res) => {
            //                         if (err) {
            //                             logger.warn("err ====in first attempt ", err);
            //                         }
            //                         if (res) {
            //                             logger.info("updated child product to salesforece success");
            //                         }
            //                     });
            //             }
            //         }
            //         return reply({ message: request.i18n.__('products')['200'], data: result }).code(200);
            //     } else {
            //         stores.findOneAndUpdate({ q: { _id: result.storeId }, data: { $push: { firstCategory: new ObjectID(result.firstCategoryId) } } }, (err, updateresult) => {
            //             if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            //             stores.getOne({ _id: new ObjectID(request.payload.storeId) }, (err, storedataObj) => {
            //                 delete storedataObj._id;
            //                 storesElastic.Update(result.storeId.toString(), storedataObj, (err, resultelastic) => {
            //                     if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500); // yun
            //                     if (config.salesforceService) {
            //                         /*salesforce By Umesh Beti */
            //                         salesforce.login(() => { });
            //                         var authData = salesforce.get();
            //                         var addonss = [];
            //                         let obj = {};
            //                         request.payload.addOns && request.payload.addOns.map((element, index) => {
            //                             obj = {};
            //                             obj["addOnsName"] = element.addOns[0].name.en ? element.addOns[0].name.en : "";
            //                             obj["addOnsMongoId"] = element.addOns[0].id ? element.addOns[0].id : "";
            //                             obj["price"] = element.addOns[0].price ? element.addOns[0].price : 0;
            //                             obj["storeAddOnsId"] = element.addOns[0].storeAddOnId ? element.addOns[0].storeAddOnId : "";
            //                             addonss.push(obj);
            //                         });
            //                         var untiss = [];
            //                         let obj1 = {};
            //                         request.payload.units && request.payload.units.map((element, index) => {
            //                             obj1 = {};
            //                             obj1["ProductMongoId"] = request.payload._id ? request.payload._id : "",
            //                                 obj1["Name"] = element.name.en ? element.name.en : "";
            //                             obj1["unitMongoId"] = element.unitId ? element.unitId : "";
            //                             obj1["price"] = element.price.en ? element.price.en : 0;
            //                             obj1["status"] = element.status == "active" ? true : false;
            //                             //obj1["floatValue"] = element.floatValue ? element.floatValue : "";
            //                             untiss.push(obj1);
            //                         });
            //                         var FirstCate = request.payload.firstCategoryName;
            //                         FirstCate = FirstCate.replace(";", "");
            //                         var SecondCate = request.payload.secondCategoryName;
            //                         SecondCate = SecondCate.replace(";", "");
            //                         var ThirdCate = request.payload.thirdCategoryName;
            //                         ThirdCate = ThirdCate.replace(";", "");

            //                         var DataToSF =
            //                         {
            //                             "mongoId": salesforceProdcutId ? salesforceProdcutId : "",
            //                             "picUrl": result.images[0].image,
            //                             "productName": request.payload.productName[0],
            //                             "productCode": "0012",
            //                             "firstCategory": FirstCate ? FirstCate : "",
            //                             "secondCategory": SecondCate ? SecondCate : "",
            //                             "thirdCategory": ThirdCate ? ThirdCate : "",
            //                             "status": true,
            //                             "barCode": result.barcode ? result.barcode : 0,
            //                             "brandName": result.brandName ? result.brandName : "",
            //                             "manufactureName": result.manufacturerName ? result.manufacturerName : "",
            //                             "sku": result.sku ? result.sku : "",
            //                             "storeMongoId": result.storeId ? result.storeId : "",
            //                             "un": untiss,
            //                             "ad": addonss,
            //                             "description": result.sDescription.en ? result.sDescription.en : ""

            //                         }
            //                         if (authData) {
            //                             superagent
            //                                 .put(authData.instanceUrl + '/services/apexrest/delivx/Pro')
            //                                 .send(DataToSF) // sends a JSON post body
            //                                 .set('Accept', 'application/json')
            //                                 .set('Authorization', 'Bearer ' + authData.accessToken)
            //                                 .end((err, res) => {
            //                                     if (err)
            //                                         logger.warn("err ====in first attempt ", err);
            //                                     if (res) {
            //                                         logger.info("child product updated to salesforece success");
            //                                     }
            //                                 });
            //                         }
            //                     }
            //                     return reply({ message: request.i18n.__('store')['200'], data: resultelastic }).code(200);
            //                 })
            //             })

            //             // return reply({ message: error['products']['200'], data :result } ).code(200);
            //         });
            //     }
            // });
        });
    });
}



const validator = {
    productId: Joi.string().min(24).max(24).description('productId'),
    productName: Joi.array().items().description('productName'),
    firstCategoryId: Joi.string().required().description('firstCategoryId'),
    secondCategoryId: Joi.string().allow('').description('secondCategoryId'),
    thirdCategoryId: Joi.string().allow('').description('thirdCategoryId'),
    firstCategoryName: Joi.string().required().description('firstCategoryName'),
    secondCategoryName: Joi.string().allow('').description('secondCategoryName'),
    thirdCategoryName: Joi.string().allow('').description('thirdCategoryName'),
    sku: Joi.string().allow('').description('sku'),
    barcode: Joi.string().description('barcode').allow(""),
    shortDescription: Joi.string().required().description('shortDescription'),
    detailedDescription: Joi.string().allow('').description('detailedDescription'),
    POSName: Joi.string().allow('').description('POSName'),
    barcodeFormat: Joi.string().allow('').description('barcodeFormat'),
    THC: Joi.string().required().description('THC'),
    CBD: Joi.string().required().description('CBD'),
    units: Joi.array().items().description('units'),
    strainEffects: Joi.object().keys().description('strainEffects'),
    medicalAttributes: Joi.object().keys().description('medicalAttributes'),
    negativeAttributes: Joi.object().keys().description('negativeAttributes'),
    flavours: Joi.object().keys().description('flavours'),
    images: Joi.array().items().description('images'),
    type: Joi.string().allow('').description('type'),
    upc: Joi.string().allow('').description('upc'),
    mpn: Joi.string().allow('').description('mpn'),
    model: Joi.string().allow('').description('model'),
    shelflifeuom: Joi.string().allow('').description('shelflifeuom'),
    storageTemperature: Joi.string().allow('').description('storageTemperature'),
    storageTemperatureUOM: Joi.string().allow('').description('storageTemperatureUOM'),
    warning: Joi.string().allow('').description('warning'),
    allergyInformation: Joi.string().allow('').description('allergyInformation'),
    nutritionFacts: Joi.object().keys().description('nutritionFacts'),
    container: Joi.string().allow('').description('container'),
    size: Joi.string().allow('').description('size'),
    sizeUom: Joi.string().allow('').description('sizeUom'),
    servingsPerContainer: Joi.string().allow('').description('servingsPerContainer'),
    height: Joi.string().allow('').description('height'),
    width: Joi.string().allow('').description('width'),
    length: Joi.string().allow('').description('length'),
    weight: Joi.string().allow('').description('weight'),
    genre: Joi.string().allow('').description('genre'),
    label: Joi.string().allow('').description('label'),
    artist: Joi.string().allow('').description('artist'),
    actor: Joi.string().allow('').description('actor'),
    director: Joi.string().allow('').description('director'),
    clothingSize: Joi.string().allow('').description('clothingSize'),
    color: Joi.string().allow('').description('color'),
    features: Joi.string().allow('').description('features'),
    manufacturer: Joi.string().allow('').description('manufacturer'),
    brand: Joi.string().allow('').description('brand'),
    publisher: Joi.string().allow('').description('publisher'),
    author: Joi.string().allow('').description('author'),
    currentDate: Joi.string().allow('').description('currentDate'),
    storeId: Joi.string().description('storeId'),
    parentProductId: Joi.string().allow('').description('parentProductId'),
    itemKey: Joi.string().allow('').description('itemKey'),
    fileName: Joi.string().allow('').description('fileName'),
    productPosId: Joi.string().allow('').description('productPosId'),
    colors: Joi.array().items().description('colors'),
    sizes: Joi.array().items().description('sizes'),
    manufacturerName: Joi.string().allow('').description('manufacturerName'),
    brandName: Joi.string().allow('').description('brandName'),

    zoneId: Joi.array().items().description('zoneId'),
    cityId: Joi.string().allow('').description('cityId'),
    storeLatitude: Joi.number().description('Latitude'),
    storeLongitude: Joi.number().description('Longitude'),
    storeAverageRating: Joi.number().description('storeAverageRating').allow(""),
    name: Joi.object().keys().description('name'),
    storeName: Joi.array().items().description('storeName'),
    storeAddress: Joi.array().items().description('storeAddress'),
    taxes: Joi.array().items().description('taxes'),
    //unitPosId: Joi.string().allow('').description('unitPosId')

    consumptionTime: Joi.any().description("consumption Time"),
    categoryName: Joi.array().items().description('categoryName'),
    subCategoryName: Joi.array().items().description('subCategoryName'),
    subSubCategoryName: Joi.array().items().description('subSubCategoryName'),
    pName: Joi.object().keys().description('name'),
    sDescription: Joi.object().keys().description('sDescription'),
    detailDescription: Joi.object().keys().description('detailDescription'),
    catName: Joi.object().keys().description('catName'),
    subCatName: Joi.object().keys().description('subCatName'),
    subSubCatName: Joi.object().keys().description('subSubCatName'),
    shortDesc: Joi.array().items().description('shortDesc'),
    detailedDesc: Joi.array().items().description('detailedDesc'),
    pos: Joi.object().keys().description('pos'),
    POSNam: Joi.array().items().description('posNam'),

    upcName: Joi.object().keys().description('upcName'),
    mpnName: Joi.object().keys().description('mpnName'),
    modelName: Joi.object().keys().description('modelName'),
    uomShelfLife: Joi.object().keys().description('uomShelfLife'),
    UOMstorageTemperature: Joi.object().keys().description('UOMstorageTemperature'),
    warningName: Joi.object().keys().description('warningName'),
    allergyInfo: Joi.object().keys().description('allergyInfo'),
    nutritionFactsInfo: Joi.object().keys().description('nutritionFactsInfo'),
    containerName: Joi.object().keys().description('containerName'),
    containerPerServings: Joi.object().keys().description('containerPerServings'),
    genreName: Joi.object().keys().description('genreName'),
    labelName: Joi.object().keys().description('labelName'),
    artistName: Joi.object().keys().description('artistName'),
    actorName: Joi.object().keys().description('actorName'),
    directorName: Joi.object().keys().description('directorName'),
    featureName: Joi.object().keys().description('featureName'),
    publisherName: Joi.object().keys().description('publisherName'),
    authorName: Joi.object().keys().description('authorName'),
    store: Joi.object().keys().description('store'),
    sizename: Joi.object().keys().description('sizename'),
    taxname: Joi.object().keys().description('taxname'),
    colorname: Joi.object().keys().description('colorname'),

    manufactureName: Joi.object().keys().description('manufactureName'), // new structure
    brandTitle: Joi.object().keys().description('brandTitle'),
    hsnCode: Joi.object().keys().description('hsnCode'),
    createdTimestamp: Joi.any().allow(""),
    ingredients: Joi.object().keys().description('ingredients'),
    franchiseId: Joi.string().description('franchiseId').allow(""),
    addOns: Joi.any().description("add on ids").allow(""),
    storeType: Joi.number().required().description('storeType'),
    storeTypeMsg: Joi.string().required().description('storeTypeMsg'),
    storeLogoImage: Joi.string().description('storeLogoImage'),
    storeCategoryId: Joi.string().description('storeCategory Id'),
    storeCategoryName: Joi.object().keys().description('storeCategory Name'),

    currency: Joi.string().description('currency').allow(""),
    currencySymbol: Joi.string().description('currencySymbol').allow(""),
    productType: Joi.number().integer().min(1).max(2).description('status 1 - Generic, 2 - Branded'),
    productTypeMsg: Joi.string().description('productType Message').allow(""),
    symptoms: Joi.array().items().description('symptoms'),
    selectiveGeneric: Joi.array().items().description('selective generic'),
    selectiveBranded: Joi.array().items().description('selective brands'),
    rx: Joi.any().allow(""),
    prescriptionRequired: Joi.any().allow(""),
    serialNumber: Joi.string().description('serialNumber').allow(""),
    professionalUsageFile: Joi.string().description('professionalUsageFile').allow(""),
    personalUsageFile: Joi.string().description('personalUsageFile').allow(""),
    soldOnline: Joi.any().allow(""),

    // status: Joi.number().integer().required().min(0).max(1).description('status 0 - new, 1 - approve')
}


const handlerQuantity = (request, reply) => {

    let productId = new ObjectID(request.payload.productId)

    childProducts.getOne({ "_id": productId }, (err, result) => {
        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        if (result === null)
            return reply({ message: request.i18n.__('products')['404'] }).code(404);
        /**
         * function : inventoryMethod
         * des:to update inventory
         */
        request.payload.description = (request.payload.triggerType == 1) ? "Added by Admin" : "Removed by Admin";
        request.payload.comingFromBulkUpload = 2;
        request.payload.storeId = result.storeId.toString();
        inventoryMethod.patchLogs(request.payload,
            (err, res) => {
                if (err) {
                    return reply({ message: err.message }).code(err.code);
                } else {
                    return reply({ message: res.message, data: res.data }).code(res.code);
                }
            });
    });
}
const validatorQuantity = {
    productId: Joi.string().required().min(24).max(24).description('productId'),
    unitId: Joi.string().required().min(24).max(24).description('unitId'),
    quantity: Joi.number().integer().required().description('quantity'),
    triggerType: Joi.number().integer().min(1).max(2).required().description('1- add 2- remove')
}


module.exports = { handler, validator, validatorQuantity, handlerQuantity }