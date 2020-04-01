'use strict'

const orderAnalytics = require('../../models/orderAnalytics');
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const config = process.env;

//updating order analytics
const orderAnalytic = (data) => {

    orderCampaign(data);

    promocodeClaim(data);

    orderAnalytics.get({ userId: data.customerDetails.customerId }, (err, analyticObj) => {

        if (analyticObj) {

            orderAnalytics.update({
                q: { userId: data.customerDetails.customerId },
                param: {
                    $set: {
                        totalNumberOfBooking: analyticObj.totalNumberOfBooking + 1,
                        totalBusinessAmount: analyticObj.totalBusinessAmount + data.totalAmount
                    },
                    $push: {
                        bookings: {
                            bookingId: data.orderId,
                            storeId: data.storeId,
                            serviceType: data.serviceType,
                            amount: data.totalAmount,
                            timestamp: moment().unix(),
                            isoDate: new Date()
                        }
                    }
                }
            }, (err, updateanalyticObj) => { logger.warn("successfully") })

        } else {

            orderAnalytics.insert({
                userId: data.customerDetails.customerId,
                totalNumberOfBooking: 1,
                totalBusinessAmount: data.totalAmount,
                bookings: [
                    {
                        bookingId: data.orderId,
                        storeId: data.storeId,
                        serviceType: data.serviceType,
                        amount: data.totalAmount,
                        timestamp: moment().unix(),
                        isoDate: new Date()
                    }
                ]
            }, (err, analyticObj) => { logger.warn("successfully") })
        }
    })
}

function orderCampaign(data) {
    var request = require("request");
    var options = {
        method: 'POST',
        url: config.API_URL + '/request',
        headers:
        {
            'cache-control': 'no-cache',
            'content-type': 'application/json'
        },
        body:
        {
            "bookingId": String(data.orderId),
            "userId": data.customerDetails.customerId,
            "customerName": data.customerDetails.name,
            "cityId": (typeof data.cityId == "undefined" || data.cityId == null) ? "59fc839ee0dc3f15e91273a5" : data.cityId,
            "zoneId": "",
            "paymentMethod": data.paymentType,
            "paymentMethodString": (data.paymentType == 2) ? "Cash" : "Card",
            "bookingTime": data.bookingDate,
            "deliveryFee": parseFloat(data.deliveryCharge),
            "cartValue": parseFloat(data.subTotalAmount),
            "currency": data.currency,
            "email": data.customerDetails.email,
            "cartId": data.cartId
        },
        json: true
    };


    request(options, function (error, response, body) {

    });

}

//promocode claim when ever completing order.
function promocodeClaim(data) {
    if (data.claimDetails) {
        var request = require("request");
        var options = {
            method: 'POST',
            url: config.API_URL + '/claimPromoCode',
            headers:
            {
                'cache-control': 'no-cache',
                'content-type': 'application/json'
            },
            body:
            {
                "claimId": data.claimDetails.claimId,
                "bookingId": data.orderId
            },
            json: true
        };

        request(options, function (error, response, body) {

        });
    }
}

//unlock promo code when ever cancel / reject order.
const unlockPromoCode = (data) => {
    // if (data.claimDetails) {
    //     var request = require("request");
    //     var options = {
    //         method: 'POST',
    //         url: 'https://api.qoot.shop/unlockPromoCode',
    //         headers:
    //         {
    //             'cache-control': 'no-cache',
    //             'content-type': 'application/json'
    //         },
    //         body:
    //         {
    //             "claimId": data.claimDetails.claimId,
    //         },
    //         json: true
    //     };

    //     request(options, function (error, response, body) {

    //     });
    // }
}


module.exports = {
    orderAnalytic,
    unlockPromoCode
};