'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'promoCodes'
const ObjectID = require('mongodb').ObjectID;

/** 
 * @function
 * @name insert a new offer 
 * @param {object} params - data coming from controller
 */
const postCouponCode = (offersData, callback) => {
    db.get().collection(tableName)
        .insert(offersData,
            (err, result) => {
                return callback(err, result);
            });
}

const validateCoupon = (requestData, callback) => {
    var citiIds = requestData.cityId;
    var zoneIds = requestData.cityId;
    var paymentMethod = requestData.paymentMethod;

    let matchCond = {};
    if (requestData.storeIds) {
        let storeIds = requestData.storeIds.split(',');
        matchCond = {
            "cities.cityId": {
                $in: [citiIds]
            },
            "store.storeId": {
                $in: storeIds
            },
            "status": 2,
            "code": requestData.couponCode
        }
    } else {
        matchCond = {
            "cities.cityId": {
                $in: [citiIds]
            },
            "status": 2,
            "code": requestData.couponCode
        }
    }

    db.get().collection(tableName).aggregate([{
        $match: matchCond
    }, {
        $project: {
            ab: {
                $lt: ["$globalClaimCount", "$globalUsageLimit"],

            },
            _id: 1,
            title: 1,
            code: 1,
            adminLiability: 1,
            storeLiability: 1,
            promoType: 1,
            status: 1,
            cities: 1,
            zones: 1,
            minimumPurchaseValue: 1,
            applicableOn: 1,
            rewardType: 1,
            paymentMethod: 1,
            paymentMethodString: 1,
            isApplicableWithWallet: 1,
            discount: 1,
            startTime: 1,
            endTime: 1,
            globalUsageLimit: 1,
            perUserLimit: 1,
            globalClaimCount: 1,
            vehicleType: 1,
            created: 1,
            users: 1,
        }
    }, {
        $match: {
            ab: {
                $eq: true
            }
        }
    }]).toArray(
        (err, result) => {


            return callback(err, result);
        });
}

const getAllCouponCodeByStatus = (requestData, callback) => {

    var condition = {
        'status': requestData.status

    }
    if (typeof (requestData.sSearch) !== "undefined" && requestData.sSearch != '') {

        var regexValue = new RegExp("^" + requestData.sSearch, "i")

        condition['$or'] = [{
            'title': regexValue
        }, {
            'code': regexValue
        }, {
            'cities.cityName': regexValue
        },];
    }

    if (typeof (requestData.cityId) !== "undefined" && requestData.cityId != '') {
        condition['cities.cityId'] = requestData.cityId;
    }
    if (typeof (requestData.dateTime) !== "undefined" && requestData.dateTime !== '') {
        var dateTime = requestData.dateTime;
        var dateTimeString = dateTime.split("-", 2);
        var startDate = dateTimeString[0];
        var endDate = dateTimeString[1];
        var startDateISO = new Date(startDate).toISOString();
        var endDateISO = new Date(endDate + ' 23:59:50').toISOString();




        condition['$or'] = [{
            'startTime': {
                $gte: startDateISO,
                $lte: endDateISO

            }
        },
        {
            'endTime': {
                $gte: startDateISO,
                $lte: endDateISO
            }
        }
        ];


    }

    db.get().collection(tableName).find(condition).skip(requestData.offset).limit(requestData.limit).sort({ '_id': -1 })
        .toArray((err, result) => {

            return callback(err, result);
        });
}

const updateStatus = (params, callback) => {
    db.get().collection(tableName).findOneAndUpdate({
        "_id": {
            '$in': params.couponMongoIds
        }
    }, {
        $set: {
            "status": params.status,
            "statusString": params.statusString
        }
    }, {
        returnOriginal: false
    },


        (err, result) => {
            return callback(err, result);
        });
}


