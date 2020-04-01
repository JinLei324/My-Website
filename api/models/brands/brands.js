'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'brands'
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name getById 
* @param {object} params - data coming from controller
*/
const get = (params, callback) => {
    db.get().collection(tableName)
     .find(params,{name:1,description:1,bannerImage:1}).limit(10).toArray((err, result) => {
        return callback(err, result);
    });
}

const getById = (params, callback) => {

    db.get().collection(tableName).find(
        {
            _id: { $in: params.id } // condition
        })
        .sort({ seqID: -1 }).toArray((err, result) => { //sort
            return callback(err, result);
        });
}
const SelectOne = (data, callback) => {
    db.get().collection(tableName).findOne(data, (function (err, result) {
        return callback(err, result);
    }));
}
const update = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(params.condition|| {}, (err, result) => {
            return callback(err, result)
        })
}
module.exports = {
    get,
    getById,
    SelectOne,
    update
}
