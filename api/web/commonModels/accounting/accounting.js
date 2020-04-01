'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment-timezone');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const email = require('../email/email');
const config = process.env;
let childProducts = require("../../../models/childProducts");
let storeFirstCategory = require("../../../models/storeFirstCategory");
// const errorMsg = require('../../../locales');
const completedOrders = require('./../../../models/completedOrders');

let calculate = (bookingId) => {
    let orderData = {};
    let appEarningValue = 0;
    let firstCategoryId = 0;
    
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

    let calcMoney = (order)=>{
        
        let promiseArray=[];

        console.log("Calculation Accounting start!!!");

        let calcComm = (item) => {
            let calcPro = () => {
                return new Promise((resolve, reject)=>{ 
                    console.log("Calc Products");
                    console.log('bookingData.storeId',order.storeId);
                childProducts.getOne(
                    {_id:new ObjectID(item.childProductId)},
                    (err, itemData)=>{
                        console.log("childProducts ended");
                        if(err){
                            return reject(dbErrResponse);
                        }else if (itemData){
                            //console.log("ProductInfo",itemData);
                            firstCategoryId = itemData.firstCategoryId;
                            if(itemData.commissionEnable!=undefined){
                                if(itemData.commissionEnable=='1' || itemData.commissionEnable==1){
                                    //console.log("product name", itemData.commissionValue);
                                    console.log("++++++++++++++++++++++");
                                    console.log("product commission value", itemData.commissionValue);
                                    console.log("item quantity", item.quantity);
                                    console.log("item price", item.unitPrice);
                                    appEarningValue = appEarningValue+parseInt(itemData.commissionValue)/100*item.quantity*item.unitPrice;
                                    console.log("appEarningProduct", appEarningValue);
                                    console.log("++++++++++++++++++++");
                                    return resolve( firstCategoryId);
                                }else{
                                    return resolve(0);
                                }     
                                
                            }else{
                                return resolve(0);
                            }
                            
                        }else{
                            return resolve(0);
                        }
                    }
                );
                });
            };
            let calcCat = (value)=>{
                return new Promise((resolve, reject)=>{ 
                    if(value!=0){
                        return resolve(true);
                    }else{
                        console.log("Calc Category",firstCategoryId);
                        
                        storeFirstCategory.SelectOne(
                            {_id: new ObjectID(firstCategoryId)},
                            (err,storeCategoryData)=>{
                                console.log("storeCategory ended");
                                if(err){
                                    return reject(dbErrResponse);
                                }else if (storeCategoryData){
                                    //console.log("CategoryInfo",storeCategoryData);
                                    if(storeCategoryData.commissionEnable!=undefined){
                                        if(storeCategoryData.commissionEnable=='1' || storeCategoryData.commissionEnable==1){
                                            console.log("********************");
                                            console.log("category commission value", storeCategoryData.commissionValue);
                                            console.log("item quantity", item.quantity);
                                            console.log("item price", item.unitPrice);
                                            appEarningValue = appEarningValue+parseInt(storeCategoryData.commissionValue)/100*item.quantity*item.unitPrice;
                                            console.log("appEarningCategory", appEarningValue);
                                            console.log("********************");
                                            return resolve(true);
                                        }else{
                                            return resolve(false);
                                        }     
                                    
                                    }else{
                                        return resolve(false);
                                    }
                                }else{
                                    return resolve(false);
                                }
                            }
                        );
                    }
                });
            };

            return new Promise((resolve, reject)=>{
                console.log("Start Calc Products and Categories");
                calcPro().then(calcCat).then(value=>{
                    console.log("product comm ended");
                    //store
                    if(value==false){
                        console.log("^^^^^^^^^^^^^^^^^");
                        //appEarningValue = appEarningValue+40/100*item.quantity*item.unitPrice;
                        
                        if (order.accouting.storeCommissionType == 0) {
                        // percntage
                            appEarningValue = appEarningValue+parseFloat(order.accouting.storeCommPer)/100*item.quantity*item.unitPrice;
                                    
                        } else {
                                        // fixed
                            appEarningValue = appEarningValue+parseFloat(order.accouting.storeCommPer);
                        }
                        
                        console.log("appEarningStore1", appEarningValue);
                        console.log("^^^^^^^^^^^^^^^^^");
                    }
                    return resolve(value);
                    
                });

            });
        };

        console.log("item count",order.Items.length );
        order.Items.forEach((item)=>{
            console.log("-------------------");
            console.log("booking Items", item);
            console.log("-------------------");
            promiseArray.push(calcComm(item));
            
        });        
        
        return new Promise((resolve, reject)=>{
            
            Promise.all(promiseArray).then(data=>{              
                let cartTotal = order.cartTotal;
                let deliveryCharge = order.deliveryCharge;
                let storeDeliveryFee = (order.storeDeliveryFee || 0);                
                let cartWithoutOfferPrice = order.accouting.cartTotalWithoutOfferPrice;

                console.log("cart total", cartTotal);
                console.log("deliveryCharge",deliveryCharge);
                console.log("storedeliveryfee",storeDeliveryFee);
                console.log("cartwithout",cartWithoutOfferPrice);

                let storeCommission = 0; // store
                let cartCommission = 0; // app
                let storeCommissionValue = 0;
                let cartCommissionValue = 0;
                cartCommissionValue = appEarningValue;
                storeCommissionValue = (cartTotal)-cartCommissionValue;

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
                    let appEarning_l = parseFloat(parseFloat(parseFloat(cartCommissionValue) + parseFloat(deliveryCommissionValue)).toFixed(2));
                    let storeEarning_l = parseFloat(parseFloat(storeCommissionValue).toFixed(2));
                    
                    if (storeCommissionValue > 0)
                            storeEarning_l = parseFloat(parseFloat(storeCommissionValue + taxes - (order.cartDiscount + storeDeliveryFee)).toFixed(2));    
                    console.log("appEarning",appEarning_l);
                    console.log("storeEarning",storeEarning_l);
                    console.log("cartComv",cartCommissionValue);
                    console.log("storecomv",storeCommissionValue);
                    console.log("driverEarning",parseFloat(parseFloat(driverCommissionValue + driverTip).toFixed(2)));
                    console.log("drivercomv",driverCommissionValue);
                    console.log("delCom",deliveryCommissionValue);
                    console.log("gateEarning",paymentGatewayCommission);
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
                            data: updtRes.value
                        });
                });
            });
        });   
        
    };

    return new Promise((resolve, reject) => {
        getOrderData(parseInt(bookingId))
            .then(generateInvoice).then(calcMoney).then(data => {
                return resolve(data);
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

    let calcMoney = (order)=>{
        
        let promiseArray=[];

        console.log("Calculation Cancel Account start!!!");

        let calcComm = (item) => {
            let calcPro = () => {
                return new Promise((resolve, reject)=>{ 
                    console.log("Calc Products");
                    console.log('bookingData.storeId',order.storeId);
                childProducts.getOne(
                    {_id:new ObjectID(item.childProductId)},
                    (err, itemData)=>{
                        console.log("childProducts ended");
                        if(err){
                            return reject(dbErrResponse);
                        }else if (itemData){
                            //console.log("ProductInfo",itemData);
                            firstCategoryId = itemData.firstCategoryId;
                            if(itemData.commissionEnable!=undefined){
                                if(itemData.commissionEnable=='1' || itemData.commissionEnable==1){
                                    //console.log("product name", itemData.commissionValue);
                                    console.log("++++++++++++++++++++++");
                                    console.log("product commission value", itemData.commissionValue);
                                    console.log("item quantity", item.quantity);
                                    console.log("item price", item.unitPrice);
                                    appEarningValue = appEarningValue+parseInt(itemData.commissionValue)/100*item.quantity*item.unitPrice;
                                    console.log("appEarningProduct", appEarningValue);
                                    console.log("++++++++++++++++++++");
                                    return resolve( firstCategoryId);
                                }else{
                                    return resolve(0);
                                }     
                                
                            }else{
                                return resolve(0);
                            }
                            
                        }else{
                            return resolve(0);
                        }
                    }
                );
                });
            };
            let calcCat = (value)=>{
                return new Promise((resolve, reject)=>{ 
                    if(value!=0){
                        return resolve(true);
                    }else{
                        console.log("Calc Category",firstCategoryId);
                        
                        storeFirstCategory.SelectOne(
                            {_id: new ObjectID(firstCategoryId)},
                            (err,storeCategoryData)=>{
                                console.log("storeCategory ended");
                                if(err){
                                    return reject(dbErrResponse);
                                }else if (storeCategoryData){
                                    //console.log("CategoryInfo",storeCategoryData);
                                    if(storeCategoryData.commissionEnable!=undefined){
                                        if(storeCategoryData.commissionEnable=='1' || storeCategoryData.commissionEnable==1){
                                            console.log("********************");
                                            console.log("category commission value", storeCategoryData.commissionValue);
                                            console.log("item quantity", item.quantity);
                                            console.log("item price", item.unitPrice);
                                            appEarningValue = appEarningValue+parseInt(storeCategoryData.commissionValue)/100*item.quantity*item.unitPrice;
                                            console.log("appEarningCategory", appEarningValue);
                                            console.log("********************");
                                            return resolve(true);
                                        }else{
                                            return resolve(false);
                                        }     
                                    
                                    }else{
                                        return resolve(false);
                                    }
                                }else{
                                    return resolve(false);
                                }
                            }
                        );
                    }
                });
            };

            return new Promise((resolve, reject)=>{
                console.log("Start Calc Products and Categories");
                calcPro().then(calcCat).then(value=>{
                    console.log("product comm ended");
                    //store
                    if(value==false){
                        console.log("^^^^^^^^^^^^^^^^^");
                        //appEarningValue = appEarningValue+40/100*item.quantity*item.unitPrice;
                        
                        if (order.accouting.storeCommissionType == 0) {
                        // percntage
                            appEarningValue = appEarningValue+parseFloat(order.accouting.storeCommPer)/100*item.quantity*item.unitPrice;
                                    
                        } else {
                                        // fixed
                            appEarningValue = appEarningValue+parseFloat(order.accouting.storeCommPer);
                        }
                        
                        console.log("appEarningStore1", appEarningValue);
                        console.log("^^^^^^^^^^^^^^^^^");
                    }
                    return resolve(value);
                    
                });

            });
        };

        console.log("item count",order.Items.length );
        order.Items.forEach((item)=>{
            console.log("-------------------");
            console.log("booking Items", item);
            console.log("-------------------");
            promiseArray.push(calcComm(item));
            
        });        
        
        return new Promise((resolve, reject)=>{
            
            Promise.all(promiseArray).then(data=>{              
                
                let storeDeliveryFee = (order.storeDeliveryFee || 0);                
                let cartTotal = order.cancCartTotal;
                let deliveryCharge = order.cancDeliveryFee;

                let storeCommission = 0; // store
                let cartCommission = 0; // app
                let storeCommissionValue = 0;
                let cartCommissionValue = 0;
                cartCommissionValue = appEarningValue;
                storeCommissionValue = (cartTotal)-cartCommissionValue;

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
                            data: updtRes.value
                        });
                });
            });
        });   
        
    };
    
    return new Promise((resolve, reject) => {
        getOrderData(parseInt(bookingId))
            
            .then(calcMoney).then(order => {
                return resolve(order);
                
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