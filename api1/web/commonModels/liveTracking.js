 
var CONFIG = process.env;
// var STATUS = require('../statusMsg/status');
const error = require('../../statusMessages/responseMessage');
var AUTH = require('../middleware/authentication');//auth module
var JWT = require('jsonwebtoken');
var MOMENT = require('moment');
var ASYNC = require('async');

// var SMS = require('./SmsGatway.js');//to send sms to the receivers


var GOOGLE = require('googleapis');
var URLSHORTENER = GOOGLE.urlshortener({ version: 'v1', auth: CONFIG.GoogleUrlShortenerAPIKey });

/**
 * Method to shorten the url using googleapis library
 * @param {*} url - the long url to shorten
 */
function shortenURL(url, callback) {
     URLSHORTENER.url.insert({ 'resource': { 'longUrl': url } }, (err, result) => {
        if (err) return callback(err);

        return callback(null, result.id);
    });
};
/* +_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+ */


module.exports = LIVETRACK = {};

/**
 * APi to shorten a url
 * @param {*} url
 */
LIVETRACK.shortenUrl = (req, reply) => {

    shortenURL(req.payload.url, (err, url) => {
        if (err) return reply(err);

        return reply({ url: url });
    });
}

/**
 * APi to generate a tracking link & shorten the tracking url
 * @param {*} id - the shipment id
 */
LIVETRACK.generateTrackingLink = (req, reply) => {

    MONGO.SelectOne('ShipmentDetails', { order_id: parseInt(req.payload.id) }, (err, doc) => {
        if (err) return reply(STATUS.status(3));

        if (doc === null) return reply(STATUS.status(9));

        let token = AUTH.SignJWT({ id: doc.order_id.toString() }, 'liveTrack');//sign a new JWT

        shortenURL(CONFIG.TrackingUrl + token, (err, url) => {
            if (err) return reply(err);

            return reply({ url: url });
        });
    });
}

/**
 * APi - for customers to live track their shipment
 * @param {*} token - contains the shipment id
 */
LIVETRACK.liveTrack = (req, reply) => {

    var id = '';//shipment id
    var trackingDetails = {};

    ASYNC.waterfall([
        function (cb) {
            JWT.verify(req.params.token, CONFIG.Secret, { subject: 'liveTrack' }, (err, decoded) => {
                if (err) return cb({ statusCode: 401, message: 'unauthorized' });

                id = parseInt(decoded.id);

                return cb(null, 'done');
            });
        },//validate the token & get the shipment id

        function (status, cb) {

            MONGO.SelectOne('ShipmentDetails', { order_id: id }, (err, doc) => {
                if (err) return cb(STATUS.status(3));

                if (doc === null) return cb(STATUS.status(9));

                if (doc.status == 10) return cb({ errFlag: 1, errMsg: 'Link expired', errNum: 400 });

                return cb(null, doc);
            });
        },//check if the shipment details are valid

        function (doc, cb) {

            trackingDetails = {
                orderId: doc.order_id,
                channel: doc.passanger_chn,
                pickupLocation: doc.pickup_location || {},
                dropLocation: doc.drop_location || {},
                status: doc.status || '',
                vehicleDetails: {
                    plateNo: doc.vehicleData.platNo || '',
                    name: doc.vehicleType[0].type_name || '',
                    make: doc.vehicleType[0].make || '',
                    model: doc.vehicleType[0].model || '',
                    image: doc.vehicleType[0].vehicle_img || ''
                },
                shipmentDetails: {
                    name: doc.receivers[0].goodType || '',
                    image: doc.receivers[0].photo || '',
                    loadType: doc.receivers[0].loadType || '',
                    quantity: doc.receivers[0].quantity || '',
                    widht: doc.receivers[0].widht || '',
                    height: doc.receivers[0].height || '',
                    weight: doc.receivers[0].weight || '',
                    info: doc.receivers[0].info || ''
                }
            };

            return cb(null, doc);
        },//generate the tracking details

        function (doc, cb) {

            MONGO.SelectOne('masters', { _id: new ObjectID(doc.mas_id) }, (err, master) => {
                if (err) return cb(STATUS.status(3));

                if (master === null) return cb(STATUS.status(8))

                trackingDetails['driverDetails'] = {
                    name: master.firstName + ' ' + master.lastName || '',
                    email: master.email || '',
                    phone: master.mobile || '',
                    status: master.status || '',
                    image: master.profile_pic || '',
                    lastSeen: master.lastTs || ''
                }

                // trackingDetails['driverChn'] = master.publishChn || '';

                trackingDetails['driverLocation'] = master.location || {};

                return cb(null, 'done');
            });
        },//get the master details

        function (tocontinue, cb) {

            MONGO.SelectOne('appConfig', { pubnubkeys: { $exists: true } }, (err, doc) => {
                if (err) return cb(err);

                if (typeof doc.pubnubkeys != 'undefined') {
                    trackingDetails.publishKey = doc.pubnubkeys.publishKey || '';
                    trackingDetails.subscribeKey = doc.pubnubkeys.subscribeKey || '';
                }
                else {
                    trackingDetails.publishKey = '';
                    trackingDetails.subscribeKey = '';
                }

                return cb(null, 'done');
            });
        }//get the pubnub keys
    ], (err, results) => {
        if (err) return reply(err).code(err.statusCode || 200);

        return reply({ errNum: 200, errMsg: 'Success', errFlag: 0, data: trackingDetails });
    });
}

/**
 * Method to generate a tracking link & sms the link to the receiver
 * @param {*} params - id (mongo id of the order)
 */
LIVETRACK.generateAndSendTrackingLink = (params, callback) => {

    MONGO.SelectOne('ShipmentDetails', { _id: new ObjectID(params.id) }, (err, doc) => {
        if (err) return callback({message : error['genericErrMsg']['500'][request.headers.language] });

        if (doc === null)    return callback({ message: error['orders']['404'][request.headers.language] , code:404 }) 

        let token = AUTH.SignJWT({ id: doc._id.toString() }, 'liveTrack');//sign a new JWT

        shortenURL(CONFIG.TrackingUrl + token, (err, url) => {
            if (err) return callback(err);

            let phoneNumber = doc.slaveCountryCode + doc.receivers[0].mobile;
            let msg = 'Hi ' + doc.receivers[0].name + ', Visit ' + url + ' to track your order ' + doc.order_id + ' on Day Runner';

            SMS.sendSms({ mobile: phoneNumber, msg: msg }, () => { });//send sms to receivers mobile

            return callback({ url: url });
        });//shorten the tracking link
    });

};

/* +_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+ */