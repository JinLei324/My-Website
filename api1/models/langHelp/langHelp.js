'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'lang_hlp'
const ObjectID = require('mongodb').ObjectID;
const logger = require('winston');
/** 
 * @function
 * @name get all addons 
 * @param {object} params - query params coming from controller
 */
const getAllActiveLanguages = (params, callback) => {
    db.get().collection(tableName).find(params).toArray(function (err, result) {
        return callback(err, result);
    })
}
const Select = (data, callback) => {
    db.get().collection(tableName).find(data).toArray(function (err, result) {
        return callback(err, result);
    });
}

module.exports = {
    getAllActiveLanguages,
    Select
}