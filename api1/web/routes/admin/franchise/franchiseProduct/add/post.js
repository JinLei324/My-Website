'use strict'

var franciseProducts = require('../../../../../models/franciseProducts');
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
    franciseProducts.get({}, (err, result) => {

        if (result) {
            request.payload.seqId = (typeof result.seqId == "undefined" || result.seqId == null) ? 1 : result.seqId + 1;
        } else {
            request.payload.seqId = 1;
        }
        // request.payload.location = { lat: request.payload.storeLatitude, lon: request.payload.storeLongitude };
        request.payload.productname = request.payload.name;
        delete request.payload.name;
        request.payload.createdTimestamp = moment().unix();
        request.payload.statusMsg = (request.payload.status == 1) ? 'Approved' : 'New';

        request.payload.brand = (request.payload.brand && request.payload.brand.length == 24) ? new ObjectID(request.payload.brand) : "";

        request.payload.brand = String(request.payload.brand);
        request.payload._id = new ObjectID(request.payload._id);
        
        request.payload.brand = (request.payload.brand && request.payload.brand.length == 24) ? new ObjectID(request.payload.brand) : "";
        request.payload.actions = [{
            statusMsg: (request.payload.status == 1) ? 'Approved' : 'New',
            userType: 'admin',
            timeStamp: moment().unix(),
            isoDate: new Date()
        }];
        franciseProducts.update({
            q: {
                "_id": request.payload._id,
                franchiseId: request.payload.franchiseId,
                // status : 2
            },
            data: {
                $set: request.payload
            },
            options: { upsert: true, returnOriginal: false }
        }, (err, result) => {
            if (err) {
                logger.error('Error occurred childProducts   (Insert): ' + JSON.stringify(err));
                return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500); // yun
            }


            //salseForce
            return reply({ message: request.i18n.__('products')['200'], data: result }).code(200);
        });
        // });

    });
};


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    _id: Joi.string().required().description('_id'),
    productName: Joi.array().items().description('productName'),
    firstCategoryId: Joi.string().required().description('firstCategoryId'),
    secondCategoryId: Joi.string().allow('').description('secondCategoryId'),
    thirdCategoryId: Joi.string().allow('').description('thirdCategoryId'),
    firstCategoryName: Joi.string().allow('').description('firstCategoryName'),
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
    // storeId: Joi.string().description('storeId'),
    parentProductId: Joi.string().allow('').description('parentProductId'),
    itemKey: Joi.string().allow('').description('itemKey'),
    fileName: Joi.string().allow('').description('fileName'),
    productPosId: Joi.string().allow('').description('productPosId'),
    colors: Joi.array().items().description('colors'),
    sizes: Joi.array().items().description('sizes'),
    manufacturerName: Joi.string().allow('').description('manufacturerName'),
    brandName: Joi.string().allow('').description('brandName'),

    // zoneId: Joi.array().items().description('zoneId'),
    cityId: Joi.string().allow('').description('cityId'),
    // storeLatitude: Joi.number().description('Latitude'),
    // storeLongitude: Joi.number().description('Longitude'),
    // storeAverageRating: Joi.number().description('storeAverageRating').allow(""),
    name: Joi.object().keys().description('name'),
    // storeName: Joi.array().items().description('storeName'),
    // storeAddress: Joi.array().items().description('storeAddress'),
    // status: Joi.number().description('status').allow(null),
    taxes: Joi.array().items().description('taxes'),


    // storeType: Joi.number().required().description('storeType'),
    // storeTypeMsg: Joi.string().required().description('storeTypeMsg'),
    // storeCategoryId: Joi.string().description('storeCategory Id'),
    // storeCategoryName: Joi.object().keys().description('storeCategory Name'),


    // unitPosId: Joi.string().allow('').description('unitPosId')
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
    status: Joi.number().integer().required().min(0).max(1).description('status 0 - new, 1 - approve'),
    hsnCode: Joi.object().keys().description('hsnCode'),
    createdTimestamp: Joi.any().allow(""),
    ingredients: Joi.object().keys().description('ingredients'),
    franchiseId: Joi.string().required().description('franchiseId').allow(""),
    addOns: Joi.any().description("add on ids").allow(""),
    consumptionTime: Joi.any().description("consumption Time"),

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
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }