'use strict';

const logger = require('winston');
const rabbitMq = require('../../library/rabbitMq');
const db = require('../../library/mongodb');
const zandesk = require('./../../models/zendesk');
// logger.info('step 3 : Child Process Started For New Booking Queue.......' + process.pid + " ");

/**
 * Connecting RabbitMQ and MongoDB 
 * Calling Prepare Consumer
 */
rabbitMq.connect(() => {
    db.connect(() => {
        prepareConsumer(rabbitMq.getChannel(), rabbitMq.queueTicket, rabbitMq.get());
    });
});

/**
 * Preparing Consumer for Consuming Booking from New Booking Queue
 * @param {*} channel New Booking Channel
 * @param {*} queue  New Booking Queue
 * @param {*} amqpConn RabbitMQ connection
 */
function prepareConsumer(channel, queue, amqpConn) {
    logger.info(queue.name + " worker started");
    channel.assertQueue(queue.name, queue.options, function (err, amqpQueue) {
        if (err) {
            process.exit();
        } else {
            channel.consume(queue.name, function (msg) {
                logger.silly("consume started" + new Date());
                logger.silly("msg   ", msg.content.toString());
                // var _id = data._id;
                //mqtt.publish("searchResult/" + _id, JSON.stringify({ data: dataToSend }), { qos: 2 }, () => { });

                try {
                    var request = JSON.parse(msg.content.toString());
                    logger.silly("In worker ticket: ", request);
                    logger.silly('request.payload', request.payload);
                    zandesk.operations.createSingleTicket(request.payload, function (err, result) {
                        if (err) {
                            return reply(err);
                        } else {
                            return reply(result);
                        }
                    })

                } catch (error) {
                    logger.error("try cat error ", error)
                }

            }, { noAck: true }, function (err, ok) {
                //To check if need to exit worker
            });
        }
    });
}