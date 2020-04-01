'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')

const ObjectID = require('mongodb').ObjectID;
const tableName = 'products';
const insert = (params, callback) => {
     db.get().collection(tableName)
    .insert(params, (err, result) => {
         return callback(err, result);
    })
}

const update = (params, callback) => {
     db.get().collection(tableName)
     .update(params.q, { $set : params.data }, (err, result) => {
       return callback(err, result) 
    })
}

const get = (params, callback) => {
    db.get({}).collection(tableName)
        .find({}).sort({ _id: -1 }).toArray( (err, result) => {
            return callback(err, result[0]);
        });
}

const getOne = (params, callback) => {
      db.get().collection(tableName)
      .findOne(params, (err, result) => {
           return callback(err, result);
      })
}

const deleteItem = (params, callback) => {
     db.get().collection(tableName)
     .remove(params, (err, result) => {
          return callback(err, result);
     })
         
} 

const GetProducts = (params, callback) => {
     var regexValue = '^' + params.productName + '.*';
        var regEx = { $regex: regexValue, $options: "i" }
     db.get({}).collection(tableName)
         .find({"storeCategoryId":params.storeCategoryId,"firstCategoryId":params.categoryId,"productName": regEx},{pName:1}).toArray( (err, result) => {
             return callback(err, result);
         });
 }

const readAll = (condition, callback) => {
    db.get().collection(tableName).find(condition).toArray((err, result) => {
        return callback(err, result);
    });
}


module.exports = { insert, update, get, getOne, deleteItem,GetProducts, readAll };