
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'orderAccepted'
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name postOrders 
* @param {object} params - data coming from controller
*/
const postOrders = (params, callback) => {

    db.get().collection(tableName)
        .insertMany(
            params,
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name removeFromAccepted
* @param {object} params - data coming from controller
*/
const removeFromAccepted = (params, callback) => {
    db.get().collection(tableName)
        .remove({ orderId: params.orderId },
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
* @name isExistsDriverId 
* @param {object} params - data coming from controller
*/
const isExistsDriverId = (params, callback) => {
    db.get().collection(tableName)
        .find({
            driverId: params.driverId,
            status: params.status
        }).toArray((err, result) => {
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
        "driverDetails.driverId": params.driverId
    }).sort({ '_id': -1 }).limit(11).skip(0).toArray((err, result) => { // normal select method
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
    db.get().collection(tableName).find(condition, { statusMsg: 1, currencySymbol: 1, currency: 1, orderId: 1, bookingDate: 1, pickup: 1, drop: 1, status: 1, driverDetails: 1, timeStamp: 1, storeAddress: 1, storeName: 1, totalAmount: 1, Items: 1, serviceType: 1, bookingType: 1, dueDatetime: 1, subTotalAmountWithExcTax: 1, exclusiveTaxes: 1, deliveryCharge: 1, subTotalAmount: 1, excTax: 1, bookingDateTimeStamp: 1, activityLogs: 1, dueDatetimeTimeStamp: 1, isCominigFromStore: 1, storeType: 1, storeTypeMsg: 1 }).skip(params.skip || 0).limit(params.limit || 0).sort({
        'orderId': -1
    }).toArray((err, result) => { // normal select method // normal select method
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
        }, { orderId: 1, bookingDate: 1, statusMsg: 1, estimatedPackageValue: 1, pickup: 1, drop: 1, status: 1, driverDetails: 1, timeStamp: 1, storeAddress: 1, storeName: 1, totalAmount: 1, customerDetails: 1, Items: 1, drop: 1, paymentType: 1, subTotalAmountWithExcTax: 1, exclusiveTaxes: 1, subTotalAmount: 1, discount: 1, deliveryCharge: 1, storeLogo: 1, storePhone: 1, storeId: 1, storeCoordinates: 1, currency: 1, mileageMetric: 1, currencySymbol: 1, reviewed: 1 }, (err, result) => {
            return callback(err, result);
        });
}

/** 
* @function
* @name cancelOrders 
* @param {object} params - data coming from controller
*/
const cancelOrders = (params, callback) => {
    params.createdBy = params.createdBy.charAt(0).toUpperCase() + params.createdBy.substr(1);
    db.get().collection(tableName)
        .findOneAndUpdate({ orderId: params.orderId },
            {
                $set: {
                    "accouting.cancelationFee": params.cancFee,
                    "accouting.storeCommPer": params.storeCommPer,
                    "accouting.driverCommPer": params.driverCommPer,
                    "accouting.taxes": params.taxes,
                    cancCartTotal: params.cancCartTotal,
                    cancDeliveryFee: params.cancDeliveryFee,
                    status: params.status,
                    statusMsg: params.statusMsg,
                    statusText: params.statusMsg,
                    "timeStamp.cancelledBy": {
                        "statusUpdatedBy": params.createdBy,
                        "userId": params.userId,
                        "timeStamp": moment().unix(),
                        "isoDate": new Date(),
                        "location": {
                            "longitude": params.longitude,
                            "latitude": params.latitude
                        },
                        "message": params.reason ? params.reason : "",
                        "ip": params.ipAddress ? params.ipAddress : ""
                    }
                },
                $push: {
                    activities: {
                        "bid": params.orderId,
                        "status": params.status,
                        "msg": params.createdBy + " cancelled Booking",
                        "isoDate": new Date(),
                        "time": moment().unix(),
                        "lat": params.latitude,
                        "long": params.longitude
                    },
                }
            },
            { returnOriginal: false },
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name patchOrderss 
* @param {object} params - data coming from controller
*/
const patchOrderss = (params, callback) => {
    // var update = {
    //     $set: {}
    // };
    // update.$set[params.createdBy] = {
    //     "stausUpdatedBy": params.createdBy,
    //     "userId": params.driverId,
    //     "timeStamp": moment().unix(),
    //     "location": {
    //         "longitude": params.longitude,
    //         "latitude": params.latitude
    //     },
    //     "message": params.extraNote ? params.extraNote : "",
    //     "ip": params.ipAddress ? params.ipAddress : ""
    // };

    db.get().collection(tableName)
        .findOneAndUpdate({ orderId: params.orderId },
            //     update,
            {
                $set: {
                    totalAmount: params.totalAmount,
                    Items: params.items,
                    deliveryCharge: params.deliveryFee,
                    subTotalAmount: params.subTotalAmount,
                    subTotalAmountWithExcTax: params.subTotalAmountWithExcTax,
                    cartDiscount: params.cartDiscount,
                    cartTotal: params.cartTotal,
                    excTax: params.excTax,
                    exclusiveTaxes: params.exclusiveTaxes,
                    "timeStamp.updatedBy": {
                        "statusUpdatedBy": params.createdBy,
                        "userId": params.driverId,
                        "timeStamp": moment().unix(),
                        "isoDate": new Date(),
                        "location": {
                            "longitude": params.longitude,
                            "latitude": params.latitude
                        },
                        "message": params.extraNote ? params.extraNote : "",
                        "ip": params.ipAddress ? params.ipAddress : ""
                    }
                }
            },
            { returnOriginal: false },
            (err, result) => { return callback(err, result); });
}
const returnPatchOrder = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ orderId: params.orderId },
            //     update,
            {
                $set: {
                    totalAmount: params.totalAmount,
                    Items: params.items,
                    deliveryCharge: params.deliveryFee,
                    subTotalAmount: params.subTotalAmount,
                    subTotalAmountWithExcTax: params.subTotalAmountWithExcTax,
                    cartDiscount: params.cartDiscount,
                    cartTotal: params.cartTotal,
                    excTax: params.excTax,
                    exclusiveTaxes: params.exclusiveTaxes,
                    "timeStamp.updatedBy": {
                        "statusUpdatedBy": params.createdBy,
                        "userId": params.driverId,
                        "timeStamp": moment().unix(),
                        "isoDate": new Date(),
                        "location": {
                            "longitude": params.longitude,
                            "latitude": params.latitude
                        },
                        "message": params.extraNote ? params.extraNote : "",
                        "ip": params.ipAddress ? params.ipAddress : ""
                    }
                }
            },
            { returnOriginal: false },
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name patchOrders 
* @param {object} params - data coming from controller
*/
const patchOrders = (params, callback) => {
    db.get().collection(tableName)
        .update(params.condition, {
            $set: params.data
        },
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name remove
* @param {object} params - data coming from controller
*/
const remove = (params, callback) => {
    db.get().collection(tableName)
        .remove(params,
            (err, result) => { return callback(err, result); });
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
module.exports = {
    postOrders,
    isExistsWithOrderId,
    isExistsDriverId,
    patchOrderData,
    isExistsDriverIdWithStatus,
    pushBookingActivity,
    removeFromAccepted,
    getOrders,
    isExistsWithCustomerId,
    patchOrders,
    patchOrderss,
    returnPatchOrder,
    cancelOrders,
    remove,
    getOrdersByDate
}
