
'use strict';
const logger = require('winston');
const rabbitMq = require('../../library/rabbitMq');
const serverDispatcher = require('../handlers/serverDispatcher');
const db = require('../../library/mongodb');
/**
 * Connecting RabbitMQ and MongoDB 
 * Calling Prepare Consumer
 */
rabbitMq.connect(() => {
    db.connect(() => {
        prepareConsumer(rabbitMq.getChannel(), rabbitMq.queueMasterLocation, rabbitMq.get());
    });
});

/**
 * Preparing Consumer for Consuming Booking from locationUpdate Booking Queue
 * @param {*} channelNewBooking location Booking Channel
 * @param {*} queueNewBooking  location Booking Queue
 * @param {*} amqpConn RabbitMQ connection
 */
function prepareConsumer(channel, queue, amqpConn) {
    logger.info(queue.name + " worker started");
    channel.assertQueue(queue.name, queue.options, function (err, amqpQueue) {
        if (err) {
            process.exit();
        } else {
            channel.consume(queue.name, function (msg) {
                // logger.info("locationUpdate Booking Queue Is  ............................: " + new Date());
                var data = JSON.parse(msg.content.toString());
                serverDispatcher.masterLocationUpdated(data.masId, data.lat, data.lng, function (err, back) {

                });
            }, { noAck: true }, function (err, ok) {
                //To check if need to exit worker
            });
        }
    });
}