// update promocode
const updatePromoCode = (params, callback) => {

    db.get().collection(tableName).findOneAndUpdate({
        "_id": params.promoId
    }, {
        $set: {
            // "status": params.status
            "title": params.title,
            "code": params.code,
            "storeLiability": parseInt(params.storeLiability),
            "adminLiability": parseInt(params.adminLiability),
            "status": params.status,
            "statusString": 'active',
            "promoType": "couponCode",
            "cities": params.cities,
            "category": params.category,
            // "cityNames": params.cityNames,
            "zones": params.zones,
            "paymentMethod": params.paymentMethod,
            "isApplicableWithWallet": params.isApplicableWithWallet,
            "paymentMethodString": params.paymentMethodString,
            "minimumPurchaseValue": parseInt(params.minimumPurchaseValue),
            "discount": params.discount,
            "startTime": params.startTime,
            "endTime": params.endTime,
            "globalUsageLimit": params.globalUsageLimit,
            "perUserLimit": params.perUserLimit,
            "store": params.store,
            "created": params.formatted,
            "createdIso": new Date(),
            "applicableOn": params.applicableOn,
            "applicableOnString": params.applicableOnString,
            "termsAndConditions": params.termsAndConditions,
            "description": params.description,
            "howItWorks": params.howItWorks
        }
    }, {
        returnOriginal: false
    },


        (err, result) => {
            return callback(err, result);
        });
}



const increaseClaimCount = (userData, callback) => {
    db.get().collection(tableName).update({
        "_id": new ObjectID(userData.promoId)

    }, {
        $inc: {
            "globalClaimCount": 1
        }
    },


        (err, result) => {
            return callback(err, result);
        });
}

const getAllCouponCodeByCityId = (cityId, callback) => {

    db.get().collection(tableName).aggregate([{
        $match: {
            'status': 2,
            'promoType': 'couponCode',
            'cities.cityId': {
                $in: [cityId]
            }
        }
    }, {
        $project: {
            ab: {
                $lt: ["$globalClaimCount", "$globalUsageLimit"],

            },
            title: 1,
            code: 1,
            startTime: 1,
            endTime: 1,
            discount: 1,
            termsAndConditions: 1,
            description: 1,
            howItWorks: 1,
            minimumPurchaseValue: 1
        }
    }, {
        $match: {
            ab: {
                $eq: true
            }
        }
    }],

        (err, result) => {
            return callback(err, result);
        });
}
const getAllCouponCodeByCityAndStoreId = (params, callback) => {

    db.get().collection(tableName).aggregate([{
        $match: {
            'status': 2,
            'promoType': 'couponCode',
            'cities.cityId': {
                $in: [params.cityId]
            },
            "store.storeId": {
                $in: [params.storeIds]
            }
        }
    }, {
        $project: {
            ab: {
                $lt: ["$globalClaimCount", "$globalUsageLimit"],

            },
            title: 1,
            code: 1,
            startTime: 1,
            endTime: 1,
            discount: 1,
            termsAndConditions: 1,
            description: 1,
            howItWorks: 1,
            minimumPurchaseValue: 1
        }
    }, {
        $match: {
            ab: {
                $eq: true
            }
        }
    }],

        (err, result) => {
            return callback(err, result);
        });
}

const updateExpired = (callback) => {
    db.get().collection(tableName).update({
        "endTime": { "$lt": moment().toISOString() },
        "status": 2
    }, {
        $set: {
            "status": 4,
            "statusString": "Expired"
        }
    }, {
        returnOriginal: false,
        multi: true
    }, (err, result) => {
        return callback(err, result);
    });
}

const getCountByStatus = (status, callBack) => {
    db.get().collection(tableName).count({
        'status': status,
    },
        (err, result) => {
            return callBack(err, result);
        });
}
const getPromoCodeById = (promoId, callBack) => {
    db.get().collection(tableName).find({
        '_id': new ObjectID(promoId)
    })
        .toArray((err, result) => {
            return callBack(err, result);
        });
}

module.exports = {
    postCouponCode,
    validateCoupon,
    getAllCouponCodeByStatus,
    updateStatus,
    updatePromoCode,
    increaseClaimCount,
    getAllCouponCodeByCityId,
    getAllCouponCodeByCityAndStoreId,
    getCountByStatus,
    getPromoCodeById,
    updateExpired
}