'use strict'
const driver = require('../../../../../models/driver');
const order = require('../../../../../models/order');
const locationLogs = require('../../../../../models/locationLogs');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../locales');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const presence = require('../../../../commonModels/presence');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {

    async.waterfall(
        [
            (callback) => {
                order.isExistsDriverId({ "driverId": new ObjectID(request.auth.credentials._id), status: { '$in': [6, 7, 8, 9, 16] } }, (err, booking) => {
                    if (err) {
                        logger.error('Error occurred during location logs isExistsDriverId(isExistsDriverId) : ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                    }
                    return callback(null, booking);
                });
            },
            (booking, callback) => {
                driver.isExistsWithId({ "_id": new ObjectID(request.auth.credentials._id) }, (err, driverResult) => {
                    if (err) {
                        logger.error('Error occurred during driverlocation logs isExistsWithId : ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                    }
                    return callback(null, booking, driverResult);
                });
            }
        ],
        (err, booking, driverResult) => {
            if (err) {
                logger.error('Error occurred during driver callback : ' + JSON.stringify(err));
                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            }
            var latLongArr = request.payload.latLng;
            var diff = moment().unix() - driverResult.mobileDevices.lastLogin;

            for (var key = 0; key < booking.length; key++) {
                var onoff = { 'offline': driverResult.mobileDevices.lastLogin, 'online': moment().unix(), 'diff': diff / 60, 'status': booking[key].status };


                var logData = {};
                logData[booking[key].status.toString()] = { $each: latLongArr };



                locationLogs.pushLogsNoupsert({
                    bid: booking[key]._id, logData: logData
                }, (err, result) => {
                });

                locationLogs.pushLogsNoupsert({
                    bid: booking[key]._id, logData: { onoff: onoff } // logdata key already there hence used for same
                }, (err, result) => {
                });


            }
            // return reply({ message: error['getProfile']['200'] }).code(200);
            return reply({ message: request.i18n.__('getProfile')['200'] }).code(200);
        });
}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    latLng: Joi.any().description('Lat Long Array 13.343242,77.34242')
};


/**
* A module that exports update status API!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }