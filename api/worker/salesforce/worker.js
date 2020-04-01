'use strict';

const logger = require('winston');
const rabbitMq = require('../../library/rabbitMq');
const SalesforceAUTH = require('../../library/salesforce');
const config = process.env;
const superagent = require('superagent');

/**
 * Connecting RabbitMQ and MongoDB 
 * Calling Prepare Consumer
 */
rabbitMq.connect(() => {
    if (config.salesforceService) {
        SalesforceAUTH.login(() => { });
        //connect salesforce
        prepareConsumer(rabbitMq.getChannel(), rabbitMq.queueSalesforce, rabbitMq.get());
    }
});

/**
 * Preparing Consumer for Consuming Booking from New Booking Queue
 * @param {*} channel Salesforce new ticket Channel
 * @param {*} queue  queueSalesforce
 * @param {*} amqpConn RabbitMQ connection
 */
function prepareConsumer(channel, queue, amqpConn) {
    channel.assertQueue(queue.name, queue.options, function (err, amqpQueue) {
        if (err) {
            process.exit();
        } else {
            channel.consume(queue.name, function (msg) {
                var data = JSON.parse(msg.content.toString());
                // if (config.salesforceService) {
                //     var authData = SalesforceAUTH.get();


                //     var TicketeSalesforcePayload = data.TicketePayload;

                /*
{
"subject":"[1553321605062]",
"body":"wo",
"status":"open",
"priority":"high",
"type":"problem",
"requester_id":null,  
"assignee_id":null,
"group_id":null,
"comment":{
"body":"wo"
}
}
*/
                // var TicketDataToSF = {
                //     "caseMongoId": "ajkssdfjd1857.",
                //     "customerId": "5c80fa446723fa6189aebf5d",
                //     "storeId": "5c7e745023faf07d2515c81d",
                //     "subject": TicketeSalesforcePayload.subject ? TicketePayload.subject : "",
                //     "category": "Order Manager",
                //     "description": TicketeSalesforcePayload.body ? TicketePayload.body : "",
                //     "priority": TicketeSalesforcePayload.priority ? TicketePayload.priority : "",
                //     "origin": "Email",
                //     "status": "New",
                //     "typeValue": "Problem",
                //     "caseReason": "Performance"
                // };


                // if (authData) {
                //     superagent
                //         .post(authData.instanceUrl + '/services/apexrest/Flexy_App/Case')
                //         .send(TicketDataToSF) // sends a JSON post body
                //         .set('Accept', 'application/json')
                //         .set('Authorization', 'Bearer ' + authData.accessToken)
                //         .end((err, res) => {
                //             if (res.status == 404 || res.statusCode == 404) {
                //                 logger.info("No AUTH data for salesforce", err);
                //             } else if (res.status == 204 || res.statusCode == 204) {
                //                 logger.info("New ticket sent to salesforce Failed. ");
                //             }
                //             if (res.status == 200 || res.statusCode == 200) {
                //                 logger.info("New ticket sent to salesforce successfully.");
                //             }
                //         });
                //     // call your salesforce api
                // }

                // }

            }, { noAck: true }, function (err, ok) {
            });
        }
    });
}