const newOrders = require('../../../../../../models/order');
const unassignOrders = require('../../../../../../models/unassignOrders');
const assignOrders = require('../../../../../../models/assignOrders');
const completedOrders = require('../../../../../../models/completedOrders');
const pickupOrders = require('../../../../../../models/pickupOrders');
const mobileDevices = require('../../../../../../models/mobileDevices');
const Auth = require('../../../../../middleware/authentication');
const error = require('../../../../../../statusMessages/responseMessage');  // response messages based on language 
const status = require('../../../../../../statusMessages/statusMessages');
const moment = require('moment');//date-time
const config = process.env;
var Joi = require('joi');
const logger = require('winston');
/** 
* @function
* @name handler
* @param {string} status -  0 - Active , 1 - Banned , 2 - Unverfied.
* @return {object} Reply to the user.
*/

const handler = (req, reply) => {
    //  req.headers.language = 'en';
    let orderDetails = {};
    const readNewOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            newOrders.isExistsWithOrderId({ orderId: req.params.orderId, orderType: 3 }, (err, res) => {
                orderDetails = res ? res : orderDetails;
                return err ? reject(err) : resolve(orderDetails);
            });
        });
    }
    const readPickedupOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            pickupOrders.isExistsWithOrderId({ orderId: req.params.orderId, orderType: 3 }, (err, res) => {
                orderDetails = res ? res : orderDetails;
                return err ? reject(err) : resolve(orderDetails);
            });
        });
    }
    const readUnassignOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            unassignOrders.isExistsWithOrderId({ orderId: req.params.orderId, orderType: 3 }, (err, res) => {
                orderDetails = res ? res : orderDetails;
                return err ? reject(err) : resolve(orderDetails);
            });
        });
    }
    const readAssignOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            assignOrders.isExistsWithOrderId({ orderId: req.params.orderId, orderType: 3 }, (err, res) => {
                orderDetails = res ? res : orderDetails;
                return err ? reject(err) : resolve(orderDetails);
            });
        });
    }
    const readCompletedOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            completedOrders.isExistsWithOrderId({ orderId: req.params.orderId, orderType: 3 }, (err, res) => {
                orderDetails = res ? res : orderDetails;
                return err ? reject(err) : resolve(orderDetails);
            });
        });

    }
    readNewOrder().then(readUnassignOrder).then(readAssignOrder).then(readCompletedOrder).then(readPickedupOrder).then(data => {

        if (Object.keys(data).length > 0) {
            // let booking = {
            //     orderId: data.orderId,
            //     // bookingDate: data.bookingDate,
            //     bookingDate: data.timeStamp.created ? moment.unix(data.timeStamp.created.timeStamp).format("YYYY-MM-DD HH:mm:ss").toString() : "",
            //     // pickupLong: data.pickup ? data.pickup.location.longitude : 0,
            //     // pickupLat: data.pickup ? data.pickup.location.latitude : 0,
            //     dropLat: data.drop ? data.drop.location.latitude : 0,
            //     dropLong: data.drop ? data.drop.location.longitude : 0,
            //     // pickAddress: data.pickup.addressLine1 + ' ' + data.pickup.addressLine2,
            //     dropAddress: data.drop?data.drop.addressLine1 + ' ' + data.drop.addressLine2:'',
            //     statusMsg: status.bookingStatus(data.status),
            //     pickup: data.pickup ? data.pickup : "",
            //     status: data.status,
            //     storeName: data.storeName,

            //     storeAddress: data.storeAddress,
            //     totalAmount: data.totalAmount,
            //     //items: data.Items,
            //     serviceType: data.serviceType,
            //     bookingType: data.bookingType,
            //     dueDatetime: data.dueDatetime,
            //     timeStamp: data.timeStamp,

            //     subTotalAmountWithExcTax: data.subTotalAmountWithExcTax ? data.subTotalAmountWithExcTax : data.subTotalAmount,
            //     subTotalAmount: data.subTotalAmount,
            //     deliveryCharge: data.deliveryCharge,
            //     excTax: data.excTax,
            //     exclusiveTaxes: data.exclusiveTaxes,
            //     driverId: data.driverDetails ? data.driverDetails.driverId : "",
            //     driverName: data.driverDetails ? data.driverDetails.lName ? data.driverDetails.fName + data.driverDetails.lName : data.driverDetails.fName : "",
            //     driverMobile: data.driverDetails ? data.driverDetails.countryCode + data.driverDetails.mobile : "",
            //     driverImage: data.driverDetails ? data.driverDetails.image : "",
            //     driverEmail: data.driverDetails ? data.driverDetails.email : "",
            //     activityLogs: data.activityLogs ? data.activityLogs : [],
            //     bookingDateTimeStamp: data.bookingDateTimeStamp,
            //     dueDatetimeTimeStamp: data.dueDatetimeTimeStamp,
            //     storeType: data.storeType,
            //     storeTypeMsg: data.storeTypeMsg,
            //     orderDetails: data.orderDetails,
            //     'customerSignature': data.customerSignature ? data.customerSignature : "",
            //     'cashOnDelivery': data.cashOnDelivery ? data.cashOnDelivery : "",
            //     'eizzyZone': data.eizzyZone ? data.eizzyZone : "",
            //     customerDetails: data.customerDetails ? data.customerDetails : {}
            // }
            //////////////////////////////////////////////////
            // data.driverId = data.driverDetails ? data.driverDetails.driverId : "";
            // data.driverName = data.driverDetails ? data.driverDetails.lName ? data.driverDetails.fName + data.driverDetails.lName : data.driverDetails.fName : "";
            // data.driverMobile = data.driverDetails ? data.driverDetails.countryCode + data.driverDetails.mobile : "";
            // data.driverImage = data.driverDetails ? data.driverDetails.image : "";
            // data.driverEmail = data.driverDetails ? data.driverDetails.email : "";
            ///////////////////////////////////
            let dataToInsert = {
                estimateId: data.estimateId,
                storeId: data.storeId,
                storeCoordinates: data.storeCoordinates,
                cartTotal: data.cartTotal,
                cartDiscount: data.cartDiscount,
                storeLogo: data.storeLogo,
                storeName: data.storeName,
                forcedAccept: data.forcedAccept ? data.forcedAccept : 1,
                storeCommission: data.storeCommission ? data.storeCommission : 0,
                storeCommissionType: data.storeCommissionType ? data.storeCommissionType : 0,
                storeType: data.storeType,
                storeTypeMsg: data.storeTypeMsg,
                storeCommissionTypeMsg: data.storeCommissionTypeMsg,
                driverType: data.driverType,
                storeAddress: data.storeAddress,
                subTotalAmountWithExcTax: data.subTotalAmountWithExcTax,
                orderId: data.orderId,
                cartId: data.cartId,
                deliveryCharge: data.deliveryCharge,
                storeFreeDelivery: data.storeFreeDelivery,
                storeDeliveryFee: data.storeDeliveryFee,
                subTotalAmount: data.subTotalAmount,
                excTax: data.excTax,
                exclusiveTaxes: data.exclusiveTaxes,
                orderType: data.orderType,
                orderTypeMsg: data.orderTypeMsg,
                discount: data.discount,
                totalAmount: data.totalAmount,
                orderDetails: data.orderDetails,
                couponCode: data.couponCode,
                paymentType: data.paymentType,
                paymentTypeMsg: data.paymentTypeMsg,
                coinpayTransaction: data.coinpayTransaction,
                customerCoordinates: data.customerCoordinates,
                bookingDate: data.bookingDate,
                bookingDateTimeStamp: data.bookingDateTimeStamp,
                dueDatetime: data.dueDatetime,
                dueDatetimeTimeStamp: data.dueDatetimeTimeStamp,
                city: data.city,
                cityId: data.cityId,
                status: data.status,
                statusMsg: data.statusMsg,
                serviceType: data.serviceType,
                bookingType: data.bookingType,
                pricingModel: data.pricingModel,
                zoneType: data.zoneType, // short zone ride booking
                extraNote: data.extraNote,
                customerDetails: data.customerDetails,
                dispatchSetting: data.dispatchSetting,
                pickup: data.pickup,
                drop: data.drop,
                timeStamp: data.timeStamp,
                activityLogs: data.activityLogs,
                "abbrevation": data.abbrevation,
                "abbrevationText": data.abbrevationText,
                "currency": data.currency,
                "currencySymbol": data.currencySymbol,
                "mileageMetric": data.mileageMetric,
                paidBy: data.paidBy,
                "accouting": data.accouting,
                driverId: data.driverDetails ? data.driverDetails.driverId : "",
                driverName: data.driverDetails ? data.driverDetails.lName ? driverDetails.fName + data.driverDetails.lName : data.driverDetails.fName : "",
                driverMobile: data.driverDetails ? data.driverDetails.countryCode + data.driverDetails.mobile : "",
                driverImage: data.driverDetails ? data.driverDetails.image : "",
                driverEmail: data.driverDetails ? data.driverDetails.email : "",
                'customerSignature': data.customerSignature,
                'cashOnDelivery': data.cashOnDelivery,
                'eizzyZone': data.eizzyZone

            }
            return reply({ message: req.i18n.__('getProfile')['200'], data: dataToInsert }).code(200);
        }
        return reply({ message: req.i18n.__('getProfile')['404'] }).code(404);
    }).catch(e => {
        logger.error('Error occurred place order (catch): ' + JSON.stringify(e));
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
    orderId: Joi.number().required().description('order Id')
}
/**
* A module that exports guest logins handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator };