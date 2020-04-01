'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')

const ObjectID = require('mongodb').ObjectID;

const getAllOrders = (params, tableName, callback) => {
    
    console.log("get All orders");
    
    
    if(tableName=="newOrder" && params.q.bookingDateTimeStamp==undefined){
        let p1 = new Promise((resolve, reject) => {
            db.get().collection('appConfig').findOne({}, function(err, result) {
                if (err) throw err;
                resolve (result.dispatch_settings.delayDisplayTime);
                    
            });
        });
        p1.then(value=>{
            let endDelayDisplayTime = new Date().getTime() / 1000 ;
            
            endDelayDisplayTime =Math.floor(endDelayDisplayTime - value);
            
            
            params.q.bookingDateTimeStamp={ '$lte': endDelayDisplayTime};
            
            db.get().collection(tableName).find(params.q, params.options.option || {}).sort({ orderId: 1 }).skip(params.options.skip).limit(params.options.limit).toArray((err, result) => {
                    
                return callback(err, result);
            });
        });

    }else{          
        
        db.get().collection(tableName).find(params.q, params.options.option || {}).sort({ orderId: 1 }).skip(params.options.skip).limit(params.options.limit).toArray((err, result) => {
            
            return callback(err, result);
        });
    }
    
}

/** 
 * @function
 * @name getData 
 * @param {object} params - data coming from controller
 */
const getAllNew = (params, tableName, callback) => {

    //var getAppConfig = db.appConfig.find_one('appConfig');
    console.log("getAllNew");
    var delayDisplayTime=0;
    var endDelayDisplayTime = new Date().getTime() / 1000 ;
    //if(tableName=="newOrder" && params.q.bookingDateTimeStamp==undefined){
        db.get().collection('appConfig').findOne({}, function(err, result) {
            if (err) throw err;
            delayDisplayTime = result.dispatch_settings.delayDisplayTime;
            endDelayDisplayTime = Math.floor(endDelayDisplayTime - delayDisplayTime);
            console.log(delayDisplayTime);
            console.log(endDelayDisplayTime);
            params.q.bookingDateTimeStamp={ $gte: endDelayDisplayTime};
            console.log(params);
        });
    //}

   

    db.get().collection(tableName)
        .find(params.q, params.options.option || {}).sort({ orderId: -1 }).skip(params.options.skip).limit(params.options.limit).toArray((err, result) => {
            return callback(err, result);
        });
}


const getAllPickups = (params, tableName, callback) => {
    db.get().collection(tableName)
        .find(params.q, params.options.option || {}).sort({ orderId: -1 }).skip(params.options.skip).limit(params.options.limit).toArray((err, result) => {
            return callback(err, result);
        });
}

const getAllunassign = (params, tableName, callback) => {
    db.get().collection(tableName)
        .find(params.q, params.options.option || {}).sort({ bookingDate: -1 }).skip(params.options.skip).limit(params.options.limit).toArray((err, result) => {
            return callback(err, result);
        });
}

const getAllassign = (params, tableName, callback) => {
    db.get().collection(tableName)
        .find(params.q, params.options.option || {}).sort({ orderId: -1 }).skip(params.options.skip).limit(params.options.limit).toArray((err, result) => {
            return callback(err, result);
        });
}


const getAllCompleted = (params, tableName, callback) => {
    db.get().collection(tableName)
        .find(params.q, params.options.option || {}).sort({ orderId: -1 }).skip(params.options.skip).limit(params.options.limit).toArray((err, result) => {
            return callback(err, result);
        });
}

const getAllExpired = (params, tableName, callback) => {
    db.get().collection(tableName)
        .find(params.q, params.options.option || {}).sort({ orderId: -1 }).skip(params.options.skip).limit(params.options.limit).toArray((err, result) => {
            return callback(err, result);
        });
}

const getAllindispatch = (params, tableName, callback) => {
    db.get().collection(tableName)
        .find(params.q, params.options.option || {}).sort({ orderId: -1 }).skip(params.options.skip).limit(params.options.limit).toArray((err, result) => {
            return callback(err, result);
        });
}


