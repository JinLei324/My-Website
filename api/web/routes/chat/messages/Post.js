'use strict'
const Joi = require("joi");
const logger = require('winston');
const ObjectID = require("mongodb").ObjectID
const rabbitMq = require('../../../../library/rabbitMq');

let handler = (req, res) => {

    req.payload["fromID"] = req.auth.credentials._id;
    req.payload["timestamp"] = new Date().getTime();

    rabbitMq.sendToQueue(rabbitMq.queueMessages, req.payload, (err, doc) => {
    });
    return res({ "message": "Data will send in mqtt" }).code(200);
};

let validator = Joi.object({
    type: Joi.number().required().min(0).max(12).description("type").error(new Error('type is missing')),
    timestamp: Joi.number().min(0).required().description("timestamp").error(new Error('timestamp is missing')),
    content: Joi.string().required().description("content").error(new Error('content is missing')),
    fromID: Joi.string().required().description("fromID").error(new Error('fromID is missing')),
    bid: Joi.string().required().description("booking-id").error(new Error('bid is missing')),
    targetId: Joi.string().min(24).max(24).required().description("targetId").error(new Error('targetId is missing or incorrect formate')),
})

module.exports = { handler, validator }