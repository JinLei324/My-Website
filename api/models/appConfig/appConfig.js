"use strict";
const joi = require("joi");
const db = require("../../library/mongodb");
const moment = require("moment");
const tableName = 'appConfig';
const ObjectID = require("mongodb").ObjectID;

/**
 * @function
 * @name get
 * @param {object} params - data coming from controller
 */
const get = (params, callback) => {
  db.get()
    .collection(tableName)
    .findOne({}, (err, result) => {
      return callback(err, result);
    });
};
/**
 * @function
 * @name getAppConfigration
 * @param {object} params - data coming from controller
 */
const getAppConfigration = (params, callback) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(tableName)
      .findOne({}, (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      });
  });
};
const getOne = (params, callback) => {
  db.get()
    .collection(tableName)
    .findOne({}, (err, result) => {
      return callback(err, result);
    });
};
function updateRotationKey(condition, data, callback) {
  db.get()
    .collection(tableName)
    .findOneAndUpdate(condition, data, { returnOriginal: false }, (err, result) => {
      return callback(err, result);
    });
}

const fineAndUpdate = (condition, data, callback) => {
  db.get()
    .collection(tableName)
    .update(condition, { $set: data }, function (err, result) {
      return callback(err, result);
    });
};
module.exports = {
  get,
  getAppConfigration,
  getOne,
  updateRotationKey,
  fineAndUpdate
};