const getOrder = (params, tableName, callback) => {
    db.get().collection(tableName)
        .findOne({ orderId: params.orderId }, (err, result) => {
            return callback(err, result);
        });
}

const orderCancel = (params, tableName, callback) => {
    db.get().collection(tableName)
        .update({ "orderId": params.orderId }, { $set: { status: params.status, statusMsg: params.statusMsg, statusText: params.statusText }, $push: { managerLogs: { "managerId": params.managerId, "managerName": params.managerName, "actionType": params.status, "actionTime": params.timestamp, "cancelReason": params.reason } } }, (err, result) => {
            return callback(err, result);
        })
}

const orderStatus = (params, tableName, callback) => {
    db.get().collection(tableName)
        .update({ "orderId": params.orderId }, { $set: { status: params.status, inDispatch: false, statusMsg: params.statusMsg, statusText: params.statusText }, $push: { managerLogs: { "managerId": params.managerId, "managerName": params.managerName, "actionType": params.status, "actionTime": params.timestamp } } }, (err, result) => {
            return callback(err, result);
        })
}

const orderDueTime = (params, tableName, callback) => {
    db.get().collection(tableName)
        .update({ "orderId": params.orderId }, { $set: { status: params.status, statusMsg: params.statusMsg, statusText: params.statusText, dueDatetime: params.dueDatetime }, $push: { managerLogs: { "managerId": params.managerId, "managerName": params.managerName, "actionType": params.status, "actionTime": params.timestamp, "reason": params.reason } } }, (err, result) => {
            return callback(err, result);
        })
}

const insert = (params, tableName, callback) => {
    db.get().collection(tableName)
        .insert(params, (err, result) => {
            return callback(err, result);
        })
}

const remove = (params, tableName, callback) => {
    db.get().collection(tableName)
        .remove({ "orderId": params.orderId }, (err, result) => {
            return callback(err, result);
        })
}


const count = (params, tableName, callback) => {
    db.get().collection(tableName)
        .count(params, (err, result) => {
            return callback(err, result);
        });
}

const updateDriversLog = (params, orderId, dispatchCount, tableName, callback) => {
    db.get().collection(tableName)
        .update({ orderId: orderId }, { $push: { driversLog: params }, $set: { dispatchCount: dispatchCount, inDispatch: true } }, (err, result) => {
            return callback(err, result);
        })
}


const update = (params, tableName, callback) => {
    db.get().collection(tableName)
        .update(params.q, { $set: params.data }, (err, result) => {
            return callback(err, result)
        })
}

const getAllSearch = (params, tableName, callback) => {
    db.get().collection(tableName)
        .find(params.q).toArray((err, result) => {
            return callback(err, result);
        });
}

const findOneAndUpdate = (params, tableName, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(params.q, params.data, { returnOriginal: false }, (err, result) => {
            return callback(err, result)
        })
}

/** 
* @function
* @name patchExpiry 
* @param {object} params - data coming from controller
*/
const patchExpiry = (params, tableName, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ orderId: params.orderId },
            {
                $set: {
                    // "accouting.cancelationFee": params.cancFee,
                    // "accouting.storeCommPer": params.storeCommPer,
                    // "accouting.driverCommPer": params.driverCommPer,
                    // "accouting.taxes": params.taxes,
                    // cancCartTotal: params.cancCartTotal,
                    // cancDeliveryFee: params.cancDeliveryFee,
                    status: params.status,
                    statusMsg: params.statusMsg,
                    statusText: 'Order has expired',
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
                        "msg": "expired Booking",
                        "time": moment().unix(),
                        "isoDate": new Date(),
                        "lat": 0,
                        "long": 0
                    },
                }
            },
            { returnOriginal: false },
            (err, result) => { return callback(err, result); });
}
const aggregate = (params, tableName, callback) => {
    db.get().collection(tableName)
        .aggregate(params)
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}
module.exports = { getAllOrders, aggregate, getAllExpired, getAllSearch, orderDueTime, findOneAndUpdate, getAllNew, getAllPickups, getAllunassign, getAllassign, getAllCompleted, getOrder, orderCancel, orderStatus, insert, remove, count, updateDriversLog, getAllindispatch, update, patchExpiry };