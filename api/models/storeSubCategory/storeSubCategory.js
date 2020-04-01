'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'storeSubCategory'
const ObjectID = require('mongodb').ObjectID; 
const logger = require('winston'); 

/** 
* @function
* @name getStoreCategories 
* @param {object} params - data coming from controller
*/
const getStoreCategories = (params, callback) => {
    db.get().collection(tableName).find(
        params)
        .sort({ seqId: 1 }).toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}

const SelectOne = (data, callback) => {
    db.get().collection(tableName).findOne(data, (function (err, result) {
        return callback(err, result);
    }));
}


module.exports = {
    SelectOne,
    getStoreCategories
}
