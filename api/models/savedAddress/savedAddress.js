
'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'savedAddress'
const ObjectID = require('mongodb').ObjectID;
/**
* @function
* @name saveDetails
* @param {object} params - data coming from controller
*/
const saveDetails = (params, callback) => {
    db.get().collection(tableName)
        .insert(
            [{
                addLine1: params.addLine1 ? params.addLine1 : '',
                addLine2: params.addLine2 ? params.addLine2 : '',
                flatNumber: params.flatNumber ? params.flatNumber : '',
                landmark: params.landmark ? params.landmark : '',
                city: params.city ? params.city : '',
                state: params.state ? params.state : '',
                country: params.country ? params.country : '',
                placeId: params.placeId ? params.placeId : '',
                pincode: params.pincode ? params.pincode : '',
                latitude: params.latitude ? params.latitude : '',
                longitude: params.longitude ? params.longitude : '',
                taggedAs: params.taggedAs ? params.taggedAs : '',
                countryCode: params.countryCode ? params.countryCode : '',
                phoneNumber: params.phoneNumber ? params.phoneNumber : '',
                userType: 1, // 1 -slave, 2-master
                userId: params.userId._id ? params.userId._id : params.userId,//get the id from the extracted token,
                createdTimeStamp: moment().unix(),
                createdIsoDate: new Date(),
                addedFrom: params.addedFrom ? params.addedFrom : '',
                zoneNumber: params.zoneNumber ? params.zoneNumber : ''
            }],
            (err, result) => { return callback(err, result); });
}

/**
 * @function
 * @name patchAddress
 * @param {object} params - data coming from controller
 */
const patchAddress = (params, callback) => {

    db.get().collection(tableName)
        .findOneAndUpdate({ $and: [{ userId: params.userId }, { _id: params.addressId }] },
            {
                $set: {
                    addLine1: params.addLine1 ? params.addLine1 : '',
                    addLine2: params.addLine2 ? params.addLine2 : '',
                    flatNumber: params.flatNumber ? params.flatNumber : '',
                    landmark: params.landmark ? params.landmark : '',
                    city: params.city ? params.city : '',
                    state: params.state ? params.state : '',
                    country: params.country ? params.country : '',
                    placeId: params.placeId ? params.placeId : '',
                    pincode: params.pincode ? params.pincode : '',
                    latitude: params.latitude ? params.latitude : '',
                    longitude: params.longitude ? params.longitude : '',
                    taggedAs: params.taggedAs ? params.taggedAs : '',
                    countryCode: params.countryCode ? params.countryCode : '',
                    phoneNumber: params.phoneNumber ? params.phoneNumber : '',
                    userType: 1,
                    userId: params.userId,//get the id from the extracted token
                    addedFrom: params.addedFrom ? params.addedFrom : '',
                    zoneNumber: params.zoneNumber ? params.zoneNumber : ''
                }
            },
            { returnOriginal: false },
            (err, result) => { return callback(err, result); });
}

/**
 * @function
 * @name getAddress
 * @param {object} params - data coming from controller
 */
const getAddress = (params, callback) => {
    db.get().collection(tableName).find(
        {
            userId: params.userId
        })
        .toArray((err, result) => { // normal select method
            return callback(err, result);
        });
}

/**
 * @function
 * @name getAddress
 * @param {object} params - data coming from controller
 */
const getAddressById = (params, callback) => {
    db.get().collection(tableName)
        .findOne(params, (err, result) => {
            return callback(err, result);
        });
}
/**
 * @function
 * @name removeAddress
 * @param {object} params - data coming from controller
 */
const removeAddress = (params, callback) => {
    db.get().collection(tableName).remove({ _id: params._id }, (err, numberOfRemovedDocs) => {
        return callback(err, numberOfRemovedDocs);
    });
}
module.exports = {
    saveDetails,
    patchAddress,
    getAddress,
    removeAddress,
    getAddressById
}
