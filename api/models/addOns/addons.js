'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'addOns'
const ObjectID = require('mongodb').ObjectID;
const logger = require('winston');
const elasticClient = require('../elasticSearch');
const indexName = process.env.ElasticProductIndex;
/** 
 * @function
 * @name get all addons 
 * @param {object} params - query params coming from controller
 */
const getAddOnDetailsWithAddOnIds = (params, callback) => {
    db.get().collection("storeAddOns").find(params).toArray(function (err, result){
    	  return callback(err, result);
    })
}


module.exports = {
    getAddOnDetailsWithAddOnIds
}