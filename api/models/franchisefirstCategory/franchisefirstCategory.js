'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'franchisefirstCategory'
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name getById 
* @param {object} params - data coming from controller
*/
const getById = (params, callback) => {

    db.get().collection(tableName).find(
        {
            _id: { $in: params.id } // condition
        })
        .sort({ seqID: -1 }).toArray((err, result) => { //sort
            return callback(err, result);
        });
}

const get = (params, callback) => {

    db.get().collection(tableName).find(
        {
            visibility: 1,
            storeCategory: { $exists: true },
            'storeCategory.storeCategoryId': params  // condition
        }, {
            _id: 1,
            categoryName: 1
        }).toArray((err, result) => { //sort
            return callback(err, result);
        });
}
const SelectOne = (data, callback) => {
    db.get().collection(tableName).findOne(data, (function (err, result) {
        return callback(err, result);
    }));
}

module.exports = {
    get,
    getById,
    SelectOne
}
