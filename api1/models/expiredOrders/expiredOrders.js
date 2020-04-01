"use strict";
const joi = require("joi");
const db = require("../../library/mongodb");
const moment = require("moment");
const tableName = "completedOrders";
const ObjectID = require("mongodb").ObjectID;
/**
 * @function
 * @name saveRecord
 * @param {object} params - data coming from controller
 */
const saveRecord = (params, callback) => {
  db.get()
    .collection(tableName)
    .insert([params], (err, result) => {
      return callback(err, result);
    });
};
module.exports = {
  saveRecord
};
