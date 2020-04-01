'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;

const providerErrorMsg = require('../../../../../locales');
let bookingsUnassigned = require('../../../../../models/bookingsUnassigned');
let bookingsAssigned = require('../../../../../models/bookingsAssigned');
let locationLogs = require('../../../../../models/locationLogs');
const redis = require('../../../../../library/redis');
var notifyi = require('../../../../../library/mqttModule/mqtt');
var notifications = require('../../../../../library/fcm');
// var liveTrack = require('../../../../../models/liveTracking');
let serverDispatcher = require('../../../../../worker/handlers/serverDispatcher/serverDispatcher');
let client = redis.client;

//10- on the way 11- Arrived,12- Delivery started,13- reached at location , 14- completed ,15- submit

const payload = Joi.object({
    orderId: Joi.number().integer().required().description('booking id'),
    status: Joi.number().integer().allow([10, 11, 12, 13, 14]).required().description('10 - On the Way, 11 - Arrived, 12 - Journey Started,13-reached at location, 14 - Completed'),
    lat: Joi.number().description('latitude'),
    long: Joi.number().description('longitude'),
    distance: Joi.number().when('status', {
        is: 10,
        then: Joi.number().required(),
        otherwise: Joi.optional()
    }).description('Distance in meters only if staus is 10')
}).required();

const APIHandler = (req, reply) => {

    const dbErrResponse = { message:req.i18n.__('genericErrMsg')['500'] , code: 500 };
    let condition = {
        'orderId': req.payload.orderId,
        'dispatched.driverId': new ObjectID(req.auth.credentials._id.toString()),
        //'status': 1
    };

    let bookingData = {};
    let masterData = {};
    let vehicleData = {};

    let checkBooking = () => {
        return new Promise((resolve, reject) => {
            bookingsUnassigned.SelectOne(condition, function (err, bookingDataDB) {
                if (err) {
                    reject(dbErrResponse);
                } else if (bookingDataDB) {
                    bookingData = bookingDataDB;
                    resolve(true);
                } else {
                    reject({ message:req.i18n.__('postRespondTo')['404']   , code: 404 });
                }
            });
        });
    };

    checkBooking()
        .then((data) => {
            return reply({ message: req.i18n.__('postRespondTo')['200']   }).code(200);
        }).catch((e) => {
            return reply({ message: e.message }).code(e.code);
        });
};

let lang = providerErrorMsg['langaugeId'];

const responseCode = {
    status: {
        500: { message: providerErrorMsg['genericErrMsg']['500'] },
        200: { message: providerErrorMsg['postRespondTo']['200'] },
        400: { message: providerErrorMsg['postRespondTo']['400'] },
        404: { message: providerErrorMsg['postRespondTo']['404'] },
        405: { message: providerErrorMsg['postRespondTo']['405'] },
        406: { message: providerErrorMsg['postRespondTo']['405'] },
        407: { message: providerErrorMsg['postRespondTo']['405'] }
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };