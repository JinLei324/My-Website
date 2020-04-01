'use strict';

const logger = require('winston');
const rabbitMq = require('../../library/rabbitMq');
const db = require('../../library/mongodb');
const sendMail = require('../../library/mailgun');
const configEnv = process.env;

// logger.info('step 3 : Child Process Started For New Booking Queue.......' + process.pid + " ");

/**
 * Connecting RabbitMQ and MongoDB 
 * Calling Prepare Consumer
 */
rabbitMq.connect(() => {
    db.connect(() => {
        prepareConsumer(rabbitMq.getChannel(), rabbitMq.queueEmail, rabbitMq.get());
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
                logger.debug("consume started" + new Date());
                logger.debug("------***-----worker process id", process.id);
                // logger.debug("msg   ", msg.content.toString());

                var data = JSON.parse(msg.content.toString());

                let param = {
                    from: "" + configEnv.appName + " <" + configEnv.emailsFromEmail + ">",
                    to: data.email,
                    subject: data.subject,
                    html: data.body,
                    trigger: data.trigger
                }
                sendMail.sendMail(param, (err, res) => {
                    if (res) {
                        logger.info("sendMail success")
                    } else {
                        logger.info("sendMail error")
                    }
                });
            }, { noAck: true }, function (err, ok) {
                //To check if need to exit worker
            });
        }
    });
}