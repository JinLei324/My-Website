"use strict";
const joi = require("joi");
const db = require("../../library/mongodb");
const moment = require("moment");
const tableName = "PythonOffersTest";
const ObjectID = require("mongodb").ObjectID;
const client = require("../../library/redis");
const logger = require("winston");

// Get all the orffers available by store id

const getStoreOffersByStoreId = (params, callback) => {
  db.get()
    .collection(tableName)
    .find({ storeId: params.storeId })
    .sort({ _id: -1 })
    .limit(1)
    .toArray((err, result) => {
      return callback(err, result);
    });
};

/**
 * @function
 * @name read
 * @param {object} params - data coming from controller
 */
const read = (params, callback) => {

  db.get()
    .collection(tableName)
    .find(params, {
      name: 1,
      offerType: 1,
      applicableOnStatus: 1,
      images: 1,
      description: 1,
      storeId: 1,
      status: 1,
      minimumPurchaseQty: 1,
      perUserLimit: 1,
      globalUsageLimit: 1,
      discountValue: 1,
      endDateTime: 1,
      startDateTime: 1,
      offerTypeString: 1
    })
    .toArray((err, result) => {
      // normal select method
      return callback(err, result);
    });
};
module.exports = {
  read,
  getStoreOffersByStoreId
};
