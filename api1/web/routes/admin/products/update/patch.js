'use strict'

var products = require('../../../../../models/products');
var productsElastic = require('../../../../../models/productElastic');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
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

    products.getOne({ "_id": productId }, (err, result) => {

        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500);

        if (result === null)
            return reply({ message: error['products']['404'] }).code(404);

        delete request.payload.productId;

        products.update({ q: { "_id": productId }, data: request.payload }, (err, updateObj) => {

            if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500);



            productsElastic.Update(productId.toString(), request.payload, (err, resultelastic) => {

                if (err) {

                    return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500);
                } else {
                    /* Salesforce */
                    var authData = salesforce.get();
                    //var commissionType = request.payload.commissionType == 0 ? "Percentage" : "Fixed"
                    var DataToSF =
                    {
                        "mongoId": result.ops[0]._id,
                        "picUrl": "http://rahul.jpg",
                        "productName": result.ops[0].productName[0],
                        "productCode": "0012",
                        "firstCategory": request.payload.firstCategoryName,
                        "secondCategory": request.payload.secondCategoryName,
                        "thirdCategory": request.payload.thirdCategoryName,
                        "status": true,
                        "barCode": result.ops[0].barcode ? result.ops[0].barcode : "",
                        "brandName": result.ops[0].brandName ? result.ops[0].brandName : "",
                        "manufactureName": result.ops[0].manufacturerName,
                        "sku": request.payload.sku,
                        "description": result.ops[0].shortDesc[0] ? result.ops[0].shortDesc[0] : ""
                    }

                    if (authData) {
                        superagent
                            .patch(authData.instanceUrl + '/services/apexrest/delivx/CentralProduct')
                            .send(DataToSF) // sends a JSON post body
                            .set('Accept', 'application/json')
                            .set('Authorization', 'Bearer ' + authData.accessToken)
                            .end((err, res) => {
                                if (err)

                                if (err) {
                                    salesforce.login(() => {
                                        var authData = salesforce.get();
                                        if (authData) {
                                            superagent
                                                .patch(authData.instanceUrl + '/services/apexrest/delivx/CentralProduct')
                                                .send(DataToSF) // sends a JSON post body
                                                .set('Accept', 'application/json')
                                                .set('Authorization', 'Bearer ' + authData.accessToken)
                                                .end((err, res) => {
                                                    if (err) {

                                                    }
                                                });
                                        }
                                    });

                                }
                                else {

                                }
                            });
                    }

                    /* salesforce */
                    return reply({ message: request.i18n.__('products')['200'], data: resultelastic }).code(200);
                }


            })

            // return reply({ message: error['products']['200'], data: updateObj }).code(200);
        });
    });

}



const validator = {
    productId: Joi.string().required().description('productId'),
    productName: Joi.array().items().description('productName'),
    storeCategoryId: Joi.array().items().description('storeCategoryId'),
    firstCategoryId: Joi.string().required().description('firstCategoryId'),
    secondCategoryId: Joi.string().allow('').description('secondCategoryId'),
    thirdCategoryId: Joi.string().allow('').description('thirdCategoryId'),
    firstCategoryName: Joi.string().required().description('firstCategoryName'),
    secondCategoryName: Joi.string().allow('').description('secondCategoryName'),
    thirdCategoryName: Joi.string().allow('').description('thirdCategoryName'),
    sku: Joi.string().allow('').description('sku'),
    barcode: Joi.string().allow('').description('barcode'),
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
    itemKey: Joi.string().allow('').description('itemKey'),
    fileName: Joi.string().allow('').description('fileName'),
    colors: Joi.array().items().description('colors'),
    sizes: Joi.array().items().description('sizes'),
    manufacturerName: Joi.string().allow('').description('manufacturerName'),
    brandName: Joi.string().allow('').description('brandName'),


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
    manufactureName: Joi.object().keys().description('manufactureName'), // new structure
    brandTitle: Joi.object().keys().description('brandTitle'),
    ingredients: Joi.object().keys().description('ingredients'),
    addOnIds: Joi.object().keys().allow("").description("Add ids if vailable."),
    consumptionTime: Joi.any().description("consumptionTime"),
    franchiseId: Joi.string().allow("").description("Non mandatory field. Id of franchaise if available"),
    franchiseName: Joi.string().allow("").description("Franchise name if available"),


}

module.exports = { handler, validator }