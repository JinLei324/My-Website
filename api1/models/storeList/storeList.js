
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'storeList'
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name post 
* @param {object} params - data coming from controller
*/
const post = (params, callback) => {

    db.get().collection(tableName)
        .insert(
            [{
                userId: params.userId ? params.userId : '',
                storeList: [{
                    status: 0,
                    statusMsg: 'Active',
                    createdBy: params.createdBy,
                    storeId: params.storeId ? params.storeId : '',
                    actions: [{
                        type: "Added",
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        storeId: params.storeId ? params.storeId : '',
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    }]
                }]
            }],
            (err, result) => { return callback(err, result); });
}


/** 
 * @function
 * @name pushStore
 * @param {object} params - data coming from controller
 */
const pushStore = (params, callback) => {
    db.get().collection(tableName)
        .update({ $and: [{ userId: params.userId }] },
            {
                $push: {
                    "storeList": {
                        status: 0,
                        statusMsg: 'Active',
                        createdBy: params.createdBy,
                        storeId: params.storeId ? params.storeId : '',
                        //  unitId: params.unitId ? params.unitId : '',
                        actions: [{
                            type: "Added",
                            timeStamp: moment().unix(),
                            isoDate: new Date(),
                            storeId: params.storeId ? params.storeId : '',
                            actorId: params.userId ? params.userId : '',
                            actorName: params.customerName ? params.customerName : "",
                            actionBy: params.createdBy
                        }]
                    }
                }
            },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name pullStore
 * @param {object} params - data coming from controller
 */
const pullStores = (params, callback) => {
    db.get().collection(tableName)
        .update({
            userId: params.userId,
            "storeList.storeId": params.storeId ? params.storeId : "",
            "storeList.status": 0
        },
            {
                $set: {
                    "storeList.$.status": 1,
                    "storeList.$.statusMsg": 'Inactive'
                },
                $push: {
                    "storeList.$.actions": {
                        type: "Removed",
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        storeId: params.storeId ? params.storeId : '',
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                        // },
                        // "actions": {
                        //     type: "Removed",
                        //     timeStamp: moment().unix(),
                        //     isoDate: new Date(),
                        //     actorId: params.userId ? params.userId : '',
                        //     actorName: params.customerName ? params.customerName : "",
                        //     actionBy: params.createdBy
                    }
                }

            },
            (err, result) => { return callback(err, result); });
}

const pushStores = (params, callback) => {
    db.get().collection(tableName)
        .update({
            userId: params.userId,
            "storeList.storeId": params.storeId ? params.storeId : "",
            "storeList.status": 1
        },
            {
                $set: {
                    "storeList.$.status": 0,
                    "storeList.$.statusMsg": 'Active'
                },
                $push: {
                    "storeList.$.actions": {
                        type: "Added",
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        storeId: params.storeId ? params.storeId : '',
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy,
                        // },
                        // "actions": {
                        //     type: "Removed",
                        //     timeStamp: moment().unix(),
                        //     isoDate: new Date(),
                        //     actorId: params.userId ? params.userId : '',
                        //     actorName: params.customerName ? params.customerName : "",
                        //     actionBy: params.createdBy
                    }
                }

            },
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
            userId: params.userId
        },
            { userId: 1 },
            (err, result) => {
                return callback(err, result);
            });
}
/** 
* @function
* @name isExistsWithItem 
* @param {object} params - data coming from controller
*/
const isExistsWithStore = (params, callback) => {
    // db.get().collection(tableName)
    //     .findOne({
    //         userId: params.userId,
    //         "storeList": {
    //             "$elemMatch": {
    //                 "storeId": params.storeId ? params.storeId : "", status: 0
    //             }
    //         }
    //     },
    //         (err, result) => {
    //             return callback(err, result);
    //         });

    db.get().collection(tableName).aggregate(
        [{
            $match: {
                "userId": params.userId
            }
        }, {
            "$unwind": "$storeList"
        }, {
            $match: {
                "storeList.storeId": params.storeId,
            }
        },])
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });

}

module.exports = {
    post,
    pullStores,
    pushStore,
    pushStores,
    isExists,
    isExistsWithStore
}
