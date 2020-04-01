'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'symptom'
const ObjectID = require('mongodb').ObjectID;
 
const get = (params, callback) => {
    db.get().collection(tableName)
     .find({"status" : 1},{name:1,description:1,bannerImage:1}).limit(10).toArray((err, result) => {
        return callback(err, result);
    });
}
module.exports = { 
    get
}