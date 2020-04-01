'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const async = require('async');

const locationLogs = require('../../../../models/locationLogs');
const bookingsAssigned = require('../../../../models/bookingsAssigned');
const logActivities = require('../../../commonModels/bookingLogActivities');

const errorMsg = require('../../../../locales');

const payload = Joi.object({
    latLong: Joi.array().required().description('Lat Long Array 13.343242,77.34242')
}).required();

/**
 * @method POST /master/locationLogs
 * @param {*} req 
 * @param {*} reply 
 * @property {number} longitude
 * @property {number} latitude
 */
const handler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    const updateLocationLogs = () => {
        return new Promise((resolve, reject) => {
            let currentBookings = req.user.currentBookings || [];
            if (currentBookings.length > 0) {
                let locationObj = req.payload.latLong[req.payload.latLong.length - 1].split(",");
                let currenrLocation = {
                    longitude: parseFloat(locationObj[0]),
                    latitude: parseFloat(locationObj[1])
                };
                let dataToPush = {
                    bookingId: "",
                    status: 15,
                    stausUpdatedBy: "driver",
                    userId: new ObjectID(req.user._id.toString()),
                    location: currenrLocation,
                    message: 'Location log Update',
                    lastActive: req.user.lastActive,
                    latLongArr: req.payload.latLong,
                    ip: req.user.mobileDevices.ip || "0.0.0.0"
                };
                logActivities.logBookingActivity(currentBookings, dataToPush, (err, data) => {
                    logger.debug(data);
                });
                resolve(true);
            }
            else
                resolve(true);
        });
    }

    updateLocationLogs()
        .then(data => {
            return reply({ message: req.i18n.__('genericErrMsg')['200'] }).code(200);
        }).catch(e => {
            logger.error("Provider post location API error =>", e)
            return reply({ message: e.message }).code(e.code);
        });
};

const responseCode = {
    status: {
        200: { message: Joi.any().default(errorMsg['genericErrMsg']['200']) },
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) }
    }
}//swagger response code


module.exports = {
    payload,
    handler,
    responseCode
};