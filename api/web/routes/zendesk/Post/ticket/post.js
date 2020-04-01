'use strict'
const logger = require('winston');
const Joi = require("joi");
const zendesk = require('../../../../../models/zendesk');
// const rabbitmqUtil = require("../../../../../library/rabbitMq/ticket")
const rabbitMq = require("../../../../../library/rabbitMq")

const Validator = Joi.object({
    subject: Joi.string().required().description('The value of the subject field for this ticket'),
    body: Joi.string().required().description('The first comment on the ticket'),
    status: Joi.string().description('The state of the ticket, "new", "open", "pending", "hold", "solved", "closed"'),
    priority: Joi.string().description('Priority, defines the urgency with which the ticket should be addressed: "urgent", "high", "normal", "low"'),
    type: Joi.string().description('The type of this ticket, i.e. "problem", "incident", "question" or "task"'),
    group_id: Joi.string().description('The group this ticket is assigned to'),
    requester_id: Joi.string().description('The user who requested this ticket'),
    assignee_id: Joi.string().description('What agent is currently assigned to the ticket')
}).required();


const APIHandler = (request, reply) => {
    var insertCustomerData = {
        "subject": request.payload.subject,
        "body": request.payload.body,
        "status": request.payload.status,
        "priority": request.payload.priority,
        "type": request.payload.type,
        "requester_id": parseInt(request.payload.requester_id),
        "assignee_id": parseInt(request.payload.assignee_id),
        "group_id": parseInt(request.payload.group_id),
        "comment": {
            body: request.payload.body
        }
    };

    rabbitMq.sendToQueue(rabbitMq.queueTicket, { "payload": insertCustomerData }, (err, doc) => {
    });
    return reply({ "message": "success data" });
    /*zendesk.operations.createSingleTicket(insertCustomerData, function (err, result) {
        if (err) {
            return reply(err);
        } else {
            return reply(result);
        }
    })*/
}
module.exports = { APIHandler, Validator }