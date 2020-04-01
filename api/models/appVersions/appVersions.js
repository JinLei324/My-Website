'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'appVersions'
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name updateAppVersions 
* @param {*} type - type of the app 11-android driver, 21-ios driver, 12-android customer, 22-ios customer 
*/

const updateAppVersions = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            {
                type: params.type,
                'versions.version': params.appVersion
            },
            {
                $addToSet: {
                    'versions.$.userIds': params.userId
                }
            },
            (err, result) => { return callback(err, result); });
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
* @name read 
* @param {object} params - data coming from controller
*/
const read = (params, callback) => {
    db.get().collection(tableName).find(params).sort({ '_id': -1 }).toArray((err, result) => { // normal select method
        return callback(err, result);
    });

}
/** 
* @function
* @name readById 
* @param {object} params - data coming from controller
*/
const readById = (params, callback) => {
    db.get().collection(tableName).find(params).sort({ '_id': -1 }).toArray((err, result) => { // normal select method
        return callback(err, result);
    });

}

/** 
* @function
* @name checkVersion 
* @param {object} params - data coming from controller
*/
const checkVersion = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, (err, result) => {
            return callback(err, result);
        });
}
/** 
* @function
* @name save 
* @param {object} params - data coming from controller
*/
const save = (params, callback) => {
    db.get().collection(tableName)
        .insert(
            [params],
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name patchMandatory 
* @param {*} type - type of the app 11-android driver, 21-ios driver, 12-android customer, 22-ios customer 
*/

const patchMandatory = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            {
                type: params.type, 'versions.version': params.version
            },
            {
                $set: { mandatory: params.mandatory, 'versions.$.mandatory': params.mandatory }
            },
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name push 
* @param {*} type - type of the app 11-android driver, 21-ios driver, 12-android customer, 22-ios customer 
*/

const push = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            {
                type: params.type, 'versions.version': { $nin: [params.version] }
            },
            {
                $set: {
                    latestVersion: params.version,
                    mandatory: params.mandatory,
                    lastUpdated: moment().unix()
                },
                $push: {
                    versions: {
                        version: params.version,
                        timestamp: moment().unix(),
                        mandatory: params.mandatory
                    }
                }
            },
            (err, result) => { return callback(err, result); });
}
module.exports = {
    updateAppVersions,
    selectCity,
    read,
    readById,
    checkVersion,
    save,
    patchMandatory,
    push
}
