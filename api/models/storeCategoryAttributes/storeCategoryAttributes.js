'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'storeCategoryAttributes'
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name getById 
* @param {object} params - data coming from controller
*/
const get = (params, callback) => {
    db.get().collection(tableName).find(
        {
            status : 1,
            storeCategoryId:  params // condition
        },{
            _id:1,
            name:1,
            attributes:1
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
    SelectOne
}
