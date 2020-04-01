'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'verificationCode'
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name saveVerificationCode 
* @param {object} params - data coming from controller
*/
const saveVerificationCode = (params, callback) => {

    db.get().collection(tableName)
        .insert(
            [{
                type: 2, // 1-mobile ,2- email
                verificationCode: '',
                generatedTime: parseInt(moment().valueOf() / 1000),
                expiryTime: parseInt(moment().add(10, 'm').valueOf()),
                triggeredBy: 'Customer New Registration', // 2- forgot password ,1 - registration
                maxAttempt: 0,
                maxCount: 1,
                userId: params.id.toString(),
                userType: 1, // 1-customer, 2-driver
                givenInput: params.email,
                attempts: [],
                status: true,
                verified: false,
                isoDate: new Date()
            }],
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name saveVerificationCodeMobile 
* @param {object} params - data coming from controller
*/
const saveVerificationCodeMobile = (params, callback) => {
    db.get().collection(tableName)
        .insert(
            [{
                type: 1, // 1-mobile  
                verificationCode: params.randomnumber,
                generatedTime: parseInt(moment().valueOf()),
                expiryTime: parseInt(moment().add(params.otpExpiryTime, 's').valueOf()),
                triggeredBy: params.triggeredBy, // 2- forgot password ,1 - registration
                maxAttempt: 0,
                date: moment().format('DD-MMM-YY'),
                maxCount: 1,
                userId: '', // chek in last
                userType: params.userType, // 1-customer 
                givenInput: params.givenInput,
                attempts: [],
                status: true,
                verified: false,
                isoDate: new Date()
            }],
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name saveVerificationCodeForgotPassword 
* @param {object} params - data coming from controller
*/
const saveVerificationCodeForgotPassword = (params, callback) => {
    db.get().collection(tableName)
        .insert(
            [{
                type: params.verifyType, // 1-mobile ,2- email
                verificationCode: params.randomnumber,
                generatedTime: parseInt(moment().valueOf()),
                expiryTime: parseInt(moment().add(params.otpExpiryTime, 's').valueOf()),
                triggeredBy: params.triggeredBy, // 2- forgot password ,1 - registration
                maxAttempt: 0,
                date: moment().format('DD-MMM-YY'),
                maxCount: 1,
                userId: params.userId,
                userType: params.userType, // 1-customer, 2-driver
                givenInput: params.givenInput,
                attempts: [],
                status: true,
                verified: false,
                isoDate: new Date()
            }],
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
            {
                givenInput: condition.givenInput,
                userType: condition.userType,
                date: moment().format('DD-MMM-YY'),
                triggeredBy: condition.triggeredBy
            },
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name count 
* @param {object} condition - data coming from controller
*/
const countForgotCount = (condition, callback) => {

    db.get().collection(tableName)
        .count(
            { givenInput: condition.givenInput, date: moment().format('DD-MMM-YY'), triggeredBy: condition.triggeredBy, userType: condition.userType },
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name markStatusFalse 
* @param {object} condition - data coming from controller
*/
const markStatusFalse = (condition, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({
            givenInput: condition.givenInput, triggeredBy: condition.triggeredBy, userType: condition.userType,
        }, { $set: { status: false } }, { multi: true }, (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name makeVerifyTrue 
* @param {object} params - data coming from controller
*/
const makeVerifyTrue = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ _id: new ObjectID(params._id.toString()), status: true }, {
            $set: { maxAttempt: params.maxAttempt + 1, verified: true },
            $push: {
                attempts: {
                    enteredValue: params.code,
                    verifiedOn: moment().valueOf(),
                    isoDate: new Date(),
                    success: true
                }
            }
        },
            { multi: true },
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name saveWrongEntered 
* @param {object} params - data coming from controller
*/
const saveWrongEntered = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ _id: new ObjectID(params._id.toString()), status: true }, {
            $set: { maxAttempt: params.maxAttempt + 1, verified: false },
            $push: {
                attempts: {
                    enteredValue: params.code,
                    verifiedOn: moment().valueOf(),
                    isoDate: new Date(),
                    success: false
                }
            }
        },
            { multi: true },
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name selectRecentCode 
* @param {object} params - data coming from controller
*/
const selectRecentCode = (params, callback) => {

    db.get().collection(tableName)
        .find({ givenInput: params.givenInput, userType: params.userType, status: true })
        .sort({ "_id": -1 })
        .limit(1)
        .skip(0)
        .toArray((err, result) => {
            return callback(null, result);
        });

}
/** 
* @function
* @name selectRecentVerifiedCode 
* @param {object} params - data coming from controller
*/
const selectRecentVerifiedCode = (params, callback) => {

    db.get().collection(tableName)
        .find({ givenInput: params.givenInput, userType: params.userType })
        .sort({ "_id": -1 })
        .limit(1)
        .skip(0)
        .toArray((err, result) => {
            return callback(null, result);
        });
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
* @name setLastToken 
* @param {object} params - data coming from controller
*/
const setLastToken = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params._id },
            { $set: { lastToken: params.lastToken, verified: true, status: false } },
            {},
            (err, result) => { return callback(err, result); });
}
/** 
* @function
* @name makePasswordTrue 
* @param {object} params - data coming from controller
*/
const makePasswordTrue = (params, callback) => {
    db.get().collection(tableName)
        .findOneAndUpdate({ _id: params._id },
            { $set: { updatedPassword: true } },
            (err, result) => { return callback(err, result); });
}
module.exports = {
    saveVerificationCode,
    count,
    saveVerificationCodeMobile,
    markStatusFalse,
    selectRecentCode,
    selectRecentVerifiedCode,
    makeVerifyTrue,
    saveWrongEntered,
    countForgotCount,
    saveVerificationCodeForgotPassword,
    isExists,
    setLastToken,
    makePasswordTrue
}
