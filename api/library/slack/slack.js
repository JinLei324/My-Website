'use strict';
const joi = require('joi')
// const moment = require('moment');//date-time
var moment = require("moment-timezone");
const logger = require('winston');
const config = require('../../config/components/slack')

const request = require("request");
function sendSlackMessage(params, callback) {
    params.deliveryTypeText = "Normal";
    params.startDateTimestamp = 1563689137;
    params.endDateTimestamp = 1563689137;

    let data = "OderId *#" + params.orderId + "*\n" +
        " *Delivery Type* :" + params.deliveryTypeText + "\n" +
        " *Delivery Date* :" + params.dueDatetimeDate +
        " *Delivery Time* :" + moment(moment.unix(params.startDateTimestamp)).tz('Asia/Kolkata').format('HH:mmA') + " - " + moment(moment.unix(params.endDateTimestamp)).tz('Asia/Kolkata').format('HH:mmA') + "\n";
    let Item = [];
    let Items = params.Items;

    let customerDetails = "*Address*: " + (params.drop.flatNumber ? params.drop.flatNumber + "," : "") + (params.drop.landmark ? params.drop.landmark + "," : "") + (params.drop.addressLine1 ? params.drop.addressLine1 + "," : "") + (params.drop.addressLine2 ? params.drop.addressLine2 + "," : "") +
        "\n*Tel*: " + params.customerDetails.countryCode + " " + params.customerDetails.mobile +
        "\n*Email*: " + params.customerDetails.email;

    Item.push({
        'title': params.customerDetails.name,
        'text': customerDetails
    })
    Items.forEach(element => {

        let itemName = element.itemName + ",";
        let itemQty = "*" + element.quantity + " Qty* (" + element.unitName + ")";
        let itemPrice = element.finalPrice;
        let totalPrice = parseFloat(element.quantity * itemPrice).toFixed(2);
        let itemImage = element.itemImageURL;



        let itemDetails = itemQty + " x " + params.currencySymbol + itemPrice + " = " + params.currencySymbol + totalPrice;

        Item.push({
            'title': itemName,
            'title_link': itemName,
            'text': itemDetails,
            'thumb_url': itemImage
        })

    });


    var options = {
        method: 'POST',
        url: config.SLACK_WEBHOOKS_URL,
        headers:
        {
            'postman-token': 'cc7dca3c-3eb1-108a-1a7f-2119b600d50f',
            'cache-control': 'no-cache',
            'content-type': 'application/json'
        },
        body:
        {
            channel: '#bookingtest',
            username: 'DelivX',
            text: data,
            attachments: Item,
            icon_emoji: ':slack:'
        },
        json: true
    };
    request(options, function (error, response, body) {
        if (error) return callback(error)
        callback(null, response);
    });
}//send mail and store database

module.exports = { sendSlackMessage };


