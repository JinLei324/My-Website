'use strict';

const logger = require('winston');
const rabbitMq = require('../../library/rabbitMq');
const db = require('../../library/mongodb');
const sendSms = require('../../library/twilio');
// const sendSms = require('../../library/nexmo');
// const sendSms = require('../../library/egacela');
// logger.info('step 3 : Child Process Started For New Booking Queue.......' + process.pid + " ");

/**
 * Connecting RabbitMQ and MongoDB 
 * Calling Prepare Consumer
 */
rabbitMq.connect(() => {
    db.connect(() => {
        prepareConsumer(rabbitMq.getChannel(), rabbitMq.queueSms, rabbitMq.get());
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
                let fullNumber;
                fullNumber = data.countryCode + data.phoneNumber
                let param = {
                    to: fullNumber,
                    countryCode: data.countryCode,
                    phoneNumber: data.phoneNumber,
                    body: data.body,
                    trigger: data.trigger
                }

                sendSms.sendSms(param, (err, res) => {

                    //  ipc.of.rabbitmqserverSMS.emit('message.consumed',res);
                });
            }, { noAck: true }, function (err, ok) {
                //To check if need to exit worker
            });
        }
    });
}