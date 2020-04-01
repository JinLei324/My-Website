'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'orderType'
const ObjectID = require('mongodb').ObjectID; 

/** 
* @function
* @name getAll 
* @param {object} params - data coming from controller
*/
const getAll = (params, callback) => {
    db.get().collection(tableName).find({ "status": 1, "type": params.type })
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}

module.exports = {
    getAll
}