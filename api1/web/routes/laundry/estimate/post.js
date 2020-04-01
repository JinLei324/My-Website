'use strict'
const zones = require('../../../../models/zones');
const city = require('../../../../models/promoCampaigns/city');
const googleDistance = require('../../../commonModels/googleApi');
const stores = require('../../../../models/stores');
const Joi = require('joi');
const logger = require('winston');


const payloadValidator = Joi.object({
    pickupLatitude: Joi.number().required().description("Customer PickUp Latitude is required").default(13.0195677),
    pickupLongitude: Joi.number().required().description("Customer PickUp Longitude is required").default(77.5968131),
    dropLatitude: Joi.number().required().description("Customer Drop Latitude is required").default(13.0195677),
    dropLongitude: Joi.number().required().description("Customer Drop Longitude is required").default(77.5968131),
    laundryType: Joi.number().required().description("1 - Normal , 2 - Express"),
    storeCategoryId: Joi.string().required().description("ex : 5a281337005a4e3b65bf12a8").example("5a281337005a4e3b65bf12a8").max(24).min(24).error(new Error('store category Id is missing or incorrect it must be 24 char || digit only')),
    storeType: Joi.number().required().description("store type")

}).required();


const APIHandler = (req, reply) => {

    // req.headers.language = "en";

    let pickUpZoneData = {};
    let responseData = {};
    let deliveryPricePickup = 0;
    let deliveryPriceDrop = 0;
    let nearestStoreLatLong = {};
    let dropZoneData = {};
    let taxDetails = [];
    let taxDetailsData = [];
    let finalTaxData = [];
    let laundryDetails = {};
    let cityData = {};
    let laundryDetailsData = [];
    let getPickupAreaZone = () => {
        return new Promise((resolve, reject) => {
            zones.inZoneAll({ lat: req.payload.pickupLatitude, long: req.payload.pickupLongitude }, (err, data) => {
                if (err) {
                    reject({ code: 500 });
                }
                if (data) {
                    pickUpZoneData = data;
                } else {
                    pickUpZoneData = {};
                }
                resolve(pickUpZoneData);
            });
        });
    };
    let getDropAreaZone = () => {
        return new Promise((resolve, reject) => {
            zones.inZoneAll({ lat: req.payload.dropLatitude, long: req.payload.dropLongitude }, (err, data) => {
                if (err) {
                    reject({ code: 500 });
                }
                if (data) {
                    dropZoneData = data;
                } else {
                    dropZoneData = {};
                }
                resolve(dropZoneData);
            });
        });
    };
    let getNearByStore = () => {
        return new Promise((resolve, reject) => {

            stores.getNearbyLaundry({
                lat: req.payload.pickupLatitude,
                long: req.payload.pickupLongitude,
                zoneId: pickUpZoneData[0]._id.toString(),
                storeCategoryId: req.payload.storeCategoryId,
                storeType: req.payload.storeType
            }, (err, store) => {
                if (err) {
                    reject({ code: 500 });
                }
                if (store) {
                    nearestStoreLatLong = store.coordinates;
                } else {
                    nearestStoreLatLong = {
                        "longitude": 77.589564,
                        "latitude": 13.028694
                    };
                }
                resolve(nearestStoreLatLong)
            })
        })
    }
    let getDistanceFromStoreToCustomer = () => {
        return new Promise((resolve, reject) => {
            let destDelivery = req.payload.dropLatitude + ',' + req.payload.dropLongitude;
            let originDelivery = nearestStoreLatLong.latitude + ',' + nearestStoreLatLong.longitude;
            googleDistance.calculateDistance(originDelivery, destDelivery).then(distanceMeasuredDelivery => {

                let distanceMilesDel = 0;
                let distanceKmDel = 0;
                let estimatedTimeDel = 0;
                let resultDel = distanceMeasuredDelivery.distance;
                resultDel *= 0.000621371192;
                distanceMeasuredDelivery.distanceMiles = resultDel;
                distanceMilesDel = resultDel;
                distanceKmDel = distanceMeasuredDelivery.distance;
                estimatedTimeDel = distanceMeasuredDelivery.duration;
                deliveryPriceDrop = (distanceMeasuredDelivery.distanceMiles > 0) ? parseFloat(parseFloat(parseFloat(distanceMeasuredDelivery.distanceMiles) * parseFloat(cityData.cities.mileagePrice)).toFixed(2)) : parseFloat(cityData.cities.mileagePrice);
                responseData.estimateAmount += deliveryPriceDrop;
                responseData.deliveryPriceFromLaundromatToCustomer = deliveryPriceDrop;
                resolve(responseData);
            }).catch((err) => {
                logger.error('Error occurred during fare calculate get (calculateDistance): 222', err);
                reject({ code: 500 });
            });

        })

    }

    let getDistanceFromCustomerToStore = () => {
        return new Promise((resolve, reject) => {
            let origin = req.payload.pickupLatitude + ',' + req.payload.pickupLongitude;
            let dest = nearestStoreLatLong.latitude + ',' + nearestStoreLatLong.longitude;
            googleDistance.calculateDistance(origin, dest).then(distanceMeasured => {

                let distanceMiles = 0;
                let distanceKm = 0;
                let estimatedTime = 0;
                let result = distanceMeasured.distance;
                result *= 0.000621371192;
                distanceMeasured.distanceMiles = result;
                distanceMiles = result;
                distanceKm = distanceMeasured.distance;
                estimatedTime = distanceMeasured.duration;
                deliveryPricePickup = (distanceMeasured.distanceMiles > 0) ? parseFloat(parseFloat(parseFloat(distanceMeasured.distanceMiles) * parseFloat(cityData.cities.mileagePrice)).toFixed(2)) : parseFloat(cityData.cities.mileagePrice);

                responseData.estimateAmount += deliveryPricePickup;
                responseData.deliveryPriceFromCustomerToLaundromat = deliveryPricePickup;
                resolve(cityData)
            }).catch((err) => {
                logger.error('Error occurred during fare calculate get (calculateDistance): 111', err);
                reject({ code: 500 });
            });
        })
    }



    let getEstimateData = () => {
        return new Promise((resolve, reject) => {
            if (dropZoneData[0].city_ID == pickUpZoneData[0].city_ID) {
                if (dropZoneData[0]._id.toString() === pickUpZoneData[0]._id.toString()) {
                    city.cityDetails(pickUpZoneData[0].city_ID, (cityDetailsError, cityDetailsResponse) => {
                        cityData = cityDetailsResponse[0];
                        if (cityDetailsError) {
                            reject({ code: 500 })
                        } else {
                            taxDetails = cityData.cities.taxDetails;
                            laundryDetails = cityData.cities.laundry[0];
                            for (var k = 0; k < taxDetails.length; k++) {
                                taxDetailsData.push({
                                    'taxname': taxDetails[k].name[req.headers.language],
                                    'taxAmount': taxDetails[k].value
                                })
                            }
                            responseData.estimateAmount = 0;
                            responseData.expressDeliveryCharge = 0;
                            responseData.deliveryPriceFromCustomerToLaundromat = 0;
                            responseData.deliveryPriceFromLaundromatToCustomer = 0;
                            if (req.payload.laundryType == 2) {
                                responseData.estimateAmount += laundryDetails.extraFeeForExpressDelivery;
                                responseData.expressDeliveryCharge = laundryDetails.extraFeeForExpressDelivery;
                            }
                            resolve(cityData)
                        }
                    });
                } else {
                    return reply({ message: req.i18n.__('estimateDelivery')['403'] }).code(403);
                }
            } else {
                return reply({ message: req.i18n.__('estimateDelivery')['402'] }).code(402);
            }
        });
    }

    getPickupAreaZone()
        .then(getDropAreaZone)
        .then(getNearByStore)
        .then(getEstimateData)
        .then(getDistanceFromCustomerToStore)
        .then(getDistanceFromStoreToCustomer)
        .then(estimateAmount => {
            return reply({
                message: req.i18n.__('genericErrMsg')['200'],
                data: {
                    'deliveryFee': estimateAmount,
                    'taxData': finalTaxData,
                    'currencySymbol': pickUpZoneData[0].currencySymbol
                }
            }).code(200);
        }).catch(e => {
            logger.error("Customer ride live booking API error =>", e)
            return reply({
                message: e.message
            }).code(e.code);
        });

};


module.exports = {
    payloadValidator,
    APIHandler
};