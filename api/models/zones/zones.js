'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'zones'
const ObjectID = require('mongodb').ObjectID;
const logger = require('winston');
/** 
* @function
* @name inZone 
* @param {object} params - data coming from controller
*/
const inZone = (params, callback) => {
    let condition = {
        "status": 1,
        "polygons": {
            $geoIntersects: {
                $geometry: {
                    type: "Point",
                    coordinates: [
                        parseFloat(params.long),
                        parseFloat(params.lat)
                    ]
                }
            }
        }
    };
    
    db.get().collection(tableName)
        .findOne(condition, { _id: 1, title: 1, currencySymbol: 1, currency: 1, city_ID: 1, city: 1, mileageMetric: 1, weightMetric: 1, cityId: 1, zoneId: 1 }, ((err, zone) => {
            return callback(err, zone);
        }));
}
/** 
* @function
* @name getById 
* @param {object} params - data coming from controller
*/
const getById = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            _id: new ObjectID(params.id)
        }, { preferredStore: 1 }, (err, result) => {
            return callback(err, result);
        });
}
const readAll = (params, callback) => {

    db.get().collection(tableName)
        .find().toArray((err, result) => {
            return callback(err, result);
        });
}
/** 
* @function
* @name getCityId 
* @param {object} params - data coming from controller
*/
const getCityId = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, { city_ID: 1, city: 1, mileageMetric: 1, currency: 1, currencySymbol: 1, appId: 1 }, (err, result) => {
            return callback(err, result);
        });
}
/** 
* @function
* @name inZone 
* @param {object} params - data coming from controller
*/
const inZoneAll = (params, callback) => {
    let condition = {
        "polygons": {
            $geoIntersects: {
                $geometry: {
                    type: "Point",
                    coordinates: [
                        parseFloat(params.long),
                        parseFloat(params.lat)
                    ]
                }
            }
        }
    };
    db.get().collection(tableName)
        .find(condition).toArray((err, result) => {
            return callback(err, result);
        });
}

/** 
* @function
* @name getZonalCategoriesById 
* @param {object} params - data coming from controller
*/
const getZonalCategoriesById = (params, callback) => {
    let cond = [
        params
        ,
        { $lookup: { "from": "firstCategory", "localField": "firstCategory", "foreignField": "_id", "as": "firstCategoryData" } },
        { $unwind: "$firstCategoryData" },
        {
            $group: {
                _id: "$firstCategoryData._id",
                categoryName: { "$first": "$firstCategoryData.name" },
                categoryId: { "$first": "$firstCategoryData._id" },
                imageUrl: { "$first": "$firstCategoryData.imageUrl" },
                description: { "$first": "$firstCategoryData.description" },
                seqID: { "$first": "$firstCategoryData.seqID" },
                visibility: { "$first": "$firstCategoryData.visibility" },
                list: { "$first": "$firstCategoryData.list" },
                secondCategory: { "$first": "$secondCategory" }
            }
        },
        { $match: { visibility: 1 } },
        { $sort: { seqID: 1 } },
        { $lookup: { "from": "secondCategory", "localField": "categoryId", "foreignField": "categoryId", "as": "subCategories" } }
    ];
    db.get().collection(tableName)
        .aggregate(cond, ((err, result) => {
            return callback(err, result);
        }));
}
/** 
* @function
* @name readAllByCity 
* @param {object} params - data coming from controller
*/
const readAllByCity = (params, callback) => {

    db.get().collection(tableName)
        .find(params, { city_ID: 1, city: 1, currency: 1, currencySymbol: 1, mileageMetric: 1, weightMetric: 1, title: 1 }).toArray((err, result) => {
            return callback(err, result);
        });
}
const update = (query, params, callback) => {
    db.get().collection(tableName)
        .update(query, params, (err, result) => {
            return callback(err, result);
        });
}
module.exports = {
    inZone,
    getById,
    readAll,
    getCityId,
    inZoneAll,
    getZonalCategoriesById,
    readAllByCity,
    update
}
