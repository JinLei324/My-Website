'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'zonalPricing'
const ObjectID = require('mongodb').ObjectID;
const logger = require('winston');

/** 
* @function
* @name getById 
* @param {object} params - data coming from controller
*/
const get = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, (err, result) => {
            return callback(err, result);
        });
}

module.exports = {
   
    get
}
