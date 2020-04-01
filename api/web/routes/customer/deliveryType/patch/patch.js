'use strict'
const zones = require('../../../../../models/zones');
const stores = require('../../../../../models/stores');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const async = require('async');
const distance = require('google-distance');
const googleDistance = require('../../../../commonModels/googleApi');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    zones.inZone({ lat: request.payload.latitude, long: request.payload.longitude }, (err, data) => {
        if (err) {
            logger.error('Error occurred during get fare (inZone): ' + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        if (data) {
            const readStore = (itemId) => {
                return new Promise((resolve, reject) => {
                    stores.isExist({ id: itemId }, (err, data) => {
                        if (err) {
                            reject(err);
                        }
                        resolve(data);
                    });
                });
            }
            let responseArray = [];
            async.each(request.payload.store, (item, callback) => {
                readStore(item.storeId).then(store => {
                    if (store) {
                        let deliveryPrice = 0;
                        if (parseFloat(item.storePrice) < parseFloat(store.freeDeliveryAbove)) {
                            // distance.get(
                            //     {
                            //         index: 1,
                            //         origin: store.coordinates.latitude + ',' + store.coordinates.longitude,
                            //         destination: request.payload.latitude + ',' + request.payload.longitude
                            //     },
                            //     (err, distanceMeasured) => {
                            let origin = store.coordinates.latitude + ',' + store.coordinates.longitude;
                            let dest = request.payload.latitude + ',' + request.payload.longitude;
                            googleDistance.calculateDistance(origin, dest).then(distanceMeasured => {
                                if (err) logger.error('Error occurred during fare calculate get (distance.get): ' + JSON.stringify(err));
                                let distanceMiles = 0;
                                let distanceKm = 0;
                                let estimatedTime = 0;
                                if (distanceMeasured) {
                                    let result = distanceMeasured.distance;
                                    result *= 0.000621371192;
                                    distanceMiles = result;
                                    distanceKm = distanceMeasured.distance;
                                    estimatedTime = distanceMeasured.durationMins;
                                    deliveryPrice = (result > 0) ? parseFloat(parseFloat(parseFloat(result) * parseFloat(store.pricePerMile)).toFixed(2)) : parseFloat(store.pricePerMile);
                                    responseArray.push({ storeId: item.storeId, storeDeliveryFee: deliveryPrice })
                                }
                                callback();
                            }).catch((err) => {
                                logger.error('Error occurred during  update cart  (calculateDistance): ' + JSON.stringify(err));
                                responseArray.push({ storeId: item.storeId, storeDeliveryFee: deliveryPrice })
                            });
                        } else {
                            responseArray.push({ storeId: item.storeId, storeDeliveryFee: deliveryPrice })
                            callback();
                        }
                    } else {
                        // return reply({
                        //     message: error['stores']['404'][request.headers.language]
                        // }).code(404);
                        return reply({ message: request.i18n.__('stores')['404'] }).code(404);
                    }
                }).catch(e => {
                    logger.error('err during get fare(catch) ' + JSON.stringify(e));
                    // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                });
            }, function (err) {
                // return reply({ message: error['fare']['200'][request.headers.language], data: responseArray }).code(200);
                return reply({ message: request.i18n.__('fare')['200'], data: responseArray }).code(200);
            });
        } else {
            // return reply({ message: error['checkOperationZone']['400'][request.headers.language] }).code(400);
            return reply({ message: request.i18n.__('checkOperationZone')['400'] }).code(400);
        }
    });
}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    latitude: Joi.number().required().description('Latitude'),
    longitude: Joi.number().required().description('Longitude'),
    store: Joi.array().items().required().description('Store Id ["5a0ed15585985b60fa3aa8e9","5a0ed15585985b60fa3aa8e9"]')
}
/**
* A module that exports customer send otp handler, send otp validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }