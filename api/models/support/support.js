'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'support_txt'
const ObjectID = require('mongodb').ObjectID;
const logger = require('winston');  
/** 
 * @function
 * @name get 
 * @param {object} params - data coming from controller
 */
const get = (params, callback) => {
    db.get().collection(tableName).find(
      params)
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}

module.exports = {  
    get
}
