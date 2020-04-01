'use strict'
const driver = require('../../../../../models/driver');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../locales');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
    var responseData = {};//data to be sent as response
    async.waterfall(
        [
            (callback) => {
                driver.isExistsWithId({ _id: new ObjectID(req.auth.credentials._id) }, (err, doc) => {
                    if (err) {
                        logger.error('Error occurred during driver profile get (isExistsWithId): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                        return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                    }
                    if (doc === null)
                        // return reply({ message: error['getProfile']['404'] }).code(404);
                        return reply({ message: req.i18n.__('getProfile')['404'] }).code(404);
                    let driverTypeMsg = '';
                    switch (doc.driverType) {
                        case 1:
                            driverTypeMsg = 'Freelancer'
                            break;
                        case 2:
                            driverTypeMsg = 'Store'
                            break;
                    }
                    responseData = {
                        Name: doc.lastName ? (doc.firstName + " " + doc.lastName) : doc.firstName,
                        phone: doc.mobile,
                        profilePic: doc.profilePic != null ? doc.profilePic : "",
                        email: doc.email,
                        driverType: doc.driverType,
                        driverTypeMsg: driverTypeMsg,
                        storeId: doc.storeId ? doc.storeId : "",
                        storeName: doc.storeName ? doc.storeName : "",
                        planName: doc.planName || '',
                        vehiclePlatNo: '',
                        vehicleTypeName: ''
                    }
                    return callback(null, doc);
                });
            }, //get the driver details
            (doc, callback) => {
                if (!ObjectID.isValid(doc.vehicleId))
                    return callback(null, false);
                vehicles.isExistsWithId({ _id: new ObjectID(doc.vehicleId) }, (err, vehicle) => {
                    if (err) {
                        logger.error('Error occurred during driver profile get (isExistsWithId2): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                        return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                    }
                    responseData.vehiclePlatNo = vehicle ? vehicle.platNo : '';
                    responseData.vehicleTypeName = vehicle ? vehicle.type : '';
                    return callback(null, 'done');
                });
            }//get the vehicle plateNo
        ],
        (err, results) => {
            if (err)
                return reply(err);
            // return reply({ message: error['getProfile']['200'], data: responseData }).code(200);
            return reply({ message: req.i18n.__('getProfile')['200'], data: responseData }).code(200);
        });
}


/**
* A module that exports get profile
* @exports handler 
*/
module.exports = { handler }