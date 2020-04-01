'use strict'
const verificationCode = require('../../../../../models/verificationCode');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../locales');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const cities = require('../../../../../models/cities');
const _ = require('underscore-node');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    let responseData = [];
    cities.getAll({}, (err, zone) => {
        if (err) {
            logger.error('Error occurred during driver get zones (getAll): ' + JSON.stringify(err));
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        var zoneData = [];
        async.forEach(zone, (item, callbackloop) => {
            zoneData.push({
                'id': item._id.toString(),
                'country': item.country,
                'cities': item.cities,
            });
            responseData.push({
                'id': item._id.toString(),
                'country': item.country,
                'cities': [],
            });

            return callbackloop(null);


        }, (loopErr) => {
            for (let i = 0; i < zoneData.length; i++) {
                for (let j = 0; j < zoneData[i].cities.length; j++) {
                    if (zoneData[i].cities[j].isDeleted == false) {
                        responseData[i].cities.push({
                            "cityId": zoneData[i].cities[j].cityId.toString(),
                            "state": zoneData[i].cities[j].state,
                            "cityName": zoneData[i].cities[j].cityName,
                            "currency": zoneData[i].cities[j].currency,
                            "currencySymbol": zoneData[i].cities[j].currencySymbol,
                            "mileageMetric": zoneData[i].cities[j].mileageMetric,
                            "mileageMetricText": zoneData[i].cities[j].mileageMetricText,
                            "weightMetricText": zoneData[i].cities[j].weightMetricText,
                            "weightMetric": zoneData[i].cities[j].weightMetric,
                            "baseFare": zoneData[i].cities[j].baseFare,
                            "mileagePrice": zoneData[i].cities[j].mileagePrice,
                            "waitingFee": zoneData[i].cities[j].waitingFee,
                            "minimumFare": zoneData[i].cities[j].minimumFare,
                            "convenienceFee": zoneData[i].cities[j].convenienceFee,
                            "latitude": zoneData[i].cities[j].latitude,
                            "longitude": zoneData[i].cities[j].longitude
                        });
                        // delete zoneData[i].cities[j].polygonProps;
                        // delete zoneData[i].cities[j].polygons;
                        // delete zoneData[i].cities[j].taxDetails;
                        // delete zoneData[i].cities[j].taxId;
                        // delete zoneData[i].cities[j].tax;
                        // delete zoneData[i].cities[j].onDemandBookingsCancellationFee;
                        // delete zoneData[i].cities[j].onDemandBookingsCancellationFeeAfterMinutes;
                        // delete zoneData[i].cities[j].scheduledBookingsCancellationFeeBeforeMinutes;
                        // delete zoneData[i].cities[j].driverWalletLimits;
                        // delete zoneData[i].cities[j].paymentDetails;
                        // delete zoneData[i].cities[j].scheduledBookingsCancellationFee;
                        // delete zoneData[i].cities[j].paymentId;
                        // delete zoneData[i].cities[j].paymentMethods;
                        // delete zoneData[i].cities[j].mileagePriceAfterDistance;
                        // delete zoneData[i].cities[j].timeFee;
                        // delete zoneData[i].cities[j].timeFeeAfterMinutes;
                        // delete zoneData[i].cities[j].waitingFeeAfterMinutes;
                        // delete zoneData[i].cities[j].height;
                        // delete zoneData[i].cities[j].width;
                        // delete zoneData[i].cities[j].length;
                        // delete zoneData[i].cities[j].coordinates;
                        // delete zoneData[i].cities[j].temperature;
                        // delete zoneData[i].cities[j].abbrevation;
                        // delete zoneData[i].cities[j].abbrevationText;
                        // delete zoneData[i].cities[j].isDeleted;
                        // delete zoneData[i].cities[j].coordinates;
                    }
                }
            }
            return reply({ message: request.i18n.__('stores')['200'], data: responseData }).code(200);
        });
    });
}



/**
* A module that exports get zone Handler, Otp validator! 
* @exports handler 
*/
module.exports = { handler }