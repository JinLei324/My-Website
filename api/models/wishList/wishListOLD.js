
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'wishList'
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name create 
* @param {object} params - data coming from controller
*/
const create = (params, callback) => {

    db.get().collection(tableName)
        .insert(
            [{
                userId: params.userId ? params.userId : '',
                storeId: params.storeId ? params.storeId : '',
                name: params.name ? params.name : '',
                createdBy: params.createdBy,
                "status": 0,
                "statusMsg": 'active',
                actions: [{
                    type: "Created wishlist",
                    timeStamp: moment().unix(),
                    isoDate: new Date(),
                    actorId: params.userId ? params.userId : '',
                    actorName: params.customerName ? params.customerName : "",
                    actionBy: params.createdBy
                }]
            }],
            (err, result) => {
                return callback(err, result);
            });
}


/** 
 * @function
 * @name pushItems 
 * @param {object} params - data coming from controller
 */
const pushItems = (params, callback) => {
    db.get().collection(tableName)
        .update({ $and: [{ _id: new ObjectID(params.list.id), userId: params.userId, status: 0 }] },
            {
                $push: {
                    "products": {
                        status: 0,
                        statusMsg: 'Added',
                        createdBy: params.createdBy,
                        parentProductId: params.parentProductId ? params.parentProductId : '',
                        storeId: params.storeId ? new ObjectID(params.storeId) : "",
                        childProductId: params.childProductId ? new ObjectID(params.childProductId) : '',
                        // "unitId": params.unitId ? params.unitId : "",
                        actions: [{
                            type: "Added",
                            timeStamp: moment().unix(),
                            isoDate: new Date(),
                            childProductId: params.childProductId,
                            actorId: params.userId ? params.userId : '',
                            actorName: params.customerName ? params.customerName : "",
                            actionBy: params.createdBy
                        }]
                    }
                }
            },
            //   { multi: true },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name patchData 
 * @param {object} params - data coming from controller
 */
const patchData = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ $and: [{ _id: new ObjectID(params.listId), userId: params.userId, status: 0 }] },
            {
                $set: {
                    "name": params.name ? params.name : "",
                    "image": params.image ? params.image : "",
                },
                $push: {
                    "actions": {
                        type: "Modified (image added)",
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    }
                }
            },
            { returnOriginal: false },
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
            _id: new ObjectID(params.list.id), userId: params.userId, "products.childProductId": params.childProductId ? new ObjectID(params.childProductId) : "",
            // "products.parentProductId": params.parentProductId ? params.parentProductId : "",
            // "products.unitId": params.unitId ? params.unitId : "",
            "products.status": 0
        },
            {
                $set: {
                    "products.$.status": 1,
                    "products.$.statusMsg": 'Removed'
                },
                $push: {
                    "products.$.actions": {
                        type: "Removed",
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        childProductId: params.childProductId,
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    },
                    "actions": {
                        type: "Removed",
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        childProductId: params.childProductId,
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    }
                }
            },
            (err, result) => { return callback(err, result); });
}

/** 
 * @function
 * @name getWishItems 
 * @param {object} params - data coming from controller
 */
const getWishItems = (params, callback) => {
    db.get().collection(tableName)
        .aggregate(params)
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}

/** 
 * @function
 * @name removeListDetail 
 * @param {object} params - data coming from controller
 */
const removeListDetail = (params, callback) => {

    db.get().collection(tableName)
        .update({ $and: [{ status: 0 }, { userId: params.userId }, { _id: new ObjectID(params.listId) }] },
            {
                $set: {
                    "status": 1,
                    "statusMsg": 'Inactive',
                    "removedFromListOn": moment().unix()
                },
                $push: {
                    "actions": {
                        type: "Removed",
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
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
const isExistsWithItem = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            _id: new ObjectID(params.list.id),
            userId: params.userId,
            "status": 0,
            "products": {
                "$elemMatch": {
                    "childProductId": params.childProductId ? new ObjectID(params.childProductId) : "",
                    // "parentProductId": params.parentProductId ? params.parentProductId : "",
                    // "unitId": params.unitId ? params.unitId : "",
                    status: 0
                }
            }
        },
            (err, result) => {
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
                    "status": 1,
                    "statusMsg": 'booking completed'
                }
            },
            (err, result) => { return callback(err, result); });
}
module.exports = {
    create,
    pullItems,
    pushItems,
    getWishItems,
    removeListDetail,
    isExists,
    isExistsWithItem,
    clearCart,
    patchData
}
