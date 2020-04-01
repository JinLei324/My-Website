"use strict";
const joi = require("joi");
const db = require("../../library/mongodb");
const moment = require("moment");
const tableName = "storesecondCategory";
const ObjectID = require("mongodb").ObjectID;
/**
 * @function
 * @name getById
 * @param {object} params - data coming from controller
 */
const getById = (params, callback) => {
  db.get()
    .collection(tableName)
    .find(
      {
        categoryId: params.id
      },
      { name: 1, description: 1, imageUrl: 1 }
    )
    .sort({ seqID: 1 })
    .toArray((err, result) => {
      // normal select method
      return callback(err, result);
    });
};
/**
 * @function
 * @name getByCatId
 * @param {object} params - data coming from controller
 */
const getByCatId = (params, callback) => {
  // db.get().collection(tableName)
  //     .aggregate([
  //         { $match: { "_id": params.businessId } },
  //         { $lookup: { "from": "secondCategory", "localField": "firstCategory", "foreignField": "categoryId", "as": "categories" } },
  //         { $unwind: "$categories" },
  //         { $project: { subCategoryName: "$categories.name", subCategoryId: "$categories._id", categoryId: "$categories.categoryId" } },
  //         //  { $lookup: { "from": "childProducts", "localField": "_id", "foreignField": "storeId", "as": "products" } },
  //     ])
  //     .toArray((err, result) => { // normal select method
  //         return callback(err, result);
  //     });

  db.get()
    .collection(tableName)
    .find(
      {
        categoryId: params.catId
      },
      {
        name: 1,
        categoryId: 1,
        subCategoryName: 1,
        subCategoryDesc: 1,
        description: 1,
        imageUrl: 1
      }
    )
    .sort({ seqID: 1 })
    .toArray((err, result) => {
      // normal select method
      return callback(err, result);
    });
};
const SelectOne = (data, callback) => {
  db.get().collection(tableName).findOne(data, (function (err, result) {
    return callback(err, result);
  }));
}

const update = (params, callback) => {
  db.get().collection(tableName).update(params.q, params.data, (err, result) => {
    return callback(err, result)
  })
}
module.exports = {
  getById,
  getByCatId,
  SelectOne,
  update

}
