'use strict'

/** 
 * This const requires the mongo url
 * @const
 * @requires module:config 
 */
const url = require('../../config/components/rabbitMq/config');
const logger = require('winston');
const worker = require('./worker');

//For the RabbitMQ connection
const amqp = require('amqplib/callback_api');

//For the chhanel corresponding to the high traffic apis
let channel = null;

//set up a connection
/**
 * @amqpConn will hold the connection and channels will be set up in the connection.
 */
var state = { amqpConn: null };

/**
 * Method to connect to the mongodb
 * @param {*} rabitmq url
 * @returns connection object
 */

exports.connect = (callback) => {
    if (state.amqpConn) {
        return callback();
    }

    amqp.connect(url + "?heartbeat=60", (err, conn) => {
        if (err) {
            logger.info("[AMQP]", err.message);
            return callback(err);
        }
        conn.on("error", (err) => {
            if (err.message !== "Connection closing") {
                logger.error("[AMQP] conn error", err.message);
                return callback(err);
            }
        });
        conn.on("close", () => {
            logger.warn("[AMQP] reconnecting");
        });
        logger.warn("[AMQP] connected --------------------- ");
        state.amqpConn = conn;

        preparePublisher();
        return callback();
    });
}

/**
 * Method to get the connection object of the mongodb
 * @returns db object
 */
exports.get = () => {
    return state.amqpConn;
}

/**
 * Method to Prepare Publisher
 */
function preparePublisher() {
    channel = state.amqpConn.createChannel((err, ch) => {
        if (closeOnErr(err)) return;
        ch.on("error", (err) => {
            logger.error("[AMQP] channel error", err.message);
        });
        ch.on("close", () => {
            logger.warn("[AMQP] channel closed");
        });
    });
}

/**
 * Closing RabbitMQ connection on error
 * @param {*} err Error Object
 */
function closeOnErr(err) {

    if (!err) return false;

    logger.error("[AMQP] error", err);
    state.amqpConn.close();
    return true;
}

exports.getChannel = () => {
    return channel;
}

//For the queues corresponding to the high traffic apis


exports.queueNewBooking = {
    name: 'queueNewBooking',
    threshold: 100,
    options: { durable: false },
    flag: true,
    alwaysRun: true,
    worker: worker.newBooking
};

exports.queueRetry = {
    name: 'queueRetry',
    threshold: 100,
    options: { durable: false },
    flag: true,
    alwaysRun: true,
    worker: worker.retryBooking
};

exports.queueEmail = {
    name: 'queueEmail',
    threshold: 100,
    options: { durable: false },
    flag: true,
    alwaysRun: true,
    worker: worker.email
};

exports.queueTicket = {
    name: 'queueTicket',
    threshold: 100,
    options: { durable: false },
    flag: true,
    alwaysRun: true,
    worker: worker.ticket
};

exports.queueSms = {
    name: 'queueSms',
    threshold: 100,
    options: { durable: false },
    flag: true,
    alwaysRun: true,
    worker: worker.sms
};

exports.queueStripeEvent = {
    name: 'queueStripeEvent',
    threshold: 100,
    options: { durable: false },
    flag: true,
    alwaysRun: true,
    worker: worker.stripeEvent
};

exports.queueMessages = {
    name: 'queueMessages',
    threshold: 100,
    options: { durable: false },
    flag: true,
    alwaysRun: true,
    worker: worker.messages
};

exports.queuePromoCampaign = {
    name: 'promoCampaign',
    threshold: 100,
    options: { durable: false },
    flag: true,
    alwaysRun: true,
    worker: worker.promoCampaignUtility
};

exports.queueReferralCampaign = {
    name: 'referralCampaign',
    threshold: 100,
    options: { durable: false },
    flag: true,
    alwaysRun: true,
    worker: worker.referralCampaignUtility
};
exports.queueMasterLocation = {
    name: 'queueMasterLocation',
    threshold: 100,
    options: { durable: false },
    flag: true,
    alwaysRun: true,
    worker: worker.queueMasterLocation
};

exports.QueueBulkimportInsert = {
    name: 'QueueBulkimportInsert',
    threshold: 100,
    options: { durable: false },
    flag: true,
    alwaysRun: true,
    worker: worker.QueueBulkimportInsert
};
exports.sendToQueue = (queue, data) => {
    if (channel) {
        channel.assertQueue(queue.name, queue.options, function (err, queueList) {
            channel.sendToQueue(queue.name, Buffer.from(JSON.stringify(data)));
            worker.checkWorker(queue);
        });
    } else {
        logger.error("channal not found");
        connect(() => {
            if (channel) {
                channel.assertQueue(queue.name, queue.options, function (err, queueList) {
                    channel.sendToQueue(queue.name, Buffer.from(JSON.stringify(data)));
                    worker.checkWorker(queue);
                });
            } else {
                logger.error("channal not found...2");
            }
        });
    }
}