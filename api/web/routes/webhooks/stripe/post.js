'use strict';

const Joi = require('joi');
const logger = require('winston');

const rabbitMq = require('../../../../library/rabbitMq');

const payload = Joi.any();

const APIHandler = (req, reply) => {
    let eventData = req.payload;
    rabbitMq.sendToQueue(rabbitMq.queueStripeEvent, eventData, (err, doc) => {
    });
    return reply({ message: 'success'}).code(200);
};

const responseCode = {
    status: {
        200: { message: 'success' },
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };