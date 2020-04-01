
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'cart'
const ObjectID = require('mongodb').ObjectID;
const logger = require('winston');
/**
* @function
* @name postSave
* @param {object} params - data coming from controller
*/
const postSave = (params, callback) => {
    db.get().collection(tableName)
        .insert(
            [{
                userId: params.userId ? params.userId : '',
                createdTimeStamp: moment().unix(),
                orderType: params.orderType,
                orderTypeMsg: params.orderTypeMsg ? params.orderTypeMsg : "",
                billNumber: params.billNumber ? params.billNumber : "N/A",
                createdBy: params.createdBy,
                status: 0,
                franchiseId: params.franchiseId || "0",
                cityName: params.city ? params.city : "",
                userName: params.customerName ? params.customerName : "",
                statusMsg: 'Active',
                customerPhone: params.customerPhone ? params.customerPhone : "",
                customerEmail: params.customerEmail ? params.customerEmail : "",
                orderDetails: {
                    weight: params.unitName ? params.unitName : '',
                    numberOfItems: params.totalItems ? params.totalItems : '',
                    details: params.itemName ? params.itemName : ''
                },
                items: [{
                    cityId: params.cityId ? params.cityId : '',
                    unitId: params.unitId ? params.unitId : '',
                    unitName: params.unitName ? params.unitName : '',
                    currency: params.currency ? params.currency : "",
                    mileageMetric: params.mileageMetric ? params.mileageMetric : "",
                    currencySymbol: params.currencySymbol ? params.currencySymbol : "",
                    parentProductId: params.parentProductId ? params.parentProductId : '',
                    childProductId: params.childProductId ? params.childProductId : '',
                    storeId: params.storeId ? params.storeId : '',
                    storeName: params.storeName ? params.storeName : '',
                    storeAddress: params.storeAddress ? params.storeAddress : '',
                    storeLogo: params.storeLogo ? params.storeLogo : '',
                    storePhone: params.storePhone ? params.storePhone : '',
                    storeCoordinates: params.coordinates,
                    addedToCartOn: moment().unix(),
                    itemName: params.itemName ? params.itemName : "",
                    itemType: params.itemType ? params.itemType : "",
                    itemTypeName: params.itemTypeName ? params.itemTypeName : "",
                    itemTypeId: params.itemTypeId ? params.itemTypeId : "",
                    storageType: params.storageType ? params.storageType : "",
                    storageTypeName: params.storageTypeName ? params.storageTypeName : "",
                    sku: params.sku ? params.sku : "",
                    upcNumber: params.upc ? params.upc : "",
                    itemImageURL: params.itemImageURL ? params.itemImageURL : "",
                    quantity: params.quantity,
                    unitPrice: params.unitPrice, // 1 -slave, 2-master
                    appliedDiscount: params.appliedDiscount,
                    finalPrice: params.finalPrice,
                    offerId: params.offerId,
                    taxes: params.taxes,
                    catName: params.catName ? params.catName : "",
                    subCatName: params.subCatName ? params.subCatName : "",
                    subSubCatName: params.subSubCatName ? params.subSubCatName : "",
                    barcode: params.barcode ? params.barcode : "N/A",
                    boxQuantity: params.boxQuantity ? params.boxQuantity : 0,
                    nonGroceryTypeName: params.nonGroceryTypeName ? params.nonGroceryTypeName : "",
                    nonGroceryTypeId: params.nonGroceryTypeId ? params.nonGroceryTypeId : "",
                    actions: [{
                        type: "Added",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity,
                        childProductId: params.childProductId ? params.childProductId : '',
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    }]
                }],
                actions: [{
                    type: "Added",
                    unitId: params.unitId ? params.unitId : '',
                    quantity: params.quantity,
                    childProductId: params.childProductId ? params.childProductId : '',
                    timeStamp: moment().unix(),
                    isoDate: new Date(),
                    actorId: params.userId ? params.userId : '',
                    actorName: params.customerName ? params.customerName : "",
                    actionBy: params.createdBy
                }]
            }],
            (err, result) => { return callback(err, result); });
}


/**
 * @function
 * @name pushItemToCart
 * @param {object} params - data coming from controller
 */
