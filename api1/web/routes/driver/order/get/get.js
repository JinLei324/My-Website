'use strict'
const driver = require('../../../../../models/driver');
const driverPlans = require('../../../../../models/driverPlans');
const zonesDeliverySlots = require('../../../../../models/zonesDeliverySlots');
const assignOrders = require('../../../../../models/assignOrders');
const locationLogs = require('../../../../../models/locationLogs');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../locales');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const _ = require('underscore-node');
const status = require('../../../../../statusMessages/statusMessages');
const stores = require('../../../../../models/stores');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    let zoneDeliveryData = {};

    let SlotTimings = (slotId) => {
        return new Promise((resolve, reject) => {

            zonesDeliverySlots.getSlots(slotId, (err, dataResponse1) => {
                if (err) {
                    logger.error("Error while getting delivery slots data .... ");
                    reject({ code: 500 });
                } else {
                    zoneDeliveryData = dataResponse1;
                    resolve(true);

                }
            });
        })
    }

    async.waterfall(
        [
            (callback) => {
                driver.isExistsWithId({ "_id": new ObjectID(request.auth.credentials._id) }, (err, driverResult) => {
                    if (err) {
                        logger.error('Error occurred during driver getAssignedTrips(isExistsWithId) : ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                    } else {
                        callback(null, driverResult);
                    }

                });

            }, (driverResult, callback) => {
                let orderIds = [];
                if (driverResult.currentBookings) {
                    for (let i = 0; i < driverResult.currentBookings.length; i++) {
                        orderIds.push(driverResult.currentBookings[i].bid);
                    }
                }

                let conForDriver = { driverId: new ObjectID(request.auth.credentials._id) };
                assignOrders.isDriverIdWithStatus(conForDriver, (err, booking) => {
                    if (err) {
                        logger.error('Error occurred during driver getAssignedTrips(isExistsDriverIdWithStatus) : ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                    } else {
                        callback(null, booking, driverResult);
                    }
                });
            }
        ],
        (tag, booking, driverResult) => {
            var appointment = [];
            var bookingData = booking

            async.eachSeries(booking, (item, callback) => {
                // Get the store details 
                let deliveryFees = 0;
                if (item.storeFreeDelivery) {
                    deliveryFees = item.storeDeliveryFee;
                } else {
                    deliveryFees = item.deliveryCharge;
                }
                let storeId = item.storeId;
                let params = {
                    id: storeId
                }
                if (item.storeType == 5 || item.storeType == "5") {
                    switch (parseInt(item.laundryBookingType)) {
                        case 1:
                            SlotTimings(item.pickupSlotId).then(data => {

                                appointment.push({
                                    // 'status': status.bookingStatus(item.previousState),
                                    'statusMessage': item.statusMsg ? item.statusMsg : "",// 29dec
                                    'customerName': item.customerDetails ? item.customerDetails.name : "",
                                    'customerId': item.customerDetails ? item.customerDetails.customerId : "",
                                    'customerPhone': item.customerDetails ? item.customerDetails.countryCode + item.customerDetails.mobile : "",
                                    'customerPic': item.customerDetails ? item.customerDetails.profilePic : "",
                                    'customerEmail': item.customerDetails ? item.customerDetails.email : "",
                                    'customerChn': item.customerDetails ? item.customerDetails.mqttTopic : "",
                                    'customerMmjCard': item.customerDetails ? item.customerDetails.mmjCard : "",
                                    'customerIdentityCard': item.customerDetails ? item.customerDetails.identityCard : "",
                                    'bid': item.orderId,
                                    'orderDatetime': item.bookingDate,
                                    'orderDateTimeStamp': item.bookingDateTimeStamp,
                                    'dueDatetimeTimeStamp': item.dueDatetimeTimeStamp,
                                    'dueDatetime': item.dueDatetime,
                                    'storeName': item.storeName,
                                    'pickUpAddress': item.storeAddress ? item.storeAddress : item.pickup.addressLine1 + " " + item.pickup.addressLine2,
                                    'subTotalAmount': item.subTotalAmount,
                                    'totalAmount': item.totalAmount,
                                    'cashCollect': item.paidBy.cash,
                                    "currency": item.currency,
                                    "currencySymbol": item.currencySymbol,
                                    "mileageMetric": item.mileageMetric,
                                    'deliveryCharge': deliveryFees,
                                    'deliveryChargeSplit': item.deliveryChargeSplit,
                                    'paymentType': parseInt(item.paymentType),
                                    'payByWallet': parseInt(item.payByWallet),
                                    'paymentTypeMsg': item.paymentTypeMsg,
                                    'orderStatus': item.status,
                                    'dropAddress': (item.drop.flatNumber != "" ? item.drop.flatNumber + "," : "") + (item.drop.landmark != "" ? item.drop.landmark + "," : "") + (item.drop.addressLine1 != "" ? item.drop.addressLine1 + "," : "") + (item.drop.addressLine2 != "" ? item.drop.addressLine2 + "," : "") + (item.drop.city != "" ? item.drop.city + "," : "") + (item.drop.state != "" ? item.drop.state : "") + (item.drop.postalCode != "" ? "-" + item.drop.postalCode : ""),
                                    'pickUpLatLng': item.pickup ? item.pickup.location.latitude + ',' + item.pickup.location.longitude : 0 + ',' + 0,
                                    'dropLatLng': item.drop ? item.drop.location.latitude + ',' + item.drop.location.longitude : 0 + ',' + 0,
                                    // 'pickUpLatLng': item.drop ? item.drop.location.latitude + ',' + item.drop.location.longitude : 0 + ',' + 0,
                                    // 'dropLatLng': item.pickup ? item.pickup.location.latitude + ',' + item.pickup.location.longitude : 0 + ',' + 0,
                                    'shipmentDetails': item.Items,
                                    'driverName': item.driverDetails.fName,
                                    'driverPhone': item.driverDetails.mobile,
                                    'driverEmail': item.driverDetails.email,
                                    'driverPhoto': item.driverDetails.image,
                                    'driverChn': 'driver_' + item.driverDetails.driverId,
                                    'battery': item.driverDetails.batteryPer,
                                    'version': item.driverDetails.appVersion,
                                    'deviceType': item.driverDetails.deviceType_,
                                    'driverId': item.driverDetails.driverId,
                                    'onWayTime': item.timeStamp.onTheWay ? moment.unix(item.timeStamp.onTheWay.timeStamp).format("YYYY-MM-DD HH:mm:ss").toString() : "",
                                    'pickedupTime': item.timeStamp.journeyStart ? moment.unix(item.timeStamp.journeyStart.timeStamp).format("YYYY-MM-DD HH:mm:ss").toString() : "",
                                    "excTax": item.excTax,
                                    'discount': item.discount,
                                    'exclusiveTaxes': item.exclusiveTaxes,
                                    'storePhone': item.storePhone,
                                    'bookingType': item.bookingType ? item.bookingType : 0,
                                    'bookingTypeMsg': item.bookingTypeMsg ? item.bookingTypeMsg : "",
                                    'storeType': item.storeType ? item.storeType : 0,
                                    'weight': item.weight ? item.weight : 0,
                                    'extraNote': item.extraNote ? item.extraNote : "",
                                    'estimatedPackageValue': item.estimatedPackageValue ? item.estimatedPackageValue : 0,
                                    'weightMetric': item.weightMetric ? item.weightMetric : 0,
                                    'weightMetricText': item.weightMetricText ? item.weightMetricText : 0,
                                    'storeTypeMsg': item.storeTypeMsg ? item.storeTypeMsg : "",
                                    "expressDelivery": (typeof item.deliveryChargeSplit.expressDeliveryCharge != "undefined" && item.deliveryChargeSplit.expressDeliveryCharge > 0) ? true : false,
                                    "isCominigFromStore": item.isCominigFromStore ? item.isCominigFromStore : false,
                                    "slotStartTime": zoneDeliveryData.startDateTimestamp ? zoneDeliveryData.startDateTimestamp : 0,
                                    "slotEndTime": zoneDeliveryData.endDateTimestamp ? zoneDeliveryData.endDateTimestamp : 0,

                                });
                                callback();
                            })
                            break;

                        case 2:
                            SlotTimings(item.dropSlotId).then(data => {
                                appointment.push({
                                    // 'status': status.bookingStatus(item.previousState),
                                    'statusMessage': item.statusMsg ? item.statusMsg : "",// 29dec
                                    'customerName': item.customerDetails ? item.customerDetails.name : "",
                                    'customerId': item.customerDetails ? item.customerDetails.customerId : "",
                                    'customerPhone': item.customerDetails ? item.customerDetails.countryCode + item.customerDetails.mobile : "",
                                    'customerPic': item.customerDetails ? item.customerDetails.profilePic : "",
                                    'customerEmail': item.customerDetails ? item.customerDetails.email : "",
                                    'customerChn': item.customerDetails ? item.customerDetails.mqttTopic : "",
                                    'customerMmjCard': item.customerDetails ? item.customerDetails.mmjCard : "",
                                    'customerIdentityCard': item.customerDetails ? item.customerDetails.identityCard : "",
                                    'bid': item.orderId,
                                    'orderDatetime': item.bookingDate,
                                    'orderDateTimeStamp': item.bookingDateTimeStamp,
                                    'dueDatetimeTimeStamp': item.dueDatetimeTimeStamp,
                                    'dueDatetime': item.dueDatetime,
                                    'storeName': item.storeName,
                                    'pickUpAddress': item.storeAddress ? item.storeAddress : item.pickup.addressLine1 + " " + item.pickup.addressLine2,
                                    'subTotalAmount': item.subTotalAmount,
                                    'totalAmount': item.totalAmount,
                                    'cashCollect': item.paidBy.cash,
                                    "currency": item.currency,
                                    "currencySymbol": item.currencySymbol,
                                    "mileageMetric": item.mileageMetric,
                                    'deliveryCharge': deliveryFees,
                                    'deliveryChargeSplit': item.deliveryChargeSplit,
                                    'paymentType': parseInt(item.paymentType),
                                    'payByWallet': parseInt(item.payByWallet),
                                    'paymentTypeMsg': item.paymentTypeMsg,
                                    'orderStatus': item.status,
                                    'dropAddress': (item.drop.flatNumber != "" ? item.drop.flatNumber + "," : "") + (item.drop.landmark != "" ? item.drop.landmark + "," : "") + (item.drop.addressLine1 != "" ? item.drop.addressLine1 + "," : "") + (item.drop.addressLine2 != "" ? item.drop.addressLine2 + "," : "") + (item.drop.city != "" ? item.drop.city + "," : "") + (item.drop.state != "" ? item.drop.state : "") + (item.drop.postalCode != "" ? "-" + item.drop.postalCode : ""),
                                    'pickUpLatLng': item.pickup ? item.pickup.location.latitude + ',' + item.pickup.location.longitude : 0 + ',' + 0,
                                    'dropLatLng': item.drop ? item.drop.location.latitude + ',' + item.drop.location.longitude : 0 + ',' + 0,
                                    // 'pickUpLatLng': item.drop ? item.drop.location.latitude + ',' + item.drop.location.longitude : 0 + ',' + 0,
                                    // 'dropLatLng': item.pickup ? item.pickup.location.latitude + ',' + item.pickup.location.longitude : 0 + ',' + 0,
                                    'shipmentDetails': item.Items,
                                    'driverName': item.driverDetails.fName,
                                    'driverPhone': item.driverDetails.mobile,
                                    'driverEmail': item.driverDetails.email,
                                    'driverPhoto': item.driverDetails.image,
                                    'driverChn': 'driver_' + item.driverDetails.driverId,
                                    'battery': item.driverDetails.batteryPer,
                                    'version': item.driverDetails.appVersion,
                                    'deviceType': item.driverDetails.deviceType_,
                                    'driverId': item.driverDetails.driverId,
                                    'extraNote': item.extraNote ? item.extraNote : "",
                                    'estimatedPackageValue': item.estimatedPackageValue ? item.estimatedPackageValue : 0,
                                    'onWayTime': item.timeStamp.onTheWay ? moment.unix(item.timeStamp.onTheWay.timeStamp).format("YYYY-MM-DD HH:mm:ss").toString() : "",
                                    'pickedupTime': item.timeStamp.journeyStart ? moment.unix(item.timeStamp.journeyStart.timeStamp).format("YYYY-MM-DD HH:mm:ss").toString() : "",
                                    "excTax": item.excTax,
                                    'discount': item.discount,
                                    'exclusiveTaxes': item.exclusiveTaxes,
                                    'storePhone': item.storePhone,
                                    'bookingType': item.bookingType ? item.bookingType : 0,
                                    'bookingTypeMsg': item.bookingTypeMsg ? item.bookingTypeMsg : "",
                                    'weight': item.weight ? item.weight : 0,
                                    'weightMetric': item.weightMetric ? item.weightMetric : 0,
                                    'weightMetricText': item.weightMetricText ? item.weightMetricText : 0,
                                    'storeType': item.storeType ? item.storeType : 0,
                                    'storeTypeMsg': item.storeTypeMsg ? item.storeTypeMsg : "",
                                    "expressDelivery": (typeof item.deliveryChargeSplit.expressDeliveryCharge != "undefined" && item.deliveryChargeSplit.expressDeliveryCharge > 0) ? true : false,
                                    "isCominigFromStore": item.isCominigFromStore ? item.isCominigFromStore : false,
                                    "slotStartTime": zoneDeliveryData.startDateTimestamp ? zoneDeliveryData.startDateTimestamp : 0,
                                    "slotEndTime": zoneDeliveryData.endDateTimestamp ? zoneDeliveryData.endDateTimestamp : 0,

                                });
                                callback();
                            })

                            break;

                        default:
                            callback();
                            break;
                    }

                } else {
                    appointment.push({
                        // 'status': status.bookingStatus(item.previousState),
                        'statusMessage': item.statusMsg ? item.statusMsg : "",// 29dec
                        'customerName': item.customerDetails ? item.customerDetails.name : "",
                        'customerId': item.customerDetails ? item.customerDetails.customerId : "",
                        'customerPhone': item.customerDetails ? item.customerDetails.countryCode + item.customerDetails.mobile : "",
                        'customerPic': item.customerDetails ? item.customerDetails.profilePic : "",
                        'customerEmail': item.customerDetails ? item.customerDetails.email : "",
                        'customerChn': item.customerDetails ? item.customerDetails.mqttTopic : "",
                        'customerMmjCard': item.customerDetails ? item.customerDetails.mmjCard : "",
                        'customerIdentityCard': item.customerDetails ? item.customerDetails.identityCard : "",
                        'bid': item.orderId,
                        'orderDatetime': item.bookingDate,
                        'orderDateTimeStamp': item.bookingDateTimeStamp,
                        'dueDatetimeTimeStamp': item.dueDatetimeTimeStamp,
                        'dueDatetime': item.dueDatetime,
                        'storeName': item.storeName,
                        'pickUpAddress': item.storeAddress ? item.storeAddress : item.pickup.addressLine1 + " " + item.pickup.addressLine2,
                        'subTotalAmount': item.subTotalAmount,
                        'totalAmount': item.totalAmount,
                        'cashCollect': item.paidBy.cash,
                        "currency": item.currency,
                        'extraNote': item.extraNote ? item.extraNote : "",
                        'estimatedPackageValue': item.estimatedPackageValue ? item.estimatedPackageValue : 0,
                        "currencySymbol": item.currencySymbol,
                        "mileageMetric": item.mileageMetric,
                        'deliveryCharge': deliveryFees,
                        'deliveryChargeSplit': item.deliveryChargeSplit,
                        'paymentType': parseInt(item.paymentType),
                        'payByWallet': parseInt(item.payByWallet),
                        'paymentTypeMsg': item.paymentTypeMsg,
                        'orderStatus': item.status,
                        'dropAddress': (item.drop.flatNumber != "" ? item.drop.flatNumber + "," : "") + (item.drop.landmark != "" ? item.drop.landmark + "," : "") + (item.drop.addressLine1 != "" ? item.drop.addressLine1 + "," : "") + (item.drop.addressLine2 != "" ? item.drop.addressLine2 + "," : "") + (item.drop.city != "" ? item.drop.city + "," : "") + (item.drop.state != "" ? item.drop.state : "") + (item.drop.postalCode != "" ? "-" + item.drop.postalCode : ""),
                        'pickUpLatLng': item.pickup ? item.pickup.location.latitude + ',' + item.pickup.location.longitude : 0 + ',' + 0,
                        'dropLatLng': item.drop ? item.drop.location.latitude + ',' + item.drop.location.longitude : 0 + ',' + 0,
                        // 'pickUpLatLng': item.drop ? item.drop.location.latitude + ',' + item.drop.location.longitude : 0 + ',' + 0,
                        // 'dropLatLng': item.pickup ? item.pickup.location.latitude + ',' + item.pickup.location.longitude : 0 + ',' + 0,
                        'shipmentDetails': item.Items,
                        'driverName': item.driverDetails.fName,
                        'driverPhone': item.driverDetails.mobile,
                        'driverEmail': item.driverDetails.email,
                        'driverPhoto': item.driverDetails.image,
                        'driverChn': 'driver_' + item.driverDetails.driverId,
                        'battery': item.driverDetails.batteryPer,
                        'version': item.driverDetails.appVersion,
                        'deviceType': item.driverDetails.deviceType_,
                        'driverId': item.driverDetails.driverId,
                        'onWayTime': item.timeStamp.onTheWay ? moment.unix(item.timeStamp.onTheWay.timeStamp).format("YYYY-MM-DD HH:mm:ss").toString() : "",
                        'pickedupTime': item.timeStamp.journeyStart ? moment.unix(item.timeStamp.journeyStart.timeStamp).format("YYYY-MM-DD HH:mm:ss").toString() : "",
                        "excTax": item.excTax,
                        'discount': item.discount,
                        'exclusiveTaxes': item.exclusiveTaxes,
                        'storePhone': item.storePhone,
                        'bookingType': item.bookingType ? item.bookingType : 0,
                        'bookingTypeMsg': item.bookingTypeMsg ? item.bookingTypeMsg : "",
                        'storeType': item.storeType ? item.storeType : 0,
                        'weight': item.weight ? item.weight : 0,
                        'weightMetric': item.weightMetric ? item.weightMetric : 0,
                        'weightMetricText': item.weightMetricText ? item.weightMetricText : 0,
                        "customerAddress": item.pickup.addressLine1 + " " + item.pickup.addressLine2,
                        "storeAddress": item.storeAddress,
                        'storeTypeMsg': item.storeTypeMsg ? item.storeTypeMsg : "",
                        "expressDelivery": (typeof item.deliveryChargeSplit != "undefined" && item.deliveryChargeSplit.expressDeliveryCharge > 0) ? true : false,
                        // "slotStartTime": zoneDeliveryData.startDateTimestamp ? zoneDeliveryData.startDateTimestamp : 0,
                        // "slotEndTime": zoneDeliveryData.endDateTimestamp ? zoneDeliveryData.endDateTimestamp : 0,

                    });
                    callback();
                }
            }, function (err) {
                if (err) {

                }

                // return reply({ message: error['getProfile']['200'], data: { appointments: appointment, 'driverStatus': typeof driverResult ? (driverResult.status != "undefined" ? driverResult.previousState : 4) : 4 } }).code(200);
                return reply({ message: request.i18n.__('getProfile')['200'], data: { appointments: appointment, 'driverStatus': typeof driverResult ? (driverResult.status != "undefined" ? driverResult.previousState : 4) : 4 } }).code(200);
            });

        });
}

/**
* A module that exports get vehicle type Handler,validator! 
* @exports handler 
*/
module.exports = { handler }