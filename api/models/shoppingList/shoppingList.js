
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'shoppingList'
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
                shoppingList: [{
                    status: 0,
                    statusMsg: 'active',
                    createdBy: params.createdBy,
                    // parentProductId: params.parentProductId ? params.parentProductId : '',
                    childProductId: params.childProductId ? params.childProductId : '',
                    //   unitId: params.unitId ? params.unitId : '',
                    actions: [{
                        type: "Added",
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        childProductId: params.childProductId ? params.childProductId : '',
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
 * @name pushItems 
 * @param {object} params - data coming from controller
 */

const pushItemss = (params, callback) => {
    db.get().collection(tableName)
        .update({
            userId: params.userId,
            "shoppingList": { "$elemMatch": { "childProductId": params.childProductId ? params.childProductId : "", "status": 1 } },
        },
            {
                $set: {
                    "shoppingList.$.status": 0,
                    "shoppingList.$.statusMsg": 'Active'
                },
                $push: {
                    "shoppingList.$.actions": {
                        type: "Added",
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    },
                }

            },
            (err, result) => { return callback(err, result); });
}
const pushItems = (params, callback) => {
    db.get().collection(tableName)
        .update({ $and: [{ userId: params.userId }] },
            {
                $push: {
                    "shoppingList": {
                        status: 0,
                        statusMsg: 'Active',
                        createdBy: params.createdBy,
                        // parentProductId: params.parentProductId ? params.parentProductId : '',
                        childProductId: params.childProductId ? params.childProductId : '',
                        //  unitId: params.unitId ? params.unitId : '',
                        actions: [{
                            type: "Added",
                            timeStamp: moment().unix(),
                            isoDate: new Date(),
                            childProductId: params.childProductId ? params.childProductId : '',
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
 * @name pullItems 
 * @param {object} params - data coming from controller
 */
const pullItems = (params, callback) => {
    db.get().collection(tableName)
        .update({
            "userId": params.userId,
            "shoppingList": { "$elemMatch": { "childProductId": params.childProductId ? params.childProductId : "", "status": 0 } },
        },
            {
                $set: {
                    "shoppingList.$.status": 1,
                    "shoppingList.$.statusMsg": 'Inactive'
                },
                $push: {
                    "shoppingList.$.actions": {
                        type: "Removed",
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    },
                }

            },
            (err, result) => { return callback(err, result); });
}

/** 
 * @function
 * @name getAll 
 * @param {object} params - data coming from controller
 */
const getAll = (params, callback) => {
    db.get().collection(tableName).aggregate(
        [
            {
                $match: {
                    "userId": params.userId
                }
            },
            { "$unwind": "$shoppingList" },
            {
                $match: {
                    $or: [{ "shoppingList.status": 0 }
                    ]
                }
            },
            {
                $group: {
                    _id: "$shoppingList.storeId",
                    cartId: { "$first": "$_id" },
                    storeName: { "$first": "$items.storeName" },
                    storeId: { "$first": "$items.storeId" },
                    storeLogo: { "$first": "$items.storeLogo" },
                    storeLatitude: { "$first": "$items.storeCoordinates.latitude" },
                    storeLongitude: { "$first": "$items.storeCoordinates.longitude" },
                    storeAddress: { "$first": "$items.storeAddress" },
                    storeTotalPrice: { "$sum": { "$multiply": ["$items.quantity", "$items.unitPrice"] } },
                    products: {
                        $push:
                        {
                            itemName: "$shoppingList.itemName",
                            quantity: "$shoppingList.quantity",
                            unitPrice: "$items.unitPrice",
                            itemImageURL: "$items.itemImageURL",
                            addedToCartOn: "$createdByUserId.addedToCartOn",
                            // parentProductId: "$items.parentProductId",
                            childProductId: "$items.childProductId"
                        }
                    }
                }
            },
            { $project: { _id: 0, cartId: 1, storeName: 1, storeAddress: 1, storeId: 1, storeLogo: 1, storeTotalPrice: 1, storeLatitude: 1, storeLongitude: 1, products: 1 } }
        ])
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}

/** 
 * @function
 * @name removeCartDetail 
 * @param {object} params - data coming from controller
 */
const removeCartDetail = (params, callback) => {

    db.get().collection(tableName)
        .update({ $and: [{ status: 0 }, { userId: params.userId }, { _id: new ObjectID(params.cartId) }, { "items": { $elemMatch: { childProductId: params.childProductId, "removedFromCartOn": { $exists: false } } } }] },
            {
                $set: {
                    "items.$.removedFromCartOn": moment().unix(),
                    "items.$.statusMsg": 'Removed'
                },
                $push: {
                    "items.$.actions": {
                        type: "Removed",
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        childProductId: params.childProductId ? params.childProductId : '',
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    },
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
const isExistsWithItem = (params, callback) => {





    // db.get().collection(tableName)
    //     .findOne({
    //         userId: params.userId,
    //         "shoppingList": {
    //             "$elemMatch": {
    //                 "childProductId": params.childProductId ? params.childProductId : "",
    //                 //"unitId": params.unitId ? params.unitId : "",
    //                 "parentProductId": params.parentProductId ? params.parentProductId : "", status: 0
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
            "$unwind": "$shoppingList"
        }, {
            $match: {
                "shoppingList.childProductId": params.childProductId ? params.childProductId : "",
            }
        }])
        .toArray((err, result) => { // normal select method

            return callback(err, result);
        });
}

/** 
 * @function
 * @name clearCart 
 * @param {object} params - data coming from controller
 */
const clearCart = (params, callback) => {
    db.get().collection(tableName)
        .update({ _id: new ObjectID(params.cartId) },
            {
                $set: {
                    orderedBy: {
                        userId: params.userId ? params.userId : "",
                        orderId: params.orderId ? params.orderId : "",
                        timeStamp: moment().unix()
                    },
                    "status": 1
                }
            },
            (err, result) => { return callback(err, result); });
}
module.exports = {
    post,
    pullItems,
    pushItems,
    getAll,
    removeCartDetail,
    isExists,
    isExistsWithItem,
    clearCart,
    pushItemss
}
