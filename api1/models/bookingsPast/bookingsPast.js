'use strict'

const tablename = 'completedOrders'//'bookingsPast';

const db = require('../../library/mongodb');
const logger = require('winston');
const ObjectID = require('mongodb').ObjectID;//to convert stringId to mongodb's objectId

const getBookingDataByBookingId = (bookingId) => {
    let condition = { orderId: parseInt(bookingId) };
    return new Promise((resolve, reject) => {
        db.get().collection(tablename)
            .findOne(condition, ((err, result) => {
                err ? reject(err) : resolve(result);
            }));
    });
}

const getAllPastBookings = (customerId) => {
    return new Promise((resolve, reject) => {
        var condition = { userId: new ObjectID(customerId) };
        db.get().collection(tablename)
            .find(condition).toArray((err, result) => {
                err ? reject(err) : resolve(result);
            });
    });
}

const read = (data, callback) => {
    db.get().collection(tablename)
        .findOne(data, ((err, result) => {
            return callback(err, result);
        }));

}

const findUpdate = (obj, callback) => {
    db.get().collection(tablename)
        .findOneAndUpdate(
            obj.query,
            obj.data,
            ((err, result) => {
                return callback(err, result);
            }));
}

const SelectWIthLimitAndIndex = (data, pagelimt, callback) => {
    db.get().collection(tablename).find(data).sort({ 'orderId': -1 }).limit(11).skip(pagelimt).toArray(function (err, result) {
        return callback(err, result);
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

const aggregate = (condition, callback) => {
    db.get().collection(tablename)
        .aggregate(condition, ((err, result) => { // aggregate method
            return callback(err, result);
        }));

}
module.exports = {
    createNewBooking,
    SelectWIthLimitAndIndex, getBookingDataByBookingId, getAllPastBookings, read, findUpdate, aggregate
};
