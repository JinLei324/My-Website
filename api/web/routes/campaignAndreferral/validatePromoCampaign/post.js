/*
@Post the promo request
@async call to validate to check city, zone, global claim count, global usage limit, payment method, status, timestamp
@
 */

var underscore = require('underscore');
const Joi = require("joi");
const logger = require('winston');
const Promise = require('promise');
const moment = require("moment");
const validatePromoCodes = require('../../../../models/validatePromoCodes');
const error = require('../../../../statusMessages/responseMessage');
const rabbitMq = require('../../../../library/rabbitMq');

// Validate the fields
var postRequestValidator = {
    payload: {
        bookingId: Joi.string().required().description('Mandatory field. '),
        userId: Joi.string().required().description('Mandatory field. '),
        customerName: Joi.string().required().description('Mandatory field. '),
        cityId: Joi.string().required().description('Mandatory field. '),
        zoneId: Joi.string().allow('').description('Mandatory field. '),
        paymentMethod: Joi.number().required().description('Mandatory field. '),
        paymentMethodString: Joi.string().required().description('Mandatory field. '),
        bookingTime: Joi.string().required().description('Mandatory field'),
        deliveryFee: Joi.any().required().description('Mandatory field'),
        cartValue: Joi.any().required().description('Mandatory field'),
        currency: Joi.string().required().description('Mandatory field'),
        email: Joi.string().required().description("Customer eamil"),
        cartId: Joi.string().required().description("Cart id of that booking")
    }
};

// Post a new request then check available campaigns
var postRequestHandler = (request, reply) => {
    request.payload = request;
    var dateTime = require('node-datetime');
    var dt = dateTime.create();
    var formatted = dt._created;
    // add request to worker
    var requestData = {
        bookingId: request.payload.bookingId,
        userId: request.payload.userId,
        customerName: request.payload.customerName,
        cityId: request.payload.cityId,
        cityName: request.payload.cityName,
        zoneId: request.payload.cityId,
        paymentMethod: request.payload.paymentMethod,
        paymentMethodString: request.payload.paymentMethodString,
        bookingTime: request.payload.bookingTime,
        deliveryFee: request.payload.deliveryFee,
        cartValue: request.payload.cartValue,
        currency: request.payload.currency,
        currencySymbol: request.payload.currencySymbol,
        email: request.payload.email,
        created: formatted,
        cartId: request.payload.cartId
    };


    rabbitMq.sendToQueue(rabbitMq.queuePromoCampaign, requestData, (err, doc) => { });
    return reply({
        statusCode: 200,
        message: 'Request received',
    });

}


// Get the available campaign
function getCampaign(requestData) {
    let response = validatePromoCodes.validateCampaign(requestData);
    return response;
}

var response = {
    status: {
        200: {
            message: "Request added successfully"
        },
        500: {
            message: "Error while posting new request"
        }
    }
}

// export handler and validator
module.exports = {
    postRequestValidator,
    postRequestHandler
}