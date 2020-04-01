"use strict";

const tablename = "completedOrders";

const db = require("../../library/mongodb");
const logger = require("winston");
const ObjectID = require("mongodb").ObjectID; //to convert stringId to mongodb's objectId

const getBookingDataByBookingId = bookingId => {
  let condition = { orderId: parseInt(bookingId) };
  return new Promise((resolve, reject) => {
    db.get()
      .collection(tablename)
      .findOne(condition, (err, result) => {
        err ? reject(err) : resolve(result);
      });
  });
};

const updateBookingDropLocation = (bookingId, data) => {
  return new Promise((resolve, reject) => {
    let condition = { orderId: parseInt(bookingId) };
    db.get()
      .collection(tablename)
      .update(condition, { $set: data }, (err, result) => {
        err ? reject(err) : resolve(result);
      });
  });
};

const getOnGoingRideBookings = customerId => {
  return new Promise((resolve, reject) => {
    var condition = {
      slave_id: new ObjectID(customerId),
      service_type: 2,
      status: { $in: [6, 7, 8] }
    };
    db.get()
      .collection(tablename)
      .find(condition)
      .toArray((err, result) => {
        err ? reject(err) : resolve(result);
      });
  });
};

const getAllAssignedBookings = customerId => {
  return new Promise((resolve, reject) => {
    var condition = { slave_id: new ObjectID(customerId) };
    db.get()
      .collection(tablename)
      .find(condition)
      .toArray((err, result) => {
        err ? reject(err) : resolve(result);
      });
  });
};

const Select = (data, callback) => {
  db.get()
    .collection(tablename)
    .find(data)
    .toArray(function(err, result) {
      return callback(err, result);
    });
};

const FINDONEANDUPDATE = (queryObj, cb) => {
  db.get()
    .collection(tablename)
    .findOneAndUpdate(queryObj.query, queryObj.data, queryObj.options || {}, (err, result) => {
      return cb(err, result);
    });
};

const createNewBooking = data => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(tablename)
      .insert(data, (err, result) => {
        err ? reject(err) : resolve(result);
      });
  });
};

const Remove = (condition, callback) => {
  db.get()
    .collection(tablename)
    .remove(condition, function(err, result) {
      return callback(err, result);
    });
};

const Update = (condition, data, callback) => {
  db.get()
    .collection(tablename)
    .update(condition, { $set: data }, function(err, result) {
      return callback(err, result);
    });
};

const SelectOne = (data, callback) => {
  db.get()
    .collection(tablename)
    .findOne(data, function(err, result) {
      return callback(err, result);
    });
};

module.exports = {
  Select,
  SelectOne,
  getBookingDataByBookingId,
  getOnGoingRideBookings,
  updateBookingDropLocation,
  getAllAssignedBookings,
  FINDONEANDUPDATE,
  createNewBooking,
  Update,
  Remove
};
