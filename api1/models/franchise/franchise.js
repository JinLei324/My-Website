
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'franchise'
const ObjectID = require('mongodb').ObjectID;
const Timestamp = require('mongodb').Timestamp;

const logger = require('winston');
/** 
 * @function
 * @name updateLatLong 
 * @param {object} params - data coming from controller
 */
const updateLatLong = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { 'mobileDevices.deviceId': params.deviceId, "guestToken": false, "userType": 3 },
            {
                "$set": {
                    status: 2, //   0 - Active , 1 - Banned , 2 - Unverfied 
                    createdDate: moment().unix(),
                    coordinates: {
                        longitude: parseFloat(params.longitude || 0.0),
                        latitude: parseFloat(params.latitude || 0.0)
                    },
                }
            },
            { upsert: true },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name patchloggedOutStatus 
 * @param {object} params - data coming from controller
 */
const patchloggedOutStatus = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { _id: params._id },
            {
                "$set": {
                    'mobileDevices.lastLogin': moment().unix(),
                    'mobileDevices.currentlyActive': false,
                    "mobileDevices.lastTimestamp": new Timestamp(1, moment().unix()),
                    "mobileDevices.lastISOdate": new Date(),
                    // 'mqttTopic': "",
                    // 'fcmTopic': ""
                }
            },
            { upsert: true },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name updateDeviceLog 
 * @param {object} params - data coming from controller
 */
const updateDeviceLog = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { _id: new ObjectID(params.id) },
            {
                "$set": {
                    userType: params.userType,
                    guestToken: false,
                    // guestToken: (params.userType == 3)?false:true,
                    userTypeMsg: params.userTypeMsg,
                    "mobileDevices.deviceId": params.deviceId,
                    "mobileDevices.deviceOsVersion": params.deviceOsVersion,
                    "mobileDevices.appVersion": params.appVersion,
                    "mobileDevices.deviceType": parseInt(params.deviceType),
                    "mobileDevices.pushToken": params.pushToken ? params.pushToken : "",
                    "mobileDevices.lastLogin": moment().unix(),
                    "mobileDevices.lastTimestamp": new Timestamp(1, moment().unix()),
                    "mobileDevices.lastISOdate": new Date(),
                    "mobileDevices.currentlyActive": true
                }
            },
            { upsert: true },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name updateAccessCode 
 * @param {object} params - data coming from controller
 */
const updateAccessCode = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { _id: new ObjectID(params._id) },
            {
                "$set": { "mobileDevices.deviceId": params.deviceId }
            },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name count 
 * @param {object} condition - data coming from controller
 */
const count = (condition, callback) => {
    db.get().collection(tableName)
        .count(
            condition,
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name isExistsWithCond 
 * @param {object} params - data coming from controller
 */
const isExistsWithCond = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, { status: 1 }, (err, result) => {
            return callback(err, result);
        });
}
/** 
 * @function
 * @name filter 
 * @param {object} condition - data coming from controller
 */
const filter = (condition, callback) => {
    db.get().collection(tableName).find(condition, { name: 1, countryCode: 1, phone: 1, email: 1 })
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}
/** 
 * @function
 * @name getData 
 * @param {object} params - data coming from controller
 */
const getData = (params, callback) => {
    db.get().collection(tableName)
        .findOne({ countryCode: params.countryCode, phone: params.phone, status: params.status }, (err, result) => {

            return callback(err, result);
        });
}
/** 
 * @function
 * @name saveDetails 
 * @param {object} params - data coming from controller
 */
