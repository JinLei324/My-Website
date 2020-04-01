'use strict'

const Auth = require('../../../../middleware/authentication');
//const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const bookingsUnassigned = require('../../../../../models/bookingsUnassigned');
const master = require('../../../../../models/driver');
const providerErrorMsg = require('../../../../../locales');
const redis = require('../../../../../library/redis');
const notifyi = require('../../../../../library/mqttModule/mqtt');
let client = redis.client;
const webSocket = require('../../../../../library/websocket/websocket');
var dispatchLogs = require('../../../../../models/dispatchLogs');



const payload = Joi.object({
    orderId: Joi.number().integer().required().description('booking id')
}).required();

const APIHandler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };
    let condition = {
        'orderId': parseFloat(req.payload.orderId),
        "dispatched": {
            "$elemMatch": {
                "driverId": new ObjectID(req.auth.credentials._id),
                "status": { '$in': [1, 4] },
                "ack": { "$ne": true },
            }
        }
    };

    var updateData = {
        'dispatched.$.receiveDtisoDate': new Date(),
        'dispatched.$.receiveDt': moment().format("YYYY-MM-DD HH:mm:ss"),
        'dispatched.$.status': "",
        'dispatched.$.received_Act_serverTime': moment().unix(),
        'dispatched.$.receiveDtisoDate': new Date(),
        'dispatched.$.actPing': 0,
        'dispatched.$.ack': true,
    };

    bookingsUnassigned.SelectOne(condition, function (err, bookingData) {
        if (err) {
            reply({ message: dbErrResponse.message }).code(dbErrResponse.code);
        } else if (bookingData) {
            var ExpiryTime = moment().unix();
            var masterData = {};
            async.forEach(bookingData.dispatched, function (item, newcallback) {
                if (item.driverId.toString() == req.auth.credentials._id.toString()) {
                    ExpiryTime = parseInt(item.expiryTime);
                    masterData = item;
                }
                newcallback(null);
            }, function (loopErr) {

                if (ExpiryTime > moment().unix()) {
                    // calculate acceptance rate for driver
                    master.FINDONEANDUPDATE({
                        query: { _id: new ObjectID(req.auth.credentials._id) },
                        data: {
                            $inc: {
                                'acceptance.totalBookings': 1,
                                'acceptance.ignoredBookings': 1
                            }
                        }
                    }, (err, result) => {
                        if (result.value) {
                            let driverData = result.value;
                            let acceptedBookings = driverData.acceptance && driverData.acceptance.acceptedBookings ? driverData.acceptance.acceptedBookings : 0;
                            let totalBookings = driverData.acceptance && driverData.acceptance.totalBookings ? driverData.acceptance.totalBookings + 1 : 1;
                            let acceptanceRate = ((acceptedBookings / totalBookings) * 100);
                            master.FINDONEANDUPDATE({
                                query: { _id: new ObjectID(req.auth.credentials._id) },
                                data: { $set: { 'acceptance.acceptanceRate': parseFloat(parseFloat(acceptanceRate).toFixed(2)) } }
                            }, (err, result) => {
                            });
                        }
                    });

                    var bookingExpirePopup = parseInt(bookingData.dispatchSetting.driverAcceptTime || 30); //parseInt(result1.ExpiryLimit) - parseInt(interval);
                    client.setex('bid_' + req.payload.orderId, bookingExpirePopup, req.auth.credentials._id.toString());
                    client.setex('did_' + req.auth.credentials._id.toString(), bookingExpirePopup, req.payload.orderId);
                    //dispatcher use tag
                    master.updateWithoutPromise(
                        { _id: new ObjectID(req.auth.credentials._id.toString()) },
                        { bookingShowingPopup: (bookingData.dispatchSetting.driverAcceptTime || 20) + moment().unix(), isPopupShowing: true }, function (err, booking) {
                        });
                    updateData.bookingShowingPopup = (bookingData.dispatchSetting.driverAcceptTime || 20) + moment().unix();
                    updateData.isPopupShowing = true;
                    updateData['dispatched.$.status'] = "Received But Didn't Respond";


                    dispatchLogs.update({ "bookingId": req.payload.orderId, "driverId": new ObjectID(req.auth.credentials._id.toString()) }, {
                        $set: {
                            ackTime: moment().unix(), "status": 2,
                            "statusMsg": "Received But Didn't Respond"
                        }
                    }, (err, result) => {

                    });

                    webSocket.publish('dispatchLog', { "bookingId": req.payload.orderId, "driverId": new ObjectID(req.auth.credentials._id.toString()), expireTime: moment().unix(), "status": 2, "statusMsg": "Received But Didn't Respond" }, { qos: 2 }, function (mqttErr, mqttRes) {
                    });


                    bookingsUnassigned.Update(condition, updateData, function (err, result1) {
                        if (err) {
                            reply({ "message": dbErrResponse.message }).code(dbErrResponse.code);
                        } else {
                            reply({ message: req.i18n.__('postBookingAck')['200'] }).code(200);
                        }
                    });
                } else {//expired

                    dispatchLogs.update({ "bookingId": req.payload.orderId, "driverId": new ObjectID(req.auth.credentials._id.toString()) }, {
                        $set: {
                            expireTime: moment().unix(), "status": 3,
                            "statusMsg": "Booking Expired"
                        }
                    }, (err, result) => {

                    })
                    webSocket.publish('dispatchLog', { "bookingId": req.payload.orderId, "driverId": new ObjectID(req.auth.credentials._id.toString()), expireTime: moment().unix(), "status": 3, "statusMsg": "Booking Expired" }, { qos: 2 }, function (mqttErr, mqttRes) {
                    });

                    client.del('did_' + req.auth.credentials._id);
                    updateData['dispatched.$.status'] = "Booking Expired";
                    bookingsUnassigned.Update(condition, updateData, function (err, result1) {
                        if (err) {
                            reply({ "message": dbErrResponse.message }).code(dbErrResponse.code);
                        } else {
                            reply({ message: req.i18n.__('postBookingAck')['400'] }).code(400);
                        }
                    });
                }
            });
        } else {
            reply({ message: req.i18n.__('postBookingAck')['404'] }).code(404);
        }
    });
};

let lang = providerErrorMsg['langaugeId'];

const responseCode = {
    status: {
        500: { message: providerErrorMsg['genericErrMsg']['500'] },
        200: { message: providerErrorMsg['postBookingAck']['200'] },
        400: { message: providerErrorMsg['postBookingAck']['400'] },
        404: { message: providerErrorMsg['postBookingAck']['404'] },
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };