'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'cities'
const ObjectID = require('mongodb').ObjectID;


const cityDetailsByCityIdOld = (cityIds, callBack) => {
    db.get().collection(tableName)
        .find({
            "_id": { $in: cityIds }
        }).toArray((err, result) => {
            return callBack(err, result);
        });
}

const cityDetailsByCityId = (cityIds, callback) => {
    let params = [
        { "$unwind": "$cities" },
        {
            $match: {
                "cities.cityId": { "$in": cityIds }
            }
        },
        {
            "$group": {
                "_id": "$cities.cityId",
                "cityId": { "$first": "$cities.cityId" },
                "country": { "$first": "$country" },
                "cityName": { "$first": "$cities.cityName" },
                "state": { "$first": "$cities.state" },
                "currency": { "$first": "$cities.currency" },
                "currencySymbol": { "$first": "$cities.currencySymbol" }
            }
        }

    ];
    db.get().collection(tableName)
        .aggregate(params)
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}

/** 
* @function
* @name isExists 
* @param {object} params - data coming from controller
*/
const isExistsOld = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            _id: params._id
        }, (err, result) => {
            return callback(err, result);
        });
}
const isExists = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            "cities.cityId": params._id
        }, { _id: 0, 'cities.$': 1 }, ((err, city) => {
            return callback(err, city);
        }));
}
/** 
* @function
* @name selectCity 
* @param {object} params - data coming from controller
*/
const selectCity = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            polygons: {
                $geoIntersects: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [params.long, params.lat]
                    }
                }
            }
        },
            { title: 1 }, ((err, city) => {
                return callback(err, city);
            }));
}
/** 
* @function
* @name getAll 
* @param {object} params - data coming from controller
*/
const getAll = (params, callback) => {
    db.get().collection(tableName).find({ "cities.isDeleted": false })
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}
/** 
* @function
* @name inZone 
* @param {object} params - data coming from controller
*/
const inZone = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            "cities.polygons": {
                $geoIntersects: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [params.long, params.lat]
                    }
                }
            }
        },
            { _id: 0, 'cities.$': 1 }, ((err, city) => {
                return callback(err, city);
            }));
}
/** 
* @function
* @name aggregate 
* @param {object} params - data coming from controller
*/
const aggregate = (params, callback) => {
    db.get().collection(tableName)
        .aggregate(params)
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}
/** 
* @function
* @name getAllCities 
* @param {object} params - data coming from controller
*/
const getAllCities = (params, callback) => {
    db.get().collection(tableName).find({ "cities.isDeleted": false })
        .toArray((err, result) => {
            return callback(err, result);
        });
}
/** 
* @function
* @name readByCityId 
* @param {object} params - data coming from controller
*/
const readByCityId = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, { _id: 0, 'cities.$': 1 }, ((err, city) => {
            return callback(err, city);
        }));
}

/*
* @function
* @name fineAndUpdate
* @param {object} params - data coming from controller
*/

const fineAndUpdate = (condition, data, callback) => {
    db.get()
        .collection(tableName)
        .update(condition, { $set: data }, function (err, result) {
            return callback(err, result);
        });
};

/*
* @function
* @name findAndUpdate
* @param {object} params - data coming from controller
*/

const updateArea = (condition, data, callback) => {
    db.get()
        .collection(tableName)
        .update(condition, data, function (err, result) {
            return callback(err, result);
        });
};

module.exports = {
    cityDetailsByCityId,
    isExists,
    selectCity,
    getAll,
    inZone,
    aggregate,
    getAllCities,
    readByCityId,
    fineAndUpdate,
    updateArea
}