const saveDetails = (params, callback) => {
    if (params.userType == 3) {
        db.get().collection(tableName)
            .findOneAndUpdate(
                { _id: new ObjectID(params.id) },
                {
                    "$set": {
                        name: params.name ? params.name : "",
                        email: params.email ? params.email : "",
                        customerPOSId: params.customerPOSId ? params.customerPOSId : "",
                        password: params.password, //hash the password and store in db
                        phone: params.mobile ? params.mobile : "",
                        countryCode: params.countryCode,
                        zipCode: params.zipCode || '',
                        dateOfBirth: params.dateOfBirth ? (new Date(params.dateOfBirth).getTime() / 1000) : "",
                        status: 0,
                        userType: 1,
                        coordinates: { longitude: parseFloat(params.longitude || 0.0), latitude: parseFloat(params.latitude || 0.0) },
                        socialMediaId: params.socialMediaId ? params.socialMediaId : "",
                        loginType: params.loginType,
                        profilePic: params.profilePic || '',
                        termsAndCondition: params.termsAndCond,
                        //referralCode: params.referralCode,
                        createdDate: (new Date().getTime() / 1000),
                        createdTimestamp: new Timestamp(1, moment().unix()),
                        createdISOdate: new Date(),
                        identityCard: { url: params.identityCard ? params.identityCard : "", verified: false },
                        mmjCard: { url: params.mmjCard ? params.mmjCard : "", verified: false },
                        mqttTopic: params.mqttTopic,
                        fcmTopic: params.fcmTopic,
                        mobileVerified: true,
                        emailVerified: false,
                        ip: params.ip ? params.ip : {
                            address: "",
                            city: ""
                        },
                        registeredFromCity: params.registeredFromCity ? params.registeredFromCity : "",
                        cityId: params.cityId ? params.cityId : "",
                        guestToken: true
                    }
                },
                { upsert: true },
                (err, result) => { return callback(err, result); });
    } else {
        let data = {
            name: params.name ? params.name : "",
            email: params.email ? params.email : "",
            customerPOSId: params.customerPOSId ? params.customerPOSId : "",
            password: params.password, //hash the password and store in db
            phone: params.mobile ? params.mobile : "",
            countryCode: params.countryCode,
            userType: 1,
            zipCode: params.zipCode || '',
            dateOfBirth: params.dateOfBirth ? (new Date(params.dateOfBirth).getTime() / 1000) : "",
            status: 0,
            statusMsg: "New",
            coordinates: { longitude: parseFloat(params.longitude || 0.0), latitude: parseFloat(params.latitude || 0.0) },
            socialMediaId: params.socialMediaId ? params.socialMediaId : "",
            loginType: params.loginType,
            profilePic: params.profilePic || '',
            termsAndCondition: params.termsAndCond,
            referralCode: params.referralCode,
            createdDate: (new Date().getTime() / 1000),
            createdTimestamp: new Timestamp(1, moment().unix()),
            createdISOdate: new Date(),
            identityCard: { url: params.identityCard, verified: false },
            mmjCard: { url: params.mmjCard, verified: false },
            mqttTopic: params.mqttTopic,
            fcmTopic: params.fcmTopic,
            mobileVerified: true,
            emailVerified: false,
            ip: params.ip ? params.ip : {
                address: "",
                city: ""
            },
            registeredFromCity: params.registeredFromCity ? params.registeredFromCity : "",
            cityId: params.cityId ? params.cityId : "",
            guestToken: true
        }
        db.get().collection(tableName).findOneAndUpdate({
            $and: [
                { email: params.email },
                { countryCode: params.countryCode, phone: params.mobile }
            ]
        }, data, { upsert: true, returnOriginal: false }, (err, result) => {
            return callback(err, result);
        });
    }
}


/** 
 * @function
 * @name saveDetailsPos 
 * @param {object} params - data coming from controller
 */
const saveDetailsPos = (params, callback) => {
    let dataToUpdate = {
        name: params.name ? params.name : "",
        email: params.email ? params.email : "",
        customerPOSId: params.customerPOSId ? params.customerPOSId : "",
        password: params.password, //hash the password and store in db
        phone: params.mobile ? params.mobile : "",
        countryCode: params.countryCode,
        zipCode: params.zipCode || '',
        dateOfBirth: params.dateOfBirth ? (new Date(params.dateOfBirth).getTime() / 1000) : "",
        status: 2,
        userType: 1,
        coordinates: { longitude: parseFloat(params.longitude || 0.0), latitude: parseFloat(params.latitude || 0.0) },
        socialMediaId: params.socialMediaId ? params.socialMediaId : "",
        loginType: params.loginType,
        profilePic: params.profilePic || '',
        termsAndCondition: params.termsAndCond,
        //referralCode: params.referralCode,
        createdDate: (new Date().getTime() / 1000),
        createdTimestamp: new Timestamp(1, moment().unix()),
        createdISOdate: new Date(),
        identityCard: { url: params.identityCard ? params.identityCard : "", verified: false },
        mmjCard: { url: params.mmjCard ? params.mmjCard : "", verified: false },
        mqttTopic: params.mqttTopic,
        fcmTopic: params.fcmTopic,
        mobileVerified: true,
        emailVerified: false,
        ip: params.ip ? params.ip : {
            address: "",
            city: ""
        },
        registeredFromCity: params.registeredFromCity ? params.registeredFromCity : ""
    }
    if (params.newUser == 0) {
        if (!params.newEmail) {
            delete dataToUpdate.email;
        }
        if (!params.newPhone) {
            delete dataToUpdate.phone;
            delete dataToUpdate.countryCode;
        }
    }
    db.get().collection(tableName)
        .findOneAndUpdate(
            { customerPOSId: params.customerPOSId },
            {
                "$set": dataToUpdate
            },
            { upsert: true, returnOriginal: false },
            (err, result) => { return callback(err, result); });

}
/** 
 * @function
 * @name addWalletId 
 * @param {object} params - data coming from controller
 */
const addWalletId = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { _id: new ObjectID(params.userId) },
            {
                "$set": {
                    walletId: new ObjectID(params.walletId)
                }
            },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name makeVerifyTrue 
 * @param {object} params - data coming from controller
 */