const pushItemToCart = (params, callback) => {

    db.get().collection(tableName)
        .update({ $and: [{ userId: params.userId }, { status: 0 }] },
            {
                $set: {
                    "cityName": params.city ? params.city : "",
                    "userName": params.customerName ? params.customerName : "",
                    customerPhone: params.customerPhone ? params.customerPhone : "",
                    customerEmail: params.customerEmail ? params.customerEmail : "",
                },
                $push: {
                    "items": {
                        cityId: params.cityId ? params.cityId : '',
                        unitId: params.unitId ? params.unitId : '',
                        unitName: params.unitName ? params.unitName : '',
                        currency: params.currency ? params.currency : "",
                        mileageMetric: params.mileageMetric ? params.mileageMetric : "",
                        currencySymbol: params.currencySymbol ? params.currencySymbol : "",
                        parentProductId: params.parentProductId ? params.parentProductId : '',
                        childProductId: params.childProductId ? params.childProductId : '',
                        pointOfSale: params.pointOfSale ? params.pointOfSale : '',
                        storeId: params.storeId ? params.storeId : '',
                        storeName: params.storeName ? params.storeName : '',
                        storeAddress: params.storeAddress ? params.storeAddress : '',
                        storeLogo: params.storeLogo ? params.storeLogo : '',
                        storePhone: params.storePhone ? params.storePhone : '',
                        storeCoordinates: params.coordinates,
                        addedToCartOn: moment().unix(),
                        itemName: params.itemName ? params.itemName : "",
                        itemType: params.itemType ? params.itemType : "",
                        itemTypeName: params.itemTypeName ? params.itemTypeName : "",
                        itemTypeId: params.itemTypeId ? params.itemTypeId : "",
                        storageType: params.storageType ? params.storageType : "",
                        storageTypeName: params.storageTypeName ? params.storageTypeName : "",
                        sku: params.sku ? params.sku : "",
                        upcNumber: params.upc ? params.upc : "",
                        itemImageURL: params.itemImageURL ? params.itemImageURL : "",
                        quantity: params.quantity,
                        unitPrice: params.unitPrice, // 1 -slave, 2-master
                        // cgstAmount: params.cgstAmount,
                        // cgstTaxFlagMsg: params.cgstTaxFlagMsg,
                        // cgstTaxFlag: params.cgstTaxFlag,
                        // sgstAmount: params.sgstAmount,
                        // sgstTaxFlag: params.sgstTaxFlag,
                        // sgstTaxFlagMsg: params.sgstTaxFlagMsg,
                        // igstAmount: params.igstAmount,
                        // igstTaxFlag: params.igstTaxFlag,
                        // igstTaxFlagMsg: params.igstTaxFlagMsg,
                        appliedDiscount: params.appliedDiscount,
                        finalPrice: params.finalPrice,
                        offerId: params.offerId,
                        taxes: params.taxes,
                        catName: params.catName ? params.catName : "",
                        subCatName: params.subCatName ? params.subCatName : "",
                        subSubCatName: params.subSubCatName ? params.subSubCatName : "",
                        barcode: params.barcode ? params.barcode : "N/A",
                        boxQuantity: params.boxQuantity ? params.boxQuantity : 0,
                        nonGroceryTypeName: params.nonGroceryTypeName ? params.nonGroceryTypeName : "",
                        nonGroceryTypeId: params.nonGroceryTypeId ? params.nonGroceryTypeId : "",
                        actions: [{
                            type: "Added",
                            unitId: params.unitId ? params.unitId : '',
                            quantity: params.quantity,
                            childProductId: params.childProductId ? params.childProductId : '',
                            timeStamp: moment().unix(),
                            isoDate: new Date(),
                            actorId: params.userId ? params.userId : '',
                            actorName: params.customerName ? params.customerName : "",
                            actionBy: params.createdBy
                        }]
                    },
                    "actions": {
                        type: "Added",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity,
                        childProductId: params.childProductId ? params.childProductId : '',
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
 * @name patchPrice
 * @param {object} params - data coming from controller
 */
const patchPrice = (params, callback) => {
    db.get().collection(tableName)
        .update({ $and: [{ userId: params.userId }, { status: 0 }, { _id: new ObjectID(params.cartId) }, { "items": { $elemMatch: { childProductId: params.childProductId, "removedFromCartOn": { $exists: false } } } }] },
            {
                $set: {
                    "items.$.unitPrice": parseFloat(params.priceValue)
                },
                $push: {
                    "items.$.actions": {
                        type: "Modified price while checkout.",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity ? params.quantity : 0,
                        childProductId: params.childProductId ? params.childProductId : '',
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    },
                    "actions": {
                        type: "Modified price while checkout.",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity ? params.quantity : 0,
                        childProductId: params.childProductId ? params.childProductId : '',
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
 * @name patchPrice
 * @param {object} params - data coming from controller
 */
const patchUnits = (params, callback) => {
    db.get().collection(tableName)
        .update({ $and: [{ userId: params.userId }, { status: 0 }, { _id: new ObjectID(params.cartId) }, { "items": { $elemMatch: { childProductId: params.childProductId, "removedFromCartOn": { $exists: false } } } }] },
            {
                $set: {
                    "items.$.unitId": params.unitId,
                    "items.$.unitName": params.unitName,
                    "items.$.unitPrice": params.priceValue
                },
                $push: {
                    "items.$.actions": {
                        type: "Replaced unitid while checkout.",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity ? params.quantity : 0,
                        childProductId: params.childProductId ? params.childProductId : '',
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    },
                    "actions": {
                        type: "Replaced unitid while checkout.",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity ? params.quantity : 0,
                        childProductId: params.childProductId ? params.childProductId : '',
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
 * @name patchDetails
 * @param {object} params - data coming from controller
 */
const patchDetails = (params, callback) => {
    db.get().collection(tableName)
        .update({
            $and: [{ userId: params.userId }, { status: 0 }, { _id: new ObjectID(params.cartId) },
            {
                "items": {
                    $elemMatch: {
                        childProductId: params.childProductId,
                        unitId: params.unitId ? params.unitId : '',
                        "removedFromCartOn": { $exists: false }
                    }
                }
            }]
        },
            {
                $set: {
                    "items.$.quantity": parseInt(params.quantity)
                },
                $push: {
                    "items.$.actions": {
                        type: "Modified quantity",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity,
                        childProductId: params.childProductId ? params.childProductId : '',
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    },
                    "actions": {
                        type: "Modified quantity",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity,
                        childProductId: params.childProductId ? params.childProductId : '',
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
 * @name patchDetailsCustom
 * @param {object} params - data coming from controller
 */
const patchDetailsCustom = (params, callback) => {
    db.get().collection(tableName)
        .update({
            $and: [{ userId: params.userId }, { status: 0 }, { _id: new ObjectID(params.cartId) },
            {
                "items": {
                    $elemMatch: {
                        childProductId: params.childProductId,
                        unitId: params.unitId ? params.unitId : '',
                        "removedFromCartOn": { $exists: false }
                    }
                }
            }]
        },
            {
                $set: {
                    "items.$.quantity": parseFloat(params.quantity),
                    "items.$.unitPrice": parseFloat(params.unitPrice),
                    "items.$.finalPrice": parseFloat(params.unitPrice)
                },
                $push: {
                    "items.$.actions": {
                        type: "Modified quantity",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity,
                        childProductId: params.childProductId ? params.childProductId : '',
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    },
                    "actions": {
                        type: "Modified quantity",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity,
                        childProductId: params.childProductId ? params.childProductId : '',
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
 * @name getAll
 * @param {object} params - data coming from controller
 */
const getAll = (params, callback) => {
    db.get().collection(tableName).aggregate(
        [
            {
                $match: {
                    "userId": params.userId, status: 0
                }
            },
            { "$unwind": "$items" },
            {
                $match: {
                    $or: [{ "items.removedFromCartOn": { $exists: false } }
                    ]
                }
            },
            {
                $group: {
                    _id: "$items.storeId",
                    cartId: { "$first": "$_id" },
                    estimates: { "$first": "$estimates" },
                    orderType: { "$first": "$orderType" },
                    orderTypeMsg: { "$first": "$orderTypeMsg" },
                    billNumber: { "$first": "$billNumber" },
                    storeName: { "$first": "$items.storeName" },
                    storeId: { "$first": "$items.storeId" },
                    storeLogo: { "$first": "$items.storeLogo" },
                    storeLatitude: { "$first": "$items.storeCoordinates.latitude" },
                    storeLongitude: { "$first": "$items.storeCoordinates.longitude" },
                    storeAddress: { "$first": "$items.storeAddress" },
                    storeUnitPrice: { "$sum": { "$multiply": ["$items.quantity", "$items.unitPrice"] } },
                    storeTotalPrice: { "$sum": { "$multiply": ["$items.quantity", "$items.finalPrice"] } },
                    currency: { "$first": "$items.currency" },
                    currencySymbol: { "$first": "$items.currencySymbol" },
                    cityId: { "$first": "$items.cityId" },
                    orderDetails: { "$first": "$orderDetails" },
                    products: {
                        $push:
                        {
                            itemName: "$items.itemName",
                            quantity: "$items.quantity",
                            unitId: "$items.unitId",
                            unitName: "$items.unitName",
                            unitPrice: "$items.unitPrice",
                            finalPrice: "$items.finalPrice",
                            appliedDiscount: "$items.appliedDiscount",
                            itemImageURL: "$items.itemImageURL",
                            itemType: "$items.itemType",
                            itemTypeName: "$items.itemTypeName",
                            storageType: "$items.storageType",
                            storageTypeName: "$items.storageTypeName",
                            addedToCartOn: "$items.addedToCartOn",
                            parentProductId: "$items.parentProductId",
                            offerId: "$items.offerId",
                            childProductId: "$items.childProductId",
                            taxes: "$items.taxes",
                            catName: "$items.catName",
                            boxQuantity: "$items.boxQuantity",
                            subCatName: "$items.subCatName",
                            subSubCatName: "$items.subSubCatName",
                            barcode: "$items.barcode",
                            nonGroceryTypeId: "$items.nonGroceryTypeId",
                            nonGroceryTypeName: "$items.nonGroceryTypeName"

                        }
                    }
                }
            },
            { $project: { _id: 0, orderType: 1, cartId: 1, storeName: 1, storeAddress: 1, storeId: 1, storeLogo: 1, storeTotalPrice: 1, storeLatitude: 1, storeUnitPrice: 1, storeLongitude: 1, products: 1, taxes: 1, currency: 1, currencySymbol: 1, estimates: 1, cityId: 1, billNumber: 1, orderTypeMsg: 1, orderDetails: 1 } }
        ])
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}

// { $project: { _id: 0, cartId:1,storeName: 1,storeAddress:1,  storeId: 1, storeLogo: 1, storeTotalPrice: 1,
//     storeLatitude: 1, storeLongitude: 1,
//     products: {$filter: {
// input: '$products',
// as: 'product',
// cond: {$eq: ['$$product.actions.type', '5a0eddea85985b60fa3ab489']}
// }
// }
/**
 * @function
 * @name removeCartDetail
 * @param {object} params - data coming from controller
 */
const removeCartDetail = (params, callback) => {
    let cond = { childProductId: params.childProductId, "removedFromCartOn": { $exists: false } };
    if (params.unitId) {
        cond.unitId = params.unitId
    }
    db.get().collection(tableName)
        .update({ $and: [{ status: 0 }, { userId: params.userId }, { _id: new ObjectID(params.cartId) }, { "items": { $elemMatch: cond } }] },
            {
                $set: {
                    "items.$.removedFromCartOn": moment().unix()
                },
                $push: {
                    "items.$.actions": {
                        type: "Removed product while checkout(not found)",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity ? params.quantity : 0,
                        childProductId: params.childProductId ? params.childProductId : '',
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    },
                    "actions": {
                        type: "Removed product while checkout(not found)",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity ? params.quantity : 0,
                        childProductId: params.childProductId ? params.childProductId : '',
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
            userId: params.userId, status: 0
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
            userId: params.userId,
            status: 0,
            "items": { "$elemMatch": { "itemType": params.itemType, "storageType": params.storageType, "nonGroceryTypeId": params.nonGroceryTypeId, "removedFromCartOn": { $exists: false } } }
            // "items": { "$elemMatch": { "childProductId": params.childProductId, "unitId": params.unitId, "removedFromCartOn": { $exists: false } } }

            // "items.childProductId": params.childProductId,
            // "items.removedFromCartOn": { $exists: false }
        },
            (err, result) => {
                return callback(err, result);
            });
}


/**
* @function
* @name isExistsWithItem
* @param {object} params - data coming from controller
*/
const isExistsWithItemDispatcher = (params, callback) => {

    db.get().collection(tableName)
        .findOne({
            userId: params.userId,
            status: 0,
            "items": { "$elemMatch": { "itemType": params.itemType, "itemTypeId": params.itemTypeId, "removedFromCartOn": { $exists: false } } }
            // "items": { "$elemMatch": { "childProductId": params.childProductId, "unitId": params.unitId, "removedFromCartOn": { $exists: false } } }

            // "items.childProductId": params.childProductId,
            // "items.removedFromCartOn": { $exists: false }
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
        .update({ _id: params.cartId ? new ObjectID(params.cartId) : "" },
            {
                $set: {
                    // orderedBy: {
                    //     userId: params.userId ? params.userId : "",
                    //     orderId: params.orderId ? params.orderId : "",
                    //     timeStamp: moment().unix()
                    // },
                    "status": 2,
                    "statusMsg": 'Order placed',
                },
                $push: {
                    "actions": {
                        // type: "order placed",
                        // createdBy: params.createdBy ? params.createdBy : "",
                        // timeStamp: moment().unix()

                        type: "Order placed",
                        orderId: params.orderId ? params.orderId : "",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity ? params.quantity : '',
                        childProductId: params.childProductId ? params.childProductId : '',
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
 * @name clearCart
 * @param {object} params - data coming from controller
 */
const clearCartZoneChange = (params, callback) => {
    db.get().collection(tableName)
        .update({ userId: params.userId, status: 0 },
            {
                $set: {
                    "status": 3,
                    "statusMsg": 'Cleared cart because of zone change.',
                },
                $push: {
                    "actions": {
                        // type: "cleared cart because of zone change.",
                        // createdBy: params.createdBy ? params.createdBy : "",
                        // timeStamp: moment().unix()

                        type: "Cleared cart because of zone change.",
                        unitId: '',
                        quantity: '',
                        childProductId: '',
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    }
                }
            },
            { multi: true },
            (err, result) => { return callback(err, result); });
}

/**
 * @function
 * @name reCart
 * @param {object} params - data coming from controller
 */
const reCart = (params, callback) => {

    db.get().collection(tableName)
        .update({ $and: [{ status: 0 }, { userId: params.userId }] },
            {
                $set: params
            },
            { upsert: true },
            (err, result) => { return callback(err, result); });
}
/**
* @function
* @name read
* @param {object} params - data coming from controller
*/
const read = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            _id: new ObjectID(params.cartId)
        }, (err, result) => {
            return callback(err, result);
        });
}

/**
 * @function
 * @name get
 * @param {object} params - data coming from controller
 */
const get = (params, callback) => {
    db.get().collection(tableName).aggregate(
        [
            {
                $match: {
                    "userId": params.userId, status: 0
                }
            },
            { $project: { cartId: "$_id", items: "$items" } },
            { "$unwind": "$items" },
            {
                $match: {
                    $or: [{ "items.removedFromCartOn": { $exists: false } }
                    ]
                }
            },
            { $project: { unitId: "$items.unitId", childProductId: "$items.childProductId", currencySymbol: "$items.currencySymbol", quantity: "$items.quantity", cartId: 1 } }
        ])
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}

/**
 * @function
 * @name updateEstimates
 * @param {object} params - data coming from controller
 */
const updateEstimates = (params, callback) => {
    db.get().collection(tableName)
        .update({ _id: params._id },
            {
                $set: {
                    "estimates": params.estimates
                },
            },
            (err, result) => { return callback(err, result); });
}

/**
 * @function
 * @name patchQuantity
 * @param {object} params - data coming from controller
 */
const patchQuantity = (params, callback) => {
    db.get().collection(tableName)
        .update({
            $and: [{ _id: new ObjectID(params.cartId) },
            {
                "items": {
                    $elemMatch: {
                        childProductId: params.childProductId,
                        unitId: params.unitId ? params.unitId : '',
                        "removedFromCartOn": { $exists: false }
                    }
                }
            }]
        },
            {
                $set: {
                    "items.$.quantity": parseInt(params.quantity)
                },
                $push: {
                    "items.$.actions": {
                        type: "Modified quantity",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity,
                        childProductId: params.childProductId ? params.childProductId : '',
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    },
                    "actions": {
                        type: "Modified quantity",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.quantity,
                        childProductId: params.childProductId ? params.childProductId : '',
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
 * @name patchBoxQuantity
 * @param {object} params - data coming from controller
 */
const patchBoxQuantity = (params, callback) => {
    db.get().collection(tableName)
        .update({
            $and: [{ userId: params.userId, status: 0 },
            {
                "items": {
                    $elemMatch: {
                        itemTypeId: params.itemTypeId,
                        // storageType: params.storageType,
                        itemType: params.itemType,
                        "removedFromCartOn": { $exists: false }
                    }
                }
            }]
        },
            {
                $inc: {
                    "items.$.boxQuantity": parseInt(params.boxQuantity)
                },
                $push: {
                    "items.$.actions": {
                        type: "Modified quantity",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.boxQuantity,
                        childProductId: params.childProductId ? params.childProductId : '',
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        actorId: params.userId ? params.userId : '',
                        actorName: params.customerName ? params.customerName : "",
                        actionBy: params.createdBy
                    },
                    "actions": {
                        type: "Modified quantity",
                        unitId: params.unitId ? params.unitId : '',
                        quantity: params.boxQuantity,
                        childProductId: params.childProductId ? params.childProductId : '',
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
 * @name getByCartId
 * @param {object} params - data coming from controller
 */
const getByCartId = (params, callback) => {
    db.get().collection(tableName).aggregate(
        [
            {
                $match: {
                    "_id": new ObjectID(params.cartId.toString())
                }
            },
            { "$unwind": "$items" },
            {
                $match: {
                    $or: [{ "items.removedFromCartOn": { $exists: false } }
                    ],
                    "items.storeId": params.storeId.toString() // storeid
                }
            },
            {
                $group: {
                    _id: "$items.storeId",
                    cartId: { "$first": "$_id" },
                    estimates: { "$first": "$estimates" },
                    orderType: { "$first": "$orderType" },
                    orderTypeMsg: { "$first": "$orderTypeMsg" },
                    billNumber: { "$first": "$billNumber" },
                    storeName: { "$first": "$items.storeName" },
                    storeId: { "$first": "$items.storeId" },
                    storeLogo: { "$first": "$items.storeLogo" },
                    storeLatitude: { "$first": "$items.storeCoordinates.latitude" },
                    storeLongitude: { "$first": "$items.storeCoordinates.longitude" },
                    storeAddress: { "$first": "$items.storeAddress" },
                    storeUnitPrice: { "$sum": { "$multiply": ["$items.quantity", "$items.unitPrice"] } },
                    storeTotalPrice: { "$sum": { "$multiply": ["$items.quantity", "$items.finalPrice"] } },
                    currency: { "$first": "$items.currency" },
                    currencySymbol: { "$first": "$items.currencySymbol" },
                    cityId: { "$first": "$items.cityId" },
                    products: {
                        $push:
                        {
                            itemName: "$items.itemName",
                            quantity: "$items.quantity",
                            unitId: "$items.unitId",
                            unitName: "$items.unitName",
                            unitPrice: "$items.unitPrice",
                            finalPrice: "$items.finalPrice",
                            appliedDiscount: "$items.appliedDiscount",
                            itemImageURL: "$items.itemImageURL",
                            addedToCartOn: "$createdByUserId.addedToCartOn",
                            parentProductId: "$items.parentProductId",
                            offerId: "$items.offerId",
                            childProductId: "$items.childProductId",
                            taxes: "$items.taxes",
                        }
                    }
                }
            },
            { $project: { _id: 0, cartId: 1, storeName: 1, storeAddress: 1, storeId: 1, storeLogo: 1, storeTotalPrice: 1, storeLatitude: 1, storeUnitPrice: 1, storeLongitude: 1, products: 1, taxes: 1, currency: 1, currencySymbol: 1, estimates: 1, cityId: 1, orderType: 1, billNumber: 1, orderTypeMsg: 1 } }
        ])
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}
/**
* @function
* @name getCurrentQuantity
* @param {object} params - data coming from controller
*/
const getCurrentQuantity = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params,
            { "items.$": 1 },
            (err, result) => {
                return callback(err, result);
            });
}
module.exports = {
    postSave,
    patchDetails,
    patchPrice,
    pushItemToCart,
    getAll,
    removeCartDetail,
    isExists,
    isExistsWithItem,
    clearCart,
    clearCartZoneChange,
    reCart,
    patchUnits,
    read,
    get,
    updateEstimates,
    patchDetailsCustom,
    patchQuantity,
    getByCartId,
    getCurrentQuantity,
    patchBoxQuantity,
    isExistsWithItemDispatcher
}
