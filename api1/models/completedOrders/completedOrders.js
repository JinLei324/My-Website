
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'completedOrders'
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name makeAssigned 
* @param {object} params - data coming from controller
*/
const makeAssigned = (params, callback) => {

    db.get().collection(tableName)
        .insert(
            [params],
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name isExists 
* @param {object} params - data coming from controller
*/
const isExists = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            _id: params._id
        }, (err, result) => {
            return callback(err, result);
        });
}
/** 
* @function
* @name isExistsDriverIdWithStatus 
* @param {object} params - data coming from controller
*/
const isExistsDriverIdWithStatus = (params, callback) => {
    db.get().collection(tableName).find({
        "driverDetails.driverId": params.driverId, status: { $nin: [15] }
    }).sort({ '_id': -1 }).limit(11).skip(0).toArray((err, result) => { // normal select method
        return callback(err, result);
    });

}

/** 
* @function
* @name patchInvoiceAccountingDetails 
* @param {object} params - data coming from controller
*/
const patchInvoiceAccountingDetails = (params, callback) => {
    db.get().collection(tableName)
        .update(params.condition,
            {
                $set: params.data
            },
            (err, result) => { return callback(err, result); });
}

/** 
* @function
* @name isExistsWithOrderId 
* @param {object} params - data coming from controller
*/
const isExistsWithOrderId = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            orderId: params.orderId
        }, (err, result) => {
            return callback(err, result);
        });
}


/** 
* @function
* @name pushBookingActivity 
* @param {object} params - data coming from controller
*/
const pushBookingActivity = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ orderId: params.bid },
            params.logData,
            { upsert: true },
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name getOrders 
* @param {object} params - data coming from controller
*/
const getOrders = (params, callback) => {
    let condition = {
        "customerDetails.customerId": params.customerId
    }
    if (parseInt(params.storeType) != 0) {
        condition['storeType'] = parseInt(params.storeType)
    }
    db.get().collection(tableName).find(condition, { statusMsg: 1, currencySymbol: 1, currency: 1, orderId: 1, paidBy: 1, bookingDate: 1, pickup: 1, drop: 1, status: 1, driverDetails: 1, timeStamp: 1, storeAddress: 1, storeName: 1, totalAmount: 1, Items: 1, serviceType: 1, currency: 1, currencySymbol: 1, mileageMetric: 1, bookingType: 1, dueDatetime: 1, subTotalAmountWithExcTax: 1, exclusiveTaxes: 1, deliveryCharge: 1, subTotalAmount: 1, excTax: 1, bookingDateTimeStamp: 1, activityLogs: 1, dueDatetimeTimeStamp: 1 }).skip(params.skip || 0).limit(params.limit || 0).sort({
        'orderId': -1
    }).toArray((err, result) => { // normal select method
        return callback(err, result);
    });
}

/**
 * @function
 */
const getOrderById = (orderId, callback) => {
    db.get().collection(tableName)
        .findOne({
            orderId: orderId
        }, (err, result) => {
            return callback(err, result);
        });
}

const updateOrder = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(params.condition,
            {
                $set: params.set
            },
            {
                returnOriginal: false
            },
            (err, result) => {
                return callback(err, result);
            });
}


/** 
* @function
* @name getOrdersByDate 
* @param {object} params - data coming from controller
*/
const getOrdersByDate = (params, callback) => {
    db.get().collection(tableName).aggregate(params).toArray((err, result) => { // normal select method
        return callback(err, result);
    });
}
/** 
* @function
* @name isExistsWithCustomerId 
* @param {object} params - data coming from controller
*/
const isExistsWithCustomerId = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            "customerDetails.customerId": params.customerId.toString(),
            orderId: params.orderId
        }, { cartsAllowed: 1, storeType: 1, estimatedPackageValue: 1, cityId: 1, orderId: 1, bookingDate: 1, pickup: 1, drop: 1, status: 1, statusMsg: 1, driverDetails: 1, timeStamp: 1, storeAddress: 1, storeName: 1, customerDetails: 1, totalAmount: 1, Items: 1, drop: 1, paymentType: 1, subTotalAmount: 1, subTotalAmountWithExcTax: 1, exclusiveTaxes: 1, discount: 1, deliveryCharge: 1, storeLogo: 1, storePhone: 1, storeId: 1, storeCoordinates: 1, currency: 1, mileageMetric: 1, currencySymbol: 1, reviewed: 1 }, (err, result) => {
            return callback(err, result);
        });
}
/** 
* @function
* @name pushOrder 
* @param {object} params - data coming from controller
*/
const pushOrder = (params, callback) => {

    db.get().collection(tableName)
        .insert(
            [params],
            (err, result) => { return callback(err, result); });
}

/** 
* @function
* @name patchRating 
* @param {object} params - data coming from controller
*/
const patchRating = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ orderId: params.orderId },
            {
                $set: {
                    reviewByCustomer: {
                        review: params.review,
                        toDriver: params.driverRatLogs,
                        toOrder: params.orderRatLogs,
                        averageRatingForDriver: params.avdriverRating,
                        averageRatingForOrder: params.avOrderRating,
                        userId: new ObjectID(params.userId),
                        reviewAtiso: new Date(),
                        reviewAt: moment().unix()
                    },
                    reviewed: true
                }
            },
            { returnOriginal: false },
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name selectCity 
* @param {object} params - data coming from controller
*/
const selectCity = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            polygons: {
                $geoIntersects: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [params.long, params.lat]
                    }
                }
            }
        },
            { title: 1 }, ((err, city) => {
                return callback(err, city);
            }));
}
/** 
* @function
* @name getAll 
* @param {object} params - data coming from controller
*/
const getAll = (params, callback) => {
    db.get().collection(tableName).find({ "cities.isDeleted": false })
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}
/** 
* @function
* @name inZone 
* @param {object} params - data coming from controller
*/
const inZone = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            "cities.polygons": {
                $geoIntersects: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [params.long, params.lat]
                    }
                }
            }
        },
            { _id: 0, 'cities.$': 1 }, ((err, city) => {
                return callback(err, city);
            }));
}
/** 
* @function
* @name aggregate 
* @param {object} params - data coming from controller
*/
const aggregate = (params, callback) => {
    db.get().collection(tableName)
        .aggregate(params)
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}
/** 
* @function
* @name patchOrderData 
* @param {object} params - data coming from controller
*/
const patchOrderData = (params, callback) => {
    db.get().collection(tableName)
        .update(params.condition, {
            $set: params.data
        },
            (err, result) => { return callback(err, result); });
}
module.exports = {
    makeAssigned,
    isExistsDriverIdWithStatus,
    patchInvoiceAccountingDetails,
    isExistsWithOrderId,
    pushBookingActivity,
    getOrders,
    getOrdersByDate,
    isExistsWithCustomerId,
    pushOrder,
    patchRating,
    getOrderById,
    updateOrder,
    isExists,
    selectCity,
    getAll,
    inZone,
    aggregate,
    patchOrderData
}