const makeVerifyTrue = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ countryCode: params.countryCode, phone: params.mobile },
            {
                $set: { mobileVerified: true }
            },
            { multi: true },
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name changePassword 
* @param {object} params - data coming from controller
*/
const changePassword = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ countryCode: params.countryCode, phone: params.mobile, status: { $nin: [1, 3] } },
            {
                $set: { password: params.password }
            },
            { multi: true },
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
            $or: [
                { email: params.email },
                { phone: params.phone }
            ]
        }, (err, result) => {
            return callback(err, result);
        });
}
/** 
 * @function
 * @name isExists 
 * @param {object} params - data coming from controller
 */
const isExistsWithId = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            _id: params._id
        }, (err, result) => {
            return callback(err, result);
        });
}
/** 
 * @function
 * @name isExists 
 * @param {object} params - data coming from controller
 */
const isExistsWithIdPos = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, (err, result) => {
            return callback(err, result);
        });
}
/** 
 * @function
 * @name isExistsWithIdType 
 * @param {object} params - data coming from controller
 */
const isExistsWithIdType = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            _id: params._id,
            userType: 3,
            guestToken: false
        }, (err, result) => {
            return callback(err, result);
        });
}
/** 
 * @function
 * @name makeVerifyTrue 
 * @param {object} params - data coming from controller
 */
const setPassword = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params._id },
            { $set: { password: params.password } }, {},
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name makeEmailVerifyTrue 
* @param {object} params - data coming from controller
*/
const makeEmailVerifyTrue = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params.id },
            {
                $set: { emailVerified: true }
            },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name checkWithEmailOrMail 
 * @param {object} params - data coming from controller
 */
const checkWithEmailOrMail = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, (err, result) => {
            return callback(err, result);
        });
}
/** 
* @function
* @name isExistsOrCondition 
* @param {object} params - data coming from controller
*/
const isExistsOrCondition = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            $or: params
        }, (err, result) => {
            return callback(err, result);
        });
}
/** 
 * @function
 * @name patchProfile 
 * @param {object} params - data coming from controller
 */
const patchProfile = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params._id },
            { $set: params },
            (err, result) => { return callback(err, result); });
}
/** 
 * @function
 * @name isExistsCountrycode 
 * @param {object} params - data coming from controller
 */
const isExistsCountrycode = (params, callback) => {
    db.get().collection(tableName)
        .findOne({
            $or: [
                { email: params.email },
                { countryCode: params.countryCode, phone: params.phone }
            ]
        }, (err, result) => {
            return callback(err, result);
        });
}
/** 
 * @function
 * @name updateOrderCount 
 * @param {object} params - data coming from controller
 */
const updateOrderCount = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate(
            { _id: new ObjectID(params.userId) },
            {
                $inc: {
                    'orders.ordersCount': 1,
                    'orders.ordersAmount': params.amount
                }
            },
            { upsert: true },
            (err, result) => {
                return callback(err, result);
            });
}

const getDetails = (userId, callback) => {
    db.get().collection(tableName).find({
        '_id': new ObjectID(userId)
    })
        .toArray((err, result) => {
            return callback(err, result);
        });
}

const insert = (params, callback) => {
    db.get().collection(tableName).insert(params, (err, result) => {
        return callback(err, result);
    })
}
const update = (params, callback) => {
    db.get().collection(tableName).update(params.q, params.data, (err, result) => {
        return callback(err, result)
    })
}
const findOneAndUpdate = (params, callback) => {
    db.get().collection(tableName).findOneAndUpdate(params.q, params.data, {
        returnOriginal: false
    }, (err, result) => {
        return callback(err, result)
    })
}
const get = (params, callback) => {
    db.get({}).collection(tableName).find({}).sort({
        _id: -1
    }).toArray((err, result) => {
        return callback(err, result[0]);
    });
}
const readAll = (condition, callback) => {
    db.get().collection(tableName).find(condition).toArray((err, result) => {
        return callback(err, result);
    });
}
const getOne = (params, callback) => {
    db.get().collection(tableName).findOne(params, (err, result) => {
        return callback(err, result);
    })
}
const deleteItem = (params, callback) => {
    db.get().collection(tableName).remove(params, (err, result) => {
        return callback(err, result);
    })
}
const updateS = (query, params, callback) => {
    db.get().collection(tableName).update(query, params, (err, result) => {
        return callback(err, result);
    });
}


module.exports = {
    updateLatLong,
    updateDeviceLog,
    updateAccessCode,
    getData,
    count,
    saveDetails,
    addWalletId,
    makeVerifyTrue,
    isExists,
    isExistsWithId,
    isExistsWithIdPos,
    setPassword,
    makeEmailVerifyTrue,
    checkWithEmailOrMail,
    isExistsOrCondition,
    isExistsWithIdType,
    patchProfile,
    patchloggedOutStatus,
    changePassword,
    isExistsCountrycode,
    filter,
    isExistsWithCond,
    updateOrderCount,
    saveDetailsPos,
    getDetails,
    insert,
    update,
    findOneAndUpdate,
    get,
    readAll,
    getOne,
    deleteItem,
    updateS
}
