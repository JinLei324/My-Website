'use strict';

const logger = require('winston');
const rabbitMq = require('../../library/rabbitMq');
// const serverDispatcher = require('../handlers/serverDispatcher');
const serverDispatcher = require('../handlers/serverDispatcher');
const db = require('../../library/mongodb');

// logger.info('step 3 : Child Process Started For New Booking Queue.......' + process.pid + " ");

/**
 * Connecting RabbitMQ and MongoDB 
 * Calling Prepare Consumer
 */
rabbitMq.connect(() => {
    db.connect(() => {
        prepareConsumer(rabbitMq.getChannel(), rabbitMq.queueNewBooking, rabbitMq.get());
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
                var data = JSON.parse(msg.content.toString());
                logger.info("New Booking Dispatching started : " + data.bid);
                serverDispatcher.nowBooking(data.bid, function (err, bookingdata) {
                });
            }, { noAck: true }, function (err, ok) {
                //To check if need to exit worker
            });
        }
    });
}