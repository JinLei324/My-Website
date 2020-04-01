"use strict";
const joi = require("joi");
const db = require("../../library/mongodb");
const moment = require("moment");
const tableName = "estimationFare";
const ObjectID = require("mongodb").ObjectID;
/**
 * @function
 * @name save
 * @param {object} params - data coming from controller
 */
const save = (params, callback) => {
  db.get()
    .collection(tableName)
    .insert([params], (err, result) => {
      return callback(err, result);
    });
};
module.exports = {
  save
};
