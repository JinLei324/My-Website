/** @global */
const logger = require('winston');
const Config = process.env;
const ObjectID = require('mongodb').ObjectID;
const customerModel = require('../../models/customer');
const driverModel = require('../../models/driver');
const client = require('../../library/redis');
const moment = require('moment');
const driverPresence = require('../../models/driverPresence');
const driverPresenceDaily = require('../../models/driverPresenceDaily');
const async = require('async');
const driverStatusPresence = (params, callback) => {

    let timestamp = moment().unix();

    if (parseInt(params.status) == 3) {
        async.waterfall([
            (cb) => {

                driverPresence.updatePresence({
                    _id: new ObjectID(params.mid), status: parseInt(params.status)
                }, (err, doc) => {
                    if (err) logger.error('Error occurred during driver status update (driverPresence updatePresence) : ' + JSON.stringify(err));
                    return cb(null, 'done');
                });


            },

            (done, cb) => {
                driverPresenceDaily.updatePresence({
                    _id: new ObjectID(params.mid), status: parseInt(params.status)
                }, (err, doc) => {
                    if (err) logger.error('Error occurred during driver status update (driverPresenceDaily updatePresence) : ' + JSON.stringify(err));
                    return cb(null, 'done');
                });

            }
        ], (err, result) => {
            if (err) return callback(err);
            return callback(null, 'done');
        });


    } else {

        async.waterfall([
            (cb) => {
                driverPresence.isExistsWithId({
                    _id: new ObjectID(params.mid)
                }, (err, doc) => {
                    if (err) {
                        logger.error('Error occurred during driver status update (isExistsWithId) : ' + JSON.stringify(err));
                        return cb(err);
                    }

                    return cb(null,
                        (doc != null) ? doc.lastOnline || timestamp : timestamp,
                        (doc != null) ? doc.totalOnline || 0 : 0);
                });

            },

            (lastOnline, totalOnline, cb) => {

                totalOnline += (timestamp - lastOnline);

                driverPresence.updateTotalonline({
                    _id: new ObjectID(params.mid), status: parseInt(params.status), totalOnline: totalOnline, lastOnline: lastOnline
                }, (err, doc) => {
                    if (err) {
                        logger.error('Error occurred during driver status update (updateTotalonline) : ' + JSON.stringify(err));
                        return cb(err);
                    }

                    return cb(null, lastOnline);
                });
            },
            function (lastOnline, cb) {

                driverPresenceDaily.isExistsWithId({
                    mid: new ObjectID(params.mid)
                }, (err, doc) => {
                    if (err) {
                        logger.error('Error occurred during driver status update (isExistsWithId) : ' + JSON.stringify(err));
                        return cb(err);
                    }

                    return cb(null,
                        (doc != null) ? doc.lastOnline || timestamp : timestamp,
                        (doc != null) ? doc.totalOnline || 0 : 0);
                });
            },
            function (lastOnline, totalOnline, cb) {

                totalOnline += (timestamp - lastOnline);

                // logger.error(lastOnline);
                // logger.warn(timestamp);

                driverPresenceDaily.updateTotalonline({
                    mid: new ObjectID(params.mid), lastOnline: lastOnline, status: params.status, totalOnline: totalOnline
                }, (err, doc) => {
                    if (err) {
                        logger.error('Error occurred during driver status update (updateTotalonline) : ' + JSON.stringify(err));
                        return cb(err);
                    }

                    return cb(null, lastOnline);
                });


            },//update the totalOnline time for the master

        ], (err, result) => {
            if (err)
                return callback(err);
            return callback(null, 'done');
        });
    }
}
module.exports = { driverStatusPresence };