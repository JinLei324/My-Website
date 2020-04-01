'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment-timezone');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const email = require('../email/email');
const config = process.env;

// const errorMsg = require('../../../locales');
const completedOrders = require('./../../../models/completedOrders');

let calculate = (bookingId) => {
    let orderData = {};
    /** get order data using order id */
    let getOrderData = (orderId) => {
        return new Promise((resolve, reject) => {
            completedOrders.getOrderById(orderId, (err, result) => {
                if (err) reject(err);
                else if (result) {
                    orderData = result,
                        resolve(result);
                }
                else {
                    reject({ message: "order not found" });
                }
            })
        })
    }
    /** generateInvoice using order id */
    let generateInvoice = (orderId) => {
        return new Promise((resolve, reject) => {
            let itms = orderData.Items ? orderData.Items : [];
            var dynamicItemsPdf = [];

            for (let j = 0; j < itms.length; j++) {
                dynamicItemsPdf.push('<tr><td><h6 class="textTransformCpCls" style="text-transform: capitalize; font-weight: 500;margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' + itms[j].itemName + '</h6></td><td><h6 class="textTransformCpCls" style="text-transform: capitalize; font-weight: 500;margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' + itms[j].unitName + '</h6></td><td><h6 class="textTransformCpCls" style="margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;"> <span class="" style="">' + orderData.currencySymbol + '</span> ' + String(itms[j].unitPrice) + '</h6></td><td><h6 class="textTransformCpCls" style="text-align: center;margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' + String(itms[j].quantity) + '</h6></td><td><h6 class="textTransformCpCls" style="margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' + String(itms[j].appliedDiscount) + '</h6></td><td><h6 class="textTransformCpCls" style="margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;"> <span class="" style="">' + orderData.currencySymbol + '</span> ' + String(itms[j].finalPrice) + '</h6></td></tr>');
            }
            email.generatePdfInvoice({
                attachment: true,
                orderId: String(orderData.orderId),
                templateName: 'invoicePdfTemplateOriginal.html',
                toEmail: orderData.customerDetails.email,
                trigger: 'Order placed',
                subject: 'Order placed successfully.',
                qrCodeImage: orderData.qrCode,
                keysToReplace: {
                    userName: orderData.customerDetails.name || '',
                    dropName: orderData.customerDetails.name || '',
                    dropPhone: orderData.customerDetails.mobile || '',
                    appName: config.appName,
                    orderPlacedDate: moment(moment.unix(orderData.bookingDateTimeStamp)).tz(orderData.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                    addressLine1: orderData.drop ? orderData.drop.addressLine1 : '',
                    dropAddressLine1: orderData.drop ? orderData.drop.addressLine1 : '',
                    dropAddressLine2: orderData.drop ? orderData.drop.addressLine2 : '',
                    addressLine2: orderData.drop ? orderData.drop.addressLine2 : "",
                    country: orderData.drop ? orderData.drop.country : "",
                    orderCreationDate: moment(moment.unix(orderData.bookingDateTimeStamp)).tz(orderData.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                    itemsCount: String(orderData.Items.length),
                    subTotalAmount: orderData.currencySymbol + '' + orderData.subTotalAmount,
                    subTotal: String(orderData.subTotalAmount),
                    dropCity: orderData.drop ? orderData.drop.city : "",
                    dropState: orderData.state ? orderData.drop.state : "",
                    orderDate: moment(orderData.bookingDate).format("MMM D YYYY HH:mm"),
                    storeName: orderData.storeName ? orderData.storeName : "",
                    deliveryCharge: orderData.currencySymbol + '' + orderData.deliveryCharge,
                    delivery: String(orderData.deliveryCharge),
                    discount: String(orderData.discount),
                    tax: orderData.currencySymbol + '' + orderData.excTax ? orderData.excTax : 0,
                    taxes: orderData.excTax ? String(orderData.excTax) : String(0),
                    totalAmount: orderData.currencySymbol + '' + String(orderData.totalAmount),
                    total: String(orderData.totalAmount),
                    pendingAmount: (orderData.paymentType === 2) ? orderData.currencySymbol + '' + orderData.totalAmount : orderData.currencySymbol + '' + 0,
                    orderId: String(orderData.orderId),
                    shipdate: moment(moment.unix(orderData.dueDatetimeTimeStamp)).tz(orderData.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                    storeName: orderData.storeName,
                    webUrl: orderData.webUrl,
                    dynamicItems: dynamicItemsPdf,
                    currencySymbol: orderData.currencySymbol,
                    paymentTypeMsg: orderData.paymentTypeMsg,
                    serviceType: (orderData.serviceType == 1) ? 'Delivery' : 'Pickup'
                }
            }, () => {
                return resolve(orderData);
            });
        })
    }
    return new Promise((resolve, reject) => {
        getOrderData(parseInt(bookingId))
            .then(generateInvoice).then((order) => {

                let cartTotal = order.cartTotal;
                let deliveryCharge = order.deliveryCharge;

                let storeDeliveryFee = (order.storeDeliveryFee || 0);

                // let storeCommission = (order.accouting.storeCommPer) / 100; // store
                // let cartCommission = 1 - (order.accouting.storeCommPer) / 100; // app

                let storeCommission = 0; // store
                let cartCommission = 0; // app
                let storeCommissionValue = 0;
                let cartCommissionValue = 0;
                if (order.accouting.storeCommissionType == 1) {
                    storeCommission = 0; // store
                    cartCommission = 0; // app
                    storeCommissionValue = parseFloat(parseFloat(cartTotal) - parseFloat(order.accouting.storeCommPer));
                    cartCommissionValue = parseFloat(order.accouting.storeCommPer);

                } else {
                    storeCommission = 1 - (parseFloat(order.accouting.storeCommPer)) / 100; // store
                    cartCommission = parseFloat(order.accouting.storeCommPer) / 100; // app

                    storeCommissionValue = parseFloat(cartTotal * storeCommission);
                    cartCommissionValue = parseFloat(cartTotal * cartCommission);
                }


                let driverCommission = 0; // store
                let deliveryCommission = 0; // app
                if (order.accouting.driverCommType == 1) {
                    driverCommission = 0; // store
                    deliveryCommission = 0; // app
                } else {
                    driverCommission = 1 - (parseFloat(order.accouting.driverCommPer)) / 100; // driver
                    deliveryCommission = parseFloat(order.accouting.driverCommPer) / 100; // app
                }


                let taxes = parseFloat(order.accouting.taxes || 0);



                let driverCommissionValue = 0,
                    deliveryCommissionValue = 0,
                    paymentGatewayCommission = 0,
                    driverTip = 0;

                switch (order.serviceType) {
                    case 1:
                        /** delivery */
                        if (order.driverDetails && order.driverDetails.driverType == 2) {
                            /** store driver not need of driver commission */
                            driverCommissionValue = 0;
                            deliveryCommissionValue = 0;
                            // storeDeliveryFee = 0;
                            if (order.accouting.driverCommType == 1) {
                                if (storeDeliveryFee) {
                                    /** store pays for the delivery charge */
                                    deliveryCommissionValue = parseFloat(order.accouting.storeCommPer); //app
                                } else {
                                    /** customer pays for the delivery charge */
                                    storeCommissionValue += parseFloat(deliveryCharge - parseFloat(order.accouting.storeCommPer)); //store
                                    deliveryCommissionValue = parseFloat(order.accouting.storeCommPer); //app
                                }
                            } else {
                                if (storeDeliveryFee) {
                                    /** store pays for the delivery charge */
                                    deliveryCommissionValue = parseFloat(storeDeliveryFee * cartCommission); //app
                                } else {
                                    /** customer pays for the delivery charge */
                                    storeCommissionValue += parseFloat(deliveryCharge * storeCommission); //store
                                    deliveryCommissionValue = parseFloat(deliveryCharge * cartCommission); //app
                                }
                            }

                        } else {
                            if (order.accouting.driverCommType == 1) {
                                if (storeDeliveryFee) {
                                    /** store pays for the delivery charge */

                                    driverCommissionValue = parseFloat(storeDeliveryFee - parseFloat(order.accouting.driverCommPer)); //driver
                                    deliveryCommissionValue = parseFloat(order.accouting.driverCommPer); //app
                                } else {
                                    /** customer pays for the delivery charge */
                                    driverCommissionValue = parseFloat(parseFloat(deliveryCharge) - parseFloat(order.accouting.driverCommPer)); //driver
                                    deliveryCommissionValue = parseFloat(order.accouting.driverCommPer); //app
                                }
                            } else {
                                if (storeDeliveryFee) {
                                    /** store pays for the delivery charge */
                                    driverCommissionValue = parseFloat(storeDeliveryFee * driverCommission); //driver
                                    deliveryCommissionValue = parseFloat(storeDeliveryFee * deliveryCommission); //app
                                } else {
                                    /** customer pays for the delivery charge */
                                    driverCommissionValue = parseFloat(deliveryCharge * driverCommission); //driver
                                    deliveryCommissionValue = parseFloat(deliveryCharge * deliveryCommission); //app
                                }
                            }
                        }

                        driverTip = parseFloat(order.accouting.driverTip || 0);

                        break;

                    case 2:
                        /** pickup */
                        break;
                }

                switch (order.paymentType) {
                    case 1:
                        /** card */
                        /** calculate the Payment Gateway Commission as well */
                        if (order.paidBy.card > 0)
                            paymentGatewayCommission = parseFloat(((order.paidBy.card || 0) * 0.029) + 0.3);
                        break;
                    case 3:
                        paymentGatewayCommission = parseFloat(0.45);
                        break;
                }

                let appEarning_l = 0;
                let storeEarning_l = 0;
                appEarning_l = parseFloat(parseFloat((order.totalAmount + storeDeliveryFee + order.cartDiscount - driverCommissionValue - storeCommissionValue - order.discount - paymentGatewayCommission - taxes)).toFixed(2));
                storeEarning_l = parseFloat(parseFloat((storeCommissionValue + taxes) - (order.cartDiscount + storeDeliveryFee).toFixed(2)));

                completedOrders.updateOrder({
                    condition: { "orderId": parseInt(bookingId) },
                    set: {
                        "accouting.storeCommissionValue": parseFloat(parseFloat(storeCommissionValue).toFixed(2)),
                        "accouting.cartCommissionValue": parseFloat(parseFloat(cartCommissionValue).toFixed(2)),
                        "accouting.appEarningValue": appEarning_l,
                        "accouting.storeEarningValue": storeEarning_l,
                        "accouting.driverEarningValue": parseFloat(parseFloat(driverCommissionValue + driverTip).toFixed(2)),
                        "accouting.driverCommissionValue": parseFloat(parseFloat(driverCommissionValue).toFixed(2)),
                        "accouting.deliveryCommissionValue": parseFloat(parseFloat(deliveryCommissionValue).toFixed(2)),
                        "accouting.appDiscountValue": parseFloat(parseFloat(order.discount).toFixed(2)),
                        "accouting.storeDiscountValue": parseFloat(parseFloat(order.cartDiscount).toFixed(2)),
                        "accouting.storeDeliveryFee": parseFloat(parseFloat(storeDeliveryFee).toFixed(2)),
                        "accouting.pgEarningValue": paymentGatewayCommission
                    }
                }, function (err, updtRes) {

                    if (err) return reject(err);
                    else
                        return resolve({
                            message: "wallet information updated",
                            //  data: {
                            //     appEarning: {
                            //         storeCommission: storeCommissionValue,
                            //         driverCommission: driverCommissionValue,
                            //         discount: Number(Math.round((order.discount) + 'e2') + 'e-2'),
                            //         paymentGatewayCommission: paymentGatewayCommission,
                            //         total: Number(Math.round(((storeCommissionValue + driverCommissionValue) - (order.discount + paymentGatewayCommission)) + 'e2') + 'e-2')
                            //     },
                            //     storeEarning: {
                            //         cartCommission: cartCommissionValue,
                            //         freeDeliveryCharge: 0,
                            //         taxes: taxes,
                            //         total: Number(Math.round((cartCommissionValue + taxes) + 'e2') + 'e-2')
                            //     },
                            //     driverEarning: {
                            //         deliveryCommission: deliveryCommissionValue,
                            //         tip: driverTip,
                            //         total: deliveryCommissionValue + driverTip
                            //     },
                            //     paymentGatewayEarning: {
                            //         paymentGatewayCommission: paymentGatewayCommission
                            //     },
                            //     calculated: {
                            //         cartTotal: cartTotal,
                            //         storeCommission: storeCommission,
                            //         cartCommission: cartCommission,
                            //         driverCommission: driverCommission,
                            //         deliveryCommission: deliveryCommission
                            //     },
                            //     db: order
                            // }
                            data: updtRes.value
                        });
                });
                /**
                 * appEarningValue
                 * driverEarningValue
                 * storeEarningValue
                 * pgEarningValue
                 */
            }).catch((err) => {
                logger.error(err.message);
                return reject({ message: err.message });
            });
    });



}

let cancellation = (bookingId) => {
    let orderData = {};
    /** get order data using order id */
    let getOrderData = (orderId) => {
        return new Promise((resolve, reject) => {
            completedOrders.getOrderById(orderId, (err, result) => {
                if (err) reject(err);
                else if (result) {
                    orderData = result,
                        resolve(result);
                }
                else {
                    reject({ message: "order not found" });
                }
            })
        })
    }
    /** generateInvoice using order id */
    let generateInvoice = (orderId) => {
        return new Promise((resolve, reject) => {
            let itms = orderData.Items ? orderData.Items : [];
            var dynamicItemsPdf = [];

            for (let j = 0; j < itms.length; j++) {
                dynamicItemsPdf.push('<tr><td><h6 class="textTransformCpCls" style="text-transform: capitalize; font-weight: 500;margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' + itms[j].itemName + '</h6></td><td><h6 class="textTransformCpCls" style="text-transform: capitalize; font-weight: 500;margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' + itms[j].unitName + '</h6></td><td><h6 class="textTransformCpCls" style="margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;"> <span class="" style="">' + orderData.currencySymbol + '</span> ' + String(itms[j].unitPrice) + '</h6></td><td><h6 class="textTransformCpCls" style="text-align: center;margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' + String(itms[j].quantity) + '</h6></td><td><h6 class="textTransformCpCls" style="margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' + String(itms[j].appliedDiscount) + '</h6></td><td><h6 class="textTransformCpCls" style="margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;"> <span class="" style="">' + orderData.currencySymbol + '</span> ' + String(itms[j].finalPrice) + '</h6></td></tr>');
            }
            email.generatePdfInvoice({
                attachment: true,
                orderId: String(orderData.orderId),
                templateName: 'invoicePdfTemplateOriginal.html',
                toEmail: orderData.customerDetails.email,
                trigger: 'Order placed',
                subject: 'Order placed successfully.',
                qrCodeImage: orderData.qrCode,
                keysToReplace: {
                    userName: orderData.customerDetails.name || '',
                    dropName: orderData.customerDetails.name || '',
                    dropPhone: orderData.customerDetails.mobile || '',
                    appName: config.appName,
                    orderPlacedDate: moment(moment.unix(orderData.bookingDateTimeStamp)).tz(orderData.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                    addressLine1: orderData.drop ? orderData.drop.addressLine1 : '',
                    dropAddressLine1: orderData.drop ? orderData.drop.addressLine1 : '',
                    dropAddressLine2: orderData.drop ? orderData.drop.addressLine2 : '',
                    addressLine2: orderData.drop ? orderData.drop.addressLine2 : "",
                    country: orderData.drop ? orderData.drop.country : "",
                    orderCreationDate: moment(moment.unix(orderData.bookingDateTimeStamp)).tz(orderData.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                    itemsCount: String(orderData.Items.length),
                    subTotalAmount: orderData.currencySymbol + '' + orderData.subTotalAmount,
                    subTotal: String(orderData.subTotalAmount),
                    dropCity: orderData.drop ? orderData.drop.city : "",
                    dropState: orderData.state ? orderData.drop.state : "",
                    orderDate: moment(orderData.bookingDate).format("MMM D YYYY HH:mm"),
                    storeName: orderData.storeName ? orderData.storeName : "",
                    deliveryCharge: orderData.currencySymbol + '' + orderData.deliveryCharge,
                    delivery: String(orderData.deliveryCharge),
                    discount: String(orderData.discount),
                    tax: orderData.currencySymbol + '' + orderData.excTax ? orderData.excTax : 0,
                    taxes: orderData.excTax ? String(orderData.excTax) : String(0),
                    totalAmount: orderData.currencySymbol + '' + String(orderData.totalAmount),
                    total: String(orderData.totalAmount),
                    pendingAmount: (orderData.paymentType === 2) ? orderData.currencySymbol + '' + orderData.totalAmount : orderData.currencySymbol + '' + 0,
                    orderId: String(orderData.orderId),
                    shipdate: moment(moment.unix(orderData.dueDatetimeTimeStamp)).tz(orderData.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                    storeName: orderData.storeName,
                    webUrl: orderData.webUrl,
                    dynamicItems: dynamicItemsPdf,
                    currencySymbol: orderData.currencySymbol,
                    paymentTypeMsg: orderData.paymentTypeMsg,
                    serviceType: (orderData.serviceType == 1) ? 'Delivery' : 'Pickup'
                }
            }, () => {
                return resolve(orderData);
            });
        })
    }
    return new Promise((resolve, reject) => {
        getOrderData(parseInt(bookingId))
            // .then(generateInvoice)
            .then((order) => {

                let cartTotal = order.cancCartTotal;
                let deliveryCharge = order.cancDeliveryFee;

                let storeDeliveryFee = (order.storeDeliveryFee || 0);

                // let storeCommission = (order.accouting.storeCommPer) / 100; // store
                // let cartCommission = 1 - (order.accouting.storeCommPer) / 100; // app

                let storeCommission = 0; // store
                let cartCommission = 0; // app
                let storeCommissionValue = 0;
                let cartCommissionValue = 0;
                if (order.accouting.storeCommissionType == 1) {
                    storeCommission = 0; // store
                    cartCommission = 0; // app
                    storeCommissionValue = parseFloat(parseFloat(cartTotal) - parseFloat(order.accouting.storeCommPer));
                    cartCommissionValue = parseFloat(order.accouting.storeCommPer);

                } else {
                    storeCommission = 1 - (parseFloat(order.accouting.storeCommPer)) / 100; // store
                    cartCommission = parseFloat(order.accouting.storeCommPer) / 100; // app

                    storeCommissionValue = parseFloat(cartTotal * storeCommission);
                    cartCommissionValue = parseFloat(cartTotal * cartCommission);
                }


                let driverCommission = 0; // store
                let deliveryCommission = 0; // app
                if (order.accouting.driverCommType == 1) {
                    driverCommission = 0; // store
                    deliveryCommission = 0; // app
                } else {
                    driverCommission = 1 - (parseFloat(order.accouting.driverCommPer)) / 100; // driver
                    deliveryCommission = parseFloat(order.accouting.driverCommPer) / 100; // app
                }


                let taxes = parseFloat(order.accouting.taxes || 0);



                let driverCommissionValue = 0,
                    deliveryCommissionValue = 0,
                    paymentGatewayCommission = 0,
                    driverTip = 0;

                switch (order.serviceType) {
                    case 1:
                        /** delivery */
                        if (order.driverDetails && order.driverDetails.driverType == 2) {
                            /** store driver not need of driver commission */
                            driverCommissionValue = 0;
                            deliveryCommissionValue = 0;
                            // storeDeliveryFee = 0;
                            if (order.accouting.driverCommType == 1) {
                                if (storeDeliveryFee) {
                                    /** store pays for the delivery charge */
                                    deliveryCommissionValue = parseFloat(order.accouting.storeCommPer); //app
                                } else {
                                    /** customer pays for the delivery charge */
                                    storeCommissionValue += parseFloat(deliveryCharge - parseFloat(order.accouting.storeCommPer)); //store
                                    deliveryCommissionValue = parseFloat(order.accouting.storeCommPer); //app
                                }
                            } else {
                                if (storeDeliveryFee) {
                                    /** store pays for the delivery charge */
                                    deliveryCommissionValue = parseFloat(storeDeliveryFee * cartCommission); //app
                                } else {
                                    /** customer pays for the delivery charge */
                                    storeCommissionValue += parseFloat(deliveryCharge * storeCommission); //store
                                    deliveryCommissionValue = parseFloat(deliveryCharge * cartCommission); //app
                                }
                            }

                        } else {
                            if (order.accouting.driverCommType == 1) {
                                if (storeDeliveryFee) {
                                    /** store pays for the delivery charge */

                                    driverCommissionValue = parseFloat(storeDeliveryFee - parseFloat(order.accouting.driverCommPer)); //driver
                                    deliveryCommissionValue = parseFloat(order.accouting.driverCommPer); //app
                                } else {
                                    /** customer pays for the delivery charge */
                                    driverCommissionValue = parseFloat(parseFloat(deliveryCharge) - parseFloat(order.accouting.driverCommPer)); //driver
                                    deliveryCommissionValue = parseFloat(order.accouting.driverCommPer); //app
                                }
                            } else {
                                if (storeDeliveryFee) {
                                    /** store pays for the delivery charge */
                                    driverCommissionValue = parseFloat(storeDeliveryFee * driverCommission); //driver
                                    deliveryCommissionValue = parseFloat(storeDeliveryFee * deliveryCommission); //app
                                } else {
                                    /** customer pays for the delivery charge */
                                    driverCommissionValue = parseFloat(deliveryCharge * driverCommission); //driver
                                    deliveryCommissionValue = parseFloat(deliveryCharge * deliveryCommission); //app
                                }
                            }
                        }

                        driverTip = parseFloat(order.accouting.driverTip || 0);

                        break;

                    case 2:
                        /** pickup */
                        break;
                }

                switch (order.paymentType) {
                    case 1:
                        /** card */
                        /** calculate the Payment Gateway Commission as well */
                        if (order.paidBy.card > 0)
                            paymentGatewayCommission = parseFloat(((order.paidBy.card || 0) * 0.029) + 0.3);
                        break;
                    case 3:
                        paymentGatewayCommission = parseFloat(0.45);
                        break;
                }

                // let appEarning_l = parseFloat(parseFloat((order.totalAmount + storeDeliveryFee - driverCommissionValue - storeCommissionValue - order.discount - paymentGatewayCommission - taxes)).toFixed(2));
                // let storeEarning_l = parseFloat(parseFloat((storeCommissionValue + taxes) - (order.cartDiscount + storeDeliveryFee).toFixed(2)));

                let appEarning_l = parseFloat(parseFloat(parseFloat(cartCommissionValue) + parseFloat(deliveryCommissionValue)).toFixed(2));
                let storeEarning_l = parseFloat(parseFloat(storeCommissionValue).toFixed(2));
                if (storeCommissionValue > 0)
                    storeEarning_l = parseFloat(parseFloat(storeCommissionValue + taxes - (order.cartDiscount + storeDeliveryFee)).toFixed(2));

                completedOrders.updateOrder({
                    condition: { "orderId": parseInt(bookingId) },
                    set: {
                        "accouting.storeCommissionValue": parseFloat(parseFloat(storeCommissionValue).toFixed(2)),
                        "accouting.cartCommissionValue": parseFloat(parseFloat(cartCommissionValue).toFixed(2)),
                        "accouting.appEarningValue": appEarning_l,
                        "accouting.storeEarningValue": storeEarning_l,
                        "accouting.driverEarningValue": parseFloat(parseFloat(driverCommissionValue + driverTip).toFixed(2)),
                        "accouting.driverCommissionValue": parseFloat(parseFloat(driverCommissionValue).toFixed(2)),
                        "accouting.deliveryCommissionValue": parseFloat(parseFloat(deliveryCommissionValue).toFixed(2)),
                        "accouting.appDiscountValue": parseFloat(parseFloat(order.discount).toFixed(2)),
                        "accouting.storeDiscountValue": parseFloat(parseFloat(order.cartDiscount).toFixed(2)),
                        "accouting.storeDeliveryFee": parseFloat(parseFloat(storeDeliveryFee).toFixed(2)),
                        "accouting.pgEarningValue": paymentGatewayCommission
                    }
                }, function (err, updtRes) {

                    if (err) return reject(err);
                    else
                        return resolve({
                            message: "wallet information updated",
                            //  data: {
                            //     appEarning: {
                            //         storeCommission: storeCommissionValue,
                            //         driverCommission: driverCommissionValue,
                            //         discount: Number(Math.round((order.discount) + 'e2') + 'e-2'),
                            //         paymentGatewayCommission: paymentGatewayCommission,
                            //         total: Number(Math.round(((storeCommissionValue + driverCommissionValue) - (order.discount + paymentGatewayCommission)) + 'e2') + 'e-2')
                            //     },
                            //     storeEarning: {
                            //         cartCommission: cartCommissionValue,
                            //         freeDeliveryCharge: 0,
                            //         taxes: taxes,
                            //         total: Number(Math.round((cartCommissionValue + taxes) + 'e2') + 'e-2')
                            //     },
                            //     driverEarning: {
                            //         deliveryCommission: deliveryCommissionValue,
                            //         tip: driverTip,
                            //         total: deliveryCommissionValue + driverTip
                            //     },
                            //     paymentGatewayEarning: {
                            //         paymentGatewayCommission: paymentGatewayCommission
                            //     },
                            //     calculated: {
                            //         cartTotal: cartTotal,
                            //         storeCommission: storeCommission,
                            //         cartCommission: cartCommission,
                            //         driverCommission: driverCommission,
                            //         deliveryCommission: deliveryCommission
                            //     },
                            //     db: order
                            // }
                            data: updtRes.value
                        });
                });
                /**
                 * appEarningValue
                 * driverEarningValue
                 * storeEarningValue
                 * pgEarningValue
                 */
            }).catch((err) => {
                logger.error(err.message);
                return reject({ message: err.message });
            });
    });



}


module.exports = {
    calculate,
    cancellation
};