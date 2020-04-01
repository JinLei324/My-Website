'use strict';

const logger = require('winston');
const async = require('async');
const moment = require('moment');

let locationLogs = require('../../../models/locationLogs');
let bookingsAssigned = require('../../../models/bookingsAssigned');

/**
 * Method to log the booking activity along with time stamps
  @param {} currentBookings - array of current running booking to update data
  @param {} dataToPush - bookingId(int), status(int), stausUpdatedBy(dispatcher / driver / customer), userId, timeStamp, location(longitude, latitude), message, ip
 * {
 *      bookingId: 0,
 *      status: 0,
 *      stausUpdatedBy: "",//dispatcher / driver / customer
 *      userId: 0,
 *      timeStamp : 0,
 *      location: {
 *          longitude: 0.0(float),
 *          latitude: 0.0(float)
 *      },
 *      lastActive : 0, // last active time
*       latLongArr : [], // array of lat long
 *      message: ""
 *      ip: "0.0.0.0"
 *  }
  @param {} callback - async method
 */
const logBookingActivity = (currentBookings, dataToPush, callback) => {
    async.forEach(currentBookings, (item, cb) => {
        let data = {
            $push: {}
        };
        let options = { upsert: true };

        if (dataToPush.bookingId != "") {
            data = {
                $push: {
                    activities: dataToPush
                }
            };

            data['$set'] = {
                'driverLocation': dataToPush.location
            };

            bookingsAssigned.FINDONEANDUPDATE(
                { query: { bookingId: parseInt(item.bid) }, data: data },
                () => {
                    return;
                });
        }

        if (item.bid == dataToPush.bookingId && parseFloat(dataToPush.location.latitude) != 0.0 && parseFloat(dataToPush.location.longitude) != 0.0) {
            data['$push'][dataToPush.status] = dataToPush.location.latitude + ',' + dataToPush.location.longitude;
            data['$set'] = {
                'driverLocation': dataToPush.location
            };
        }

        if (dataToPush.bookingId == "" && dataToPush.status == 15) {
            data['$push'][item.status] = { $each: dataToPush.latLongArr };
            data['$set'] = {
                'driverLocation': dataToPush.location
            };

            let diff = (moment().unix() - dataToPush.lastActive) / 60;
            let onoff = {
                'offline': dataToPush.lastActive,
                'online': moment().unix(),
                'diff': parseFloat(diff).toFixed(2),
                'status': item.status
            };
            locationLogs.UpdatePush({ bid: parseInt(item.bid) }, { onoff: onoff }, (err, result) => {
            });
        }
        else if (dataToPush.bookingId == "" && parseFloat(dataToPush.location.latitude) != 0.0 && parseFloat(dataToPush.location.longitude) != 0.0) {
            data['$push'][item.status] = dataToPush.location.latitude + ',' + dataToPush.location.longitude;
            data['$set'] = {
                'driverLocation': dataToPush.location
            };
        }

        locationLogs.FINDONEANDUPDATE(
            { query: { bid: parseInt(item.bid) }, data: data, options: options },
            () => {
                return;
            });

        return cb(null, 'done');

    }, (err, result) => {
        return callback(null, 'done')
    });
}

module.exports = {
    logBookingActivity
};