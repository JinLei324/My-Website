'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'thirdCategory'
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name getById 
* @param {object} params - data coming from controller
*/
const getById = (params, callback) => {
    db.get().collection(tableName).find(
        {
            categoryId: params.id
        },
        { name: 1, description: 1, imageUrl: 1 })
        .sort({ seqID: 1 }).toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}
/** 
* @function
* @name getByCatSubcatId 
* @param {object} params - data coming from controller
*/
const getByCatSubcatId = (params, callback) => {
    // db.get().collection(tableName)
    //     .aggregate([
    //         { $match: { "_id": params.businessId } },
    //         { $lookup: { "from": "secondCategory", "localField": "firstCategory", "foreignField": "categoryId", "as": "categories" } },
    //         { $unwind: "$categories" },
    //         { $project: { subCategoryName: "$categories.name", subCategoryId: "$categories._id", categoryId: "$categories.categoryId" } },
    //         //  { $lookup: { "from": "childProducts", "localField": "_id", "foreignField": "storeId", "as": "products" } }, 
    //     ])
    //     .toArray((err, result) => { // normal select method
    //         return callback(err, result);
    //     });

    db.get().collection(tableName).find(
        {
            "categoryId": params.catId,
            "subCategoryId": params.subCatId,
            "visibility": 1
        },
        { name: 1, categoryId: 1, subCategoryId: 1, subSubCategoryName: 1, subSubCategoryDesc: 1, description: 1, imageUrl: 1 })
        .sort({ seqID: 1 }).toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}

const SelectOne = (data, callback) => {
    db.get().collection(tableName).findOne(data, (function (err, result) {
        return callback(err, result);
    }));
}
module.exports = {
    getById,
    getByCatSubcatId,
    SelectOne
}
