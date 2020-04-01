'use strict'

const tablename = 'unassignOrders';//'bookingsUnassigned';

const db = require('../../library/mongodb');
const logger = require('winston');
const ObjectID = require('mongodb').ObjectID;//to convert stringId to mongodb's objectId

const getBookingDataByBookingId = (bookingId) => {
    let condition = { order_id: parseInt(bookingId) };
    return new Promise((resolve, reject) => {
        db.get().collection(tablename)
            .findOne(condition, ((err, result) => {
                err ? reject(err) : resolve(result);
            }));
    });
}

const createNewBooking = (data) => {
    return new Promise((resolve, reject) => {
        db.get().collection(tablename)
            .insert(data, ((err, result) => {
                err ? reject(err) : resolve(result);
            }));
    });
}
const Count = (condition, callback) => {
    db.get().collection(tablename).count(condition, function (err, count) {
        return callback(err, count);
    });
};

const getAllUnassignedBookings = (customerId) => {
    return new Promise((resolve, reject) => {
        var condition = { slave_id: new ObjectID(customerId) };
        db.get().collection(tablename)
            .find(condition).toArray((err, result) => {
                err ? reject(err) : resolve(result);
            });
    });
}

const SelectOne = (data, callback) => {
    db.get().collection(tablename).findOne(data, (function (err, result) {
        return callback(err, result);
    }));
}

const Update = (condition, data, callback) => {
    db.get().collection(tablename).update(condition, { $set: data }, (function (err, result) {
        return callback(err, result);
    }));
}

const Remove = (condition, callback) => {
    db.get().collection(tablename).remove(condition, (function (err, result) {
        return callback(err, result);
    }));
}

const UpdatePush = (condition, data, callback) => {
    db.get().collection(tablename).update(condition, data, (function (err, result) {
        return callback(err, result);
    }));
}
const UpdatePushData = (condition, data, callback) => {
    db.get().collection(tablename)
        .findOneAndUpdate(condition, data, { returnOriginal: false, new: true }, (err, result) => {
            return callback(err, result);
        });
}
const FINDONEANDUPDATE = (queryObj, cb) => {
    db.get().collection(tablename)
        .findOneAndUpdate(queryObj.query, queryObj.data, { returnOriginal: false }, (err, result) => {
            return cb(err, result);
        });
};

const findOneAndUpdate = (bookingId, data, callback) => {
    db.get().collection(tablename)
        .findOneAndUpdate(
            { bookingId: bookingId },
            data,
            ((err, result) => {
                return callback(err, result);
            }));
}

const updateWithPush = (condition, data, callback) => {
    db.get().collection(tablename).update(condition, { $push: data }, (function (err, result) {
        return callback(err, result);
    }));
}
module.exports = {
    SelectOne,
    Update,
    Remove,
    getBookingDataByBookingId,
    createNewBooking,
    getAllUnassignedBookings,
    UpdatePush,
    FINDONEANDUPDATE,
    findOneAndUpdate,
    updateWithPush,
    Count,
    UpdatePushData
};
