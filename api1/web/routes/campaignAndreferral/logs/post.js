require("moment");

const Joi = require("joi");

const async = require("async");

const logger = require('winston');

const Promise = require('promise');

const ObjectID = require('mongodb').ObjectID;

const logs = require('../../../../models/promoCampaigns/logs');

// const error = require('../../../statusMessages/responseMessage');

let postInputLogsValidator = {
	payload:{
		   	bookingId 	: Joi.string().required().description("Mandatory field for booking id"),
			userId: Joi.string().required().description("Mandatory field for user id"),
			customerFirstName: Joi.string().required().description("Mandatory field for customer first name"),
			cityId: Joi.string().required().description("Mandatory field for city id"),
			zoneId: Joi.string().description("Non mandatory field. Zone id"),
			paymentMethodInt: Joi.number().required().description("Mandatory field for payment method choosed by the customer as int (1 -> card, 2 -> cash, 3-> wallet)"),
			paymentMethodString: Joi.string().required().description("Mandatory field for payment method choosed by the customer as string (card, cash, wallet)") ,
			bookingTime: Joi.string().required().description("Mandatory field for booking time"),
			deliveryFee: Joi.number().required().description("Mandatory field for delviery fee"),
			cartValue: Joi.number().required().description("Mandatory field for cart value"),
			currency: Joi.string().required().description("Mandatory field for currency")
	}
}

let postInputLogsHandler = (request, reply) => {
	let inputLogsData = {
		bookingId 	: request.payload.bookingId,
		userId: request.payload.userId,
		customerFirstName: request.payload.customerFirstName,
		cityId: request.payload.cityId,
		zoneId: request.payload.zoneId,
		paymentMethodInt: request.payload.paymentMethodInt,
		paymentMethodString: request.payload.paymentMethodString,
		bookingTime: request.payload.bookingTime,
		deliveryFee: request.payload.deliveryFee,
		cartValue: request.payload.cartValue,
		currency: request.payload.currency,
		currentTimestamp: new Date()
	}

	logs.postInputLogs(inputLogsData, (err, res) => {
		if (err) {
			 logger.error('Error while posting new log : ' + err);
            return reply({
                message: "Error while posting new log",
                data: {
                    status: false
                }
            }).code(500);
		}else{
			 logger.error('New log posted successfully');
            return reply({
                message: "New log posted successfully",
                data: {
                    status: false
                }
            }).code(500);
		}
	})



}

module.exports = {
	postInputLogsValidator,
	postInputLogsHandler

} 


