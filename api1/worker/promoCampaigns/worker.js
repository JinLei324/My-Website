'use strict';

const logger = require('winston');
const rabbitMq = require('../../library/rabbitMq');
const promoCampaigns = require('../handlers/promoCampaigns');
const db = require('../../library/mongodb');

rabbitMq.connect(() => {
    db.connect(() => {
        prepareConsumer(rabbitMq.getChannel(), rabbitMq.queuePromoCampaign, rabbitMq.get());
    });
});

/**
 * Preparing Consumer for Consuming Booking from locationUpdate Booking Queue
  @param {} channel location Booking Channel
  @param {} queue  location Booking Queue
  @param {} amqpConn RabbitMQ connection
 */
function prepareConsumer(channel, queue, amqpConn) {
    channel.assertQueue(queue.name, queue.options, function (err, amqpQueue) {
        if (err) {
            // process.exit();
        } else {
            channel.consume(queue.name, function (msg) {
                var data = JSON.parse(msg.content.toString());
                promoCampaigns.postRequestHandler(data, function (err, response) {
                });
            }, { noAck: true }, function (err, ok) {
                // if (queue.worker.alwaysRun) {
                //     // keep worker running
                // } else {
                //     //To check if need to exit worker
                //     rabbitMq.exitWokerHandler(channel, queue, amqpConn);
                // }
            });
        }
    });
}