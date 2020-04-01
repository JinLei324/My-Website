'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'PythonOffersTest'
const ObjectID = require('mongodb').ObjectID;
const elasticClient = require('../elasticSearch');
/** 
* @function
* @name readById 
* @param {object} params - data coming from controller
*/
const readById = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            _id: params._id,
            status: 1
        }, { productName: 1, productname: 1, strainEffects: 1, nutritionFactsInfo: 1, priceValue: 1, shortDescription: 1, sDescription: 1, detailDescription: 1, detailedDescription: 1, THC: 1, CBD: 1, thumbImage: 1, storeId: 1, images: 1, mobileImage: 1, secondCategoryName: 1, favorites: 1, units: 1, wishList: 1, offer: 1, taxes: 1, parentProductId: 1, sku: 1, upcName: 1, ingredients: 1, catName: 1, subCatName: 1, subSubCatName: 1 }, (err, result) => {
            return callback(err, result);
        });
}
/** 
* @function
* @name read 
* @param {object} params - data coming from controller
*/
const read = (params, callback) => {
    db.get().collection(tableName)
        .find(params,
            {
                name: 1, offerType: 1, applicableOnStatus: 1, images: 1, description: 1, storeId: 1, status: 1, minimumPurchaseQty: 1, perUserLimit: 1, globalUsageLimit: 1, discountValue: 1, endDateTime: 1,
                startDateTime: 1, offerTypeString: 1
            })
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}
const insert = (params, callback) => {
    db.get().collection(tableName)
        .insert(params, (err, result) => {
            return callback(err, result);
        })
}

const update = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(params.q, params.data, params.options || {}, (err, result) => {
            return callback(err, result)
        })
}

const get = (params, callback) => {
    db.get({}).collection(tableName)
        .find({}).sort({ _id: -1 }).toArray((err, result) => {
            return callback(err, result[0]);
        });
}

const getOne = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, (err, result) => {
            return callback(err, result);
        })
}

const deleteItem = (params, callback) => {
    db.get().collection(tableName)
        .remove(params, (err, result) => {
            return callback(err, result);
        })

}
module.exports = {
    readById,
    read,
    insert, update, get, getOne, deleteItem
}
