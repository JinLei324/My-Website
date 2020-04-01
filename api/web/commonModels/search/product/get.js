'use strict'
const stores = require('../../../../models/stores');
const childProducts = require('../../../../models/childProducts');
const error = require('../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const async = require('async');
const ObjectId = require('mongodb').ObjectID;
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
* @param {integer}  
*/
const handler = (request, reply) => {
    // childProducts.getElasticData({ lat: request.params.latitude, long: request.params.longitude, name: request.params.needle, zoneId: request.params.zoneId,storeId: request.params.storeId }, (err, data) => {
    let condition = [
        { "match_phrase_prefix": { "storeId": request.params.storeId } },
        { "match_phrase_prefix": { "productName": request.params.needle } }
    ];

    if (request.params.categoryId != 0 && request.params.categoryId.length == 24) {
        condition.push({ "match_phrase_prefix": { "firstCategoryId": request.params.categoryId } });
    }

    if (request.params.subCategoryId != 0 && request.params.subCategoryId.length == 24) {
        condition.push({ "match_phrase_prefix": { "secondCategoryId": request.params.subCategoryId } });
    }
    
    childProducts.getElasticData(condition, (err, data) => {
        if (err) {
            logger.error('Error occurred during elastic search ' + request.auth.credentials.sub + '(getElasticData): ' + JSON.stringify(err));
            return reply({ message:  request.i18n.__('genericErrMsg')['500']   }).code(500);
        }
        if (data) {
            for (let i = 0; i < data.length; i++) {
                data[i]._source.childProductId = data[i]._id;
                data[i] = data[i]._source;
                data[i].productName = data[i].productName ? data[i].productName[request.headers.language] : "";
                data[i].parentProductId = data[i].parentProductId ? data[i].parentProductId : "";
                delete data[i]._id;
                delete data[i].mongoId;
            }
            return reply({ message: request.i18n.__('stores')['200']  , data: data }).code(200);
        } else {
            return reply({ message: request.i18n.__('stores')['404']   }).code(404);
        }
    });
}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    storeId: Joi.string().required().min(24).max(24).description('store id').default("5a1974a0e0dc3f28f46dd4df"),
    categoryId: Joi.string().required().description('if categoryId send id else 0').default("59d34c2ee0dc3f256f5848ac"),
    subCategoryId: Joi.string().required().description('if subcategoryId send id else 0').default("5a0ed20685985b60fa3aa990"),
    needle: Joi.string().description('search  products').default("e"),
    latitude: Joi.number().required().description('Latitude'),
    longitude: Joi.number().required().description('Longitude')
};
/**
* A module that exports business get store handler, validator!
* @exports validator
* @exports handler
*/
module.exports = { handler, validator }