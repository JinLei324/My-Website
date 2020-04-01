const newOrders = require('../../../../../models/order');
const unassignOrders = require('../../../../../models/unassignOrders');
const assignOrders = require('../../../../../models/assignOrders');
const completedOrders = require('../../../../../models/completedOrders');
const pickupOrders = require('../../../../../models/pickupOrders');
const mobileDevices = require('../../../../../models/mobileDevices');
const customer = require('../../../../../models/customer');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const status = require('../../../../../statusMessages/statusMessages');
const config = process.env;
var Joi = require('joi');
const logger = require('winston');
const ObjectId = require('mongodb').ObjectID;
const moment = require('moment');//date-time
const async = require('async');
const driver = require('../../../../../models/driver');
/** 
* @function
* @name handler
* @param {string} status -  0 - Active , 1 - Banned , 2 - Unverfied.
* @return {object} Reply to the user.
*/

const handler = (req, reply) => {
    // req.headers.language = 'en';
    let ordersArray = [];
    let data = {};
    let pageIndex = req.params.pageIndex;
    let skip = pageIndex * 10;
    let limit = 10;

    const readNewOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            newOrders.getOrders({ skip: skip, limit: limit, customerId: req.auth.credentials._id.toString(), storeType: req.params.storeType }, (err, res) => {
                if (res.length > 0) {
                    for (let i = 0; i < res.length; i++) {
                        ordersArray.push({
                            orderId: res[i].orderId,
                            // bookingDate: res[i].bookingDate,
                            bookingDate: res[i].timeStamp.created ? res[i].timeStamp.created.timeStamp : "",
                            pickAddress: res[i].pickup ? res[i].pickup.addressLine1 + ' ' + res[i].pickup.addressLine2 : '',
                            pickupLong: res[i].pickup ? res[i].pickup.location.longitude : 0,
                            pickupLat: res[i].pickup ? res[i].pickup.location.latitude : 0,
                            dropLat: res[i].drop ? res[i].drop.location.latitude : 0,
                            dropLong: res[i].drop ? res[i].drop.location.longitude : 0,
                            dropAddress: res[i].drop ? res[i].drop.addressLine1 + ' ' + res[i].drop.addressLine2 : '',
                            statusMessage: status.bookingStatus(res[i].status, res[i].isCominigFromStore, res[i].storeType),
                            statusCode: res[i].status,
                            storeId: res[i].storeId,
                            storeName: res[i].storeName,
                            currencySymbol: res[i].currencySymbol,
                            currency: res[i].currency,
                            storeAddress: res[i].storeAddress,
                            totalAmount: res[i].totalAmount,
                            serviceType: res[i].serviceType,
                            items: res[i].Items,
                            bookingType: res[i].bookingType,
                            dueDatetime: res[i].dueDatetimeTimeStamp,
                            timeStamp: res[i].timeStamp.created.timeStamp,
                            driverId: res[i].driverDetails ? res[i].driverDetails.driverId : "",
                            driverName: res[i].driverDetails ? res[i].driverDetails.lName ? res[i].driverDetails.fName + res[i].driverDetails.lName : res[i].driverDetails.fName : "",
                            subTotalAmountWithExcTax: res[i].subTotalAmountWithExcTax ? res[i].subTotalAmountWithExcTax : res[i].subTotalAmount,
                            subTotalAmount: res[i].subTotalAmount,
                            deliveryCharge: res[i].deliveryCharge,
                            excTax: res[i].excTax,
                            exclusiveTaxes: res[i].exclusiveTaxes,
                            driverMobile: res[i].driverDetails ? res[i].driverDetails.countryCode + res[i].driverDetails.mobile : "",
                            driverImage: res[i].driverDetails ? res[i].driverDetails.image : "",
                            driverEmail: res[i].driverDetails ? res[i].driverDetails.email : "",
                            paidBy: res[i].paidBy ? res[i].paidBy : {},
                            payByWallet: res[i].payByWallet ? res[i].payByWallet : "",
                            cancellationFee: res[i].accouting ? res[i].accouting.cancelationFee : 0,
                            timeStampObject: res[i].timeStamp
                        });
                    }
                }
                data.ordersArray = ordersArray;
                return err ? reject(err) : resolve(data);
            });
        });
    }





    const readAcceptedOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            newOrders.getAcceptedOrders({ skip: skip, limit: limit, customerId: req.auth.credentials._id.toString(), storeType: req.params.storeType }, (err, res) => {
                if (res.length > 0) {
                    for (let i = 0; i < res.length; i++) {
                        ordersArray.push({
                            orderId: res[i].orderId,
                            // bookingDate: res[i].bookingDate,
                            bookingDate: res[i].timeStamp.created ? res[i].timeStamp.created.timeStamp : "",
                            pickAddress: res[i].pickup ? res[i].pickup.addressLine1 + ' ' + res[i].pickup.addressLine2 : '',
                            pickupLong: res[i].pickup ? res[i].pickup.location.longitude : 0,
                            pickupLat: res[i].pickup ? res[i].pickup.location.latitude : 0,
                            dropLat: res[i].drop ? res[i].drop.location.latitude : 0,
                            dropLong: res[i].drop ? res[i].drop.location.longitude : 0,
                            dropAddress: res[i].drop ? res[i].drop.addressLine1 + ' ' + res[i].drop.addressLine2 : '',
                            statusMessage: status.bookingStatus(res[i].status, res[i].isCominigFromStore, res[i].storeType),
                            statusCode: res[i].status,
                            storeId: res[i].storeId,
                            storeName: res[i].storeName,
                            currencySymbol: res[i].currencySymbol,
                            currency: res[i].currency,
                            storeAddress: res[i].storeAddress,
                            totalAmount: res[i].totalAmount,
                            serviceType: res[i].serviceType,
                            items: res[i].Items,
                            bookingType: res[i].bookingType,
                            dueDatetime: res[i].dueDatetimeTimeStamp,
                            timeStamp: res[i].timeStamp.created.timeStamp,
                            driverId: res[i].driverDetails ? res[i].driverDetails.driverId : "",
                            driverName: res[i].driverDetails ? res[i].driverDetails.lName ? res[i].driverDetails.fName + res[i].driverDetails.lName : res[i].driverDetails.fName : "",
                            subTotalAmountWithExcTax: res[i].subTotalAmountWithExcTax ? res[i].subTotalAmountWithExcTax : res[i].subTotalAmount,
                            subTotalAmount: res[i].subTotalAmount,
                            deliveryCharge: res[i].deliveryCharge,
                            excTax: res[i].excTax,
                            exclusiveTaxes: res[i].exclusiveTaxes,
                            driverMobile: res[i].driverDetails ? res[i].driverDetails.countryCode + res[i].driverDetails.mobile : "",
                            driverImage: res[i].driverDetails ? res[i].driverDetails.image : "",
                            driverEmail: res[i].driverDetails ? res[i].driverDetails.email : "",
                            paidBy: res[i].paidBy ? res[i].paidBy : {},
                            payByWallet: res[i].payByWallet ? res[i].payByWallet : "",
                            cancellationFee: res[i].accouting ? res[i].accouting.cancelationFee : 0,
                            timeStampObject: res[i].timeStamp
                        });
                    }
                }
                data.ordersArray = ordersArray;
                return err ? reject(err) : resolve(data);
            });
        });
    }










    const readPickupOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            pickupOrders.getOrders({ skip: skip, limit: limit, customerId: req.auth.credentials._id.toString(), storeType: req.params.storeType }, (err, res) => {
                if (res.length > 0) {
                    for (let i = 0; i < res.length; i++) {
                        ordersArray.push({
                            orderId: res[i].orderId,
                            // bookingDate: res[i].bookingDate,
                            bookingDate: res[i].timeStamp.created ? res[i].timeStamp.created.timeStamp : "",
                            pickAddress: res[i].pickup ? res[i].pickup.addressLine1 + ' ' + res[i].pickup.addressLine2 : '',
                            pickupLong: res[i].pickup ? res[i].pickup.location.longitude : 0,
                            pickupLat: res[i].pickup ? res[i].pickup.location.latitude : 0,
                            dropLat: res[i].drop ? res[i].drop.location.latitude : 0,
                            dropLong: res[i].drop ? res[i].drop.location.longitude : 0,
                            dropAddress: res[i].drop ? res[i].drop.addressLine1 + ' ' + res[i].drop.addressLine2 : '',
                            statusMessage: status.bookingStatus(res[i].status, res[i].isCominigFromStore, res[i].storeType),
                            statusCode: res[i].status,
                            storeId: res[i].storeId,
                            storeName: res[i].storeName,
                            currencySymbol: res[i].currencySymbol,
                            currency: res[i].currency,
                            storeAddress: res[i].storeAddress,
                            totalAmount: res[i].totalAmount,
                            serviceType: res[i].serviceType,
                            items: res[i].Items,
                            bookingType: res[i].bookingType,
                            dueDatetime: res[i].dueDatetimeTimeStamp,
                            timeStamp: res[i].timeStamp.created.timeStamp,
                            driverId: res[i].driverDetails ? res[i].driverDetails.driverId : "",
                            driverName: res[i].driverDetails ? res[i].driverDetails.lName ? res[i].driverDetails.fName + res[i].driverDetails.lName : res[i].driverDetails.fName : "",
                            subTotalAmountWithExcTax: res[i].subTotalAmountWithExcTax ? res[i].subTotalAmountWithExcTax : res[i].subTotalAmount,
                            subTotalAmount: res[i].subTotalAmount,
                            deliveryCharge: res[i].deliveryCharge,
                            excTax: res[i].excTax,
                            exclusiveTaxes: res[i].exclusiveTaxes,
                            driverMobile: res[i].driverDetails ? res[i].driverDetails.countryCode + res[i].driverDetails.mobile : "",
                            driverImage: res[i].driverDetails ? res[i].driverDetails.image : "",
                            driverEmail: res[i].driverDetails ? res[i].driverDetails.email : "",
                            paidBy: res[i].paidBy ? res[i].paidBy : {},
                            payByWallet: res[i].payByWallet ? res[i].payByWallet : "",
                            cancellationFee: res[i].accouting ? res[i].accouting.cancelationFee : 0,
                            timeStampObject: res[i].timeStamp
                        });
                    }
                }
                data.ordersArray = ordersArray;
                return err ? reject(err) : resolve(data);
            });
        });
    }
    const readUnassignOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            unassignOrders.getOrders({ skip: skip, limit: limit, customerId: req.auth.credentials._id.toString(), storeType: req.params.storeType }, (err, res) => {
                if (res.length > 0) {
                    for (let i = 0; i < res.length; i++) {
                        ordersArray.push({
                            orderId: res[i].orderId,
                            // bookingDate: res[i].bookingDate,
                            bookingDate: res[i].timeStamp.created ? res[i].timeStamp.created.timeStamp : "",
                            pickupLong: res[i].pickup ? res[i].pickup.location.longitude : 0,
                            pickupLat: res[i].pickup ? res[i].pickup.location.latitude : 0,
                            dropLat: res[i].drop ? res[i].drop.location.latitude : 0,
                            dropLong: res[i].drop ? res[i].drop.location.longitude : 0,
                            pickAddress: res[i].pickup ? res[i].pickup.addressLine1 + ' ' + res[i].pickup.addressLine2 : '',
                            dropAddress: res[i].drop ? res[i].drop.addressLine1 + ' ' + res[i].drop.addressLine2 : '',
                            statusMessage: status.bookingStatus(res[i].status, res[i].isCominigFromStore, res[i].storeType),
                            statusCode: res[i].status,
                            storeId: res[i].storeId,
                            storeName: res[i].storeName,
                            currencySymbol: res[i].currencySymbol,
                            currency: res[i].currency,
                            storeAddress: res[i].storeAddress,
                            totalAmount: res[i].totalAmount,
                            items: res[i].Items,
                            serviceType: res[i].serviceType,
                            bookingType: res[i].bookingType,
                            dueDatetime: res[i].dueDatetimeTimeStamp,
                            timeStamp: res[i].timeStamp.created.timeStamp,
                            driverId: res[i].driverDetails ? res[i].driverDetails.driverId : "",
                            driverName: res[i].driverDetails ? res[i].driverDetails.lName ? res[i].driverDetails.fName + res[i].driverDetails.lName : res[i].driverDetails.fName : "",
                            subTotalAmountWithExcTax: res[i].subTotalAmountWithExcTax ? res[i].subTotalAmountWithExcTax : res[i].subTotalAmount,
                            subTotalAmount: res[i].subTotalAmount,
                            deliveryCharge: res[i].deliveryCharge,
                            excTax: res[i].excTax,
                            exclusiveTaxes: res[i].exclusiveTaxes,
                            driverMobile: res[i].driverDetails ? res[i].driverDetails.countryCode + res[i].driverDetails.mobile : "",
                            driverImage: res[i].driverDetails ? res[i].driverDetails.image : "",
                            driverEmail: res[i].driverDetails ? res[i].driverDetails.email : "",
                            paidBy: res[i].paidBy ? res[i].paidBy : {},
                            payByWallet: res[i].payByWallet ? res[i].payByWallet : "",
                            cancellationFee: res[i].accouting ? res[i].accouting.cancelationFee : 0,
                            timeStampObject: res[i].timeStamp
                        });
                    }
                }
                data.ordersArray = ordersArray;
                return err ? reject(err) : resolve(data);
            });
        });
    }
    const readAssignOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            assignOrders.getOrders({ skip: skip, limit: limit, customerId: req.auth.credentials._id.toString(), storeType: req.params.storeType }, (err, res) => {
                if (res.length > 0) {
                    for (let i = 0; i < res.length; i++) {
                        ordersArray.push({
                            orderId: res[i].orderId,
                            // bookingDate: res[i].bookingDate,
                            bookingDate: res[i].timeStamp.created ? res[i].timeStamp.created.timeStamp : "",
                            pickupLong: res[i].pickup ? res[i].pickup.location.longitude : 0,
                            pickupLat: res[i].pickup ? res[i].pickup.location.latitude : 0,
                            dropLat: res[i].drop ? res[i].drop.location.latitude : 0,
                            dropLong: res[i].drop ? res[i].drop.location.longitude : 0,
                            pickAddress: res[i].pickup.addressLine1 + ' ' + res[i].pickup.addressLine2,
                            dropAddress: res[i].drop ? res[i].drop.addressLine1 + ' ' + res[i].drop.addressLine2 : '',
                            statusMessage: status.bookingStatus(res[i].status, res[i].isCominigFromStore, res[i].storeType),
                            statusCode: res[i].status,
                            storeId: res[i].storeId,
                            storeName: res[i].storeName,
                            currencySymbol: res[i].currencySymbol,
                            currency: res[i].currency,
                            storeAddress: res[i].storeAddress,
                            totalAmount: res[i].totalAmount,
                            items: res[i].Items,
                            serviceType: res[i].serviceType,
                            bookingType: res[i].bookingType,
                            dueDatetime: res[i].dueDatetimeTimeStamp,
                            timeStamp: res[i].timeStamp.created.timeStamp,
                            driverId: res[i].driverDetails ? res[i].driverDetails.driverId : "",
                            driverName: res[i].driverDetails ? res[i].driverDetails.lName ? res[i].driverDetails.fName + res[i].driverDetails.lName : res[i].driverDetails.fName : "",
                            subTotalAmountWithExcTax: res[i].subTotalAmountWithExcTax ? res[i].subTotalAmountWithExcTax : res[i].subTotalAmount,
                            subTotalAmount: res[i].subTotalAmount,
                            deliveryCharge: res[i].deliveryCharge,
                            excTax: res[i].excTax,
                            exclusiveTaxes: res[i].exclusiveTaxes,
                            driverMobile: res[i].driverDetails ? res[i].driverDetails.countryCode + res[i].driverDetails.mobile : "",
                            driverImage: res[i].driverDetails ? res[i].driverDetails.image : "",
                            driverEmail: res[i].driverDetails ? res[i].driverDetails.email : "",
                            paidBy: res[i].paidBy ? res[i].paidBy : {},
                            payByWallet: res[i].payByWallet ? res[i].payByWallet : "",
                            cancellationFee: res[i].accouting ? res[i].accouting.cancelationFee : 0,
                            timeStampObject: res[i].timeStamp
                        });
                    }
                }
                data.ordersArray = ordersArray;
                return err ? reject(err) : resolve(data);
            });
        });
    }
    const readCompletedOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            completedOrders.getOrders({ skip: skip, limit: limit, customerId: req.auth.credentials._id.toString(), storeType: req.params.storeType }, (err, res) => {
                if (res.length > 0) {
                    for (let i = 0; i < res.length; i++) {
                        ordersArray.push({
                            orderId: res[i].orderId,
                            // bookingDate: res[i].bookingDate,
                            bookingDate: res[i].timeStamp.created ? res[i].timeStamp.created.timeStamp : "",
                            pickupLong: res[i].pickup ? res[i].pickup.location.longitude : 0,
                            pickupLat: res[i].pickup ? res[i].pickup.location.latitude : 0,
                            dropLat: res[i].drop ? res[i].drop.location.latitude : 0,
                            dropLong: res[i].drop ? res[i].drop.location.longitude : 0,
                            pickAddress: res[i].pickup.addressLine1 + ' ' + res[i].pickup.addressLine2,
                            dropAddress: res[i].drop ? res[i].drop.addressLine1 + ' ' + res[i].drop.addressLine2 : '',
                            statusMessage: status.bookingStatus(res[i].status, res[i].isCominigFromStore, res[i].storeType),
                            statusCode: res[i].status,
                            storeId: res[i].storeId,
                            storeName: res[i].storeName,
                            currencySymbol: res[i].currencySymbol,
                            currency: res[i].currency,
                            storeAddress: res[i].storeAddress,
                            totalAmount: res[i].totalAmount,
                            items: res[i].Items,
                            serviceType: res[i].serviceType,
                            bookingType: res[i].bookingType,
                            dueDatetime: res[i].dueDatetimeTimeStamp,
                            timeStamp: res[i].timeStamp.created.timeStamp,
                            driverId: res[i].driverDetails ? res[i].driverDetails.driverId : "",
                            driverName: res[i].driverDetails ? res[i].driverDetails.lName ? res[i].driverDetails.fName + res[i].driverDetails.lName : res[i].driverDetails.fName : "",
                            driverMobile: res[i].driverDetails ? res[i].driverDetails.countryCode + res[i].driverDetails.mobile : "",
                            subTotalAmountWithExcTax: res[i].subTotalAmountWithExcTax ? res[i].subTotalAmountWithExcTax : res[i].subTotalAmount,
                            subTotalAmount: res[i].subTotalAmount,
                            deliveryCharge: res[i].deliveryCharge,
                            excTax: res[i].excTax,
                            exclusiveTaxes: res[i].exclusiveTaxes,
                            driverImage: res[i].driverDetails ? res[i].driverDetails.image : "",
                            driverEmail: res[i].driverDetails ? res[i].driverDetails.email : "",
                            paidBy: res[i].paidBy ? res[i].paidBy : {},
                            payByWallet: res[i].payByWallet ? res[i].payByWallet : "",
                            cancellationFee: res[i].accouting ? res[i].accouting.cancelationFee : 0,
                            timeStampObject: res[i].timeStamp
                        });
                    }
                }
                data.ordersArray = ordersArray;
                return err ? reject(err) : resolve(data);
            });
        });
    }

    const readCustomer = () => {
        return new Promise((resolve, reject) => {
            customer.isExistsWithId({ _id: new ObjectId(req.auth.credentials._id) }, (err, doc) => {
                data.profile = {
                    mmjCard: { url: "", verified: false },
                    identityCard: { url: "", verified: false }
                }
                if (doc) {
                    data.profile = {
                        'mmjCard': { url: doc.mmjCard ? doc.mmjCard.url : "", verified: doc.mmjCard ? doc.mmjCard.verified : false },
                        'identityCard': { url: doc.identityCard ? doc.identityCard.url : "", verified: doc.identityCard ? doc.identityCard.verified : false }
                    };
                }
                return resolve(data);
            });


        });
    }
    req.params.status == 2 ? readNewOrder().then(readUnassignOrder).then(readAcceptedOrder).then(readAssignOrder).then(readPickupOrder).then(readCustomer).then(data => {
        if (Object.keys(data.ordersArray).length > 0) {
            function sortNumber(a, b) {
                return b.timeStamp - a.timeStamp;
            }
            data.ordersArray.sort(sortNumber);
            async.each(data.ordersArray, (item, callback) => {
                item.driverLatitude = 0;
                item.driverLongitude = 0;
                if (typeof item.driverId != "" || typeof item.driverId != undefined) {
                    driver.isExistsWithId({ _id: item.driverId ? new ObjectId(item.driverId.toString()) : "" }, (err, doc) => {
                        if (doc) {
                            item.driverLatitude = doc.location ? doc.location.latitude : 0;
                            item.driverLongitude = doc.location ? doc.location.longitude : 0;
                        }
                        callback()
                    });
                } else {
                    callback()
                }
            }, function (err) {
                return reply({ message: req.i18n.__('getProfile')['200'], data: data }).code(200);
            });
        } else {
            return reply({ message: req.i18n.__('getProfile')['404'] }).code(404);
        }
    }) : readCompletedOrder().then(readCustomer).then(data => {
        if (Object.keys(data.ordersArray).length > 0) {
            function sortNumber(a, b) {
                return b.timeStamp - a.timeStamp;
            }
            data.ordersArray.sort(sortNumber);
            return reply({ message: req.i18n.__('getProfile')['200'], data: data }).code(200);
        }
        return reply({ message: req.i18n.__('getProfile')['404'] }).code(404);
    }).catch(e => {
        logger.error('Error occurred get order customer (catch): ' + JSON.stringify(e));
        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
        return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
    });


}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    pageIndex: Joi.number().integer().required().description('page index'),
    status: Joi.number().integer().min(1).max(2).description('status : 1 for past, 2 for new'),
    storeType: Joi.number().integer().min(0).max(10).description('storeType : 1 for Grocery, 2 for restarent, 0 for all order'),
}
/**
* A module that exports guest logins handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator };
