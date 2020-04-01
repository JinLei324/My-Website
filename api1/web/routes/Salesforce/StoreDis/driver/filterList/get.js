'use strict'
const drivers = require('../../../../../../models/driver');
// const webSocket = require('../../../../../../library/websocket');
const webSocket = require('../../../../../../library/websocket/websocket');
const error = require('../../../../../../locales');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const Async = require('async');

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {

    let pageIndex = request.params.index;
    let skip = pageIndex * 20;
    let limit = 20;

    drivers.getAll({ apptStatus: request.params.status, storeId: request.params.storeId, driverType: 2, skip: skip, limit: limit }, (err, onlineDrivers) => {
        //  cb(null, onlineDrivers);
        var onlinePro = [];
        Async.forEach(onlineDrivers, function (item, callbackloop) {

            var fname = (typeof item.firstName == 'undefined' || item.firstName == null) ? "" : item.firstName;
            var lname = (typeof item.lastName == 'undefined' || item.lastName == null) ? "" : item.lastName;
            var name = fname + " " + lname;
            var obj = { items: item.phone };
            // var arrayFound = obj.items.myFind({ "isCurrentlyActive": true });
            onlinePro.push({
                '_id': item._id.toString(),
                'latitude': item.location.latitude,
                'longitude': item.location.longitude,
                'image': item.profilePic,
                'status': item.status,
                'email': item.email,
                'lastActive': item.lastActive,
                'lastOnline': moment().unix() - item.lastActive,
                'serverTime': moment().unix(),
                'name': name,
                'phone': item.countryCode + item.mobile || "",
                'deviceType': item.mobileDevices.deviceType || '',
                'batteryPercentage': parseFloat(item.batteryPer).toFixed(0) || 0,
                'appversion': item.mobileDevices.appVersion,
                'bookingCount': item.currentBookings ? item.currentBookings.length : 0,
                //'batteryPercentage': item.
                //'locationCheck': item.locationCheck == 0 ? 'off' : 'on',
                //'bookingCount': count,
                'time': moment.unix(item.lastActive).fromNow()
            });

            callbackloop(null, onlinePro);

        }, function (loopErr) {

            webSocket.publish('storeDrivers/' + request.params.storeId, { data: { DriversList: onlinePro } }, { qos: 2 }, (mqttErr, mqttRes) => {
            });

            return reply({ message: request.i18n.__('driverList')['200'], data: { DriversList: onlinePro } }).code(200);

            //  cb(null, onlinePro);

        });
    })

}


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {

    storeId: Joi.string().required().description('storeId'),
    index: Joi.number().integer().required().description('index'),
    status: Joi.number().integer().required().description('status  10 - On the Way, 11 - Arrived, 12 - Journey Started')

}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }