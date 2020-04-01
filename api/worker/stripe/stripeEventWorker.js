'use strict';

const logger = require('winston');
const rabbitMq = require('../../library/rabbitMq');
const db = require('../../library/mongodb');
const moment = require('moment');
const stripeEventLog = require('../../models/stripeEventLog');
const stripeCharges = require('../../models/stripeCharges');
// logger.info('step 3 : Child Process Started For New Booking Queue.......' + process.pid + " ");

/**
 * Connecting RabbitMQ and MongoDB 
 * Calling Prepare Consumer
 */
rabbitMq.connect(() => {
    db.connect(() => {
        prepareConsumer(rabbitMq.getChannel(), rabbitMq.queueStripeEvent, rabbitMq.get());
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
                logger.info("New Stripe Event Logging Started.");
                let insObj = {
                    timeStamp: moment().unix(),
                    eventData: data
                }
                stripeEventLog.insert(insObj)
                    .then((data) => {
                        logger.info('Stripe Event Logged');
                    }).catch((err) => {
                        logger.error('Got Error While Stripe Event Logging : ', err);
                    });

                stripeChargeEvent(data)
            }, { noAck: true }, function (err, ok) {
                //To check if need to exit worker
            });
        }
    });
}


const stripeChargeEvent = (data) => {
    let event = data.type;
    let dataObj = data.data.object;
    let dataArr = {};

    switch (event) {
        case 'charge.succeeded':
            dataArr = {
                bookingId: parseFloat(dataObj.metadata.bookingId) || '',
                paymentId: dataObj.customer || '',
                cardId: dataObj.source.id || '',
                chargeId: dataObj.id || '',
                captured: dataObj.captured || false,
                customerId: dataObj.metadata.customerId || '',
                amount: (dataObj.amount) / 100 || '',
                amount_refunded: (dataObj.amount_refunded) / 100 || 0,
                stripeAmount: dataObj.amount || '',
                currency: dataObj.currency || '',
                chargeDate: dataObj.created || '',
                status: (dataObj.captured && dataObj.captured == true) ? 'Charge captured' : 'Create Charge',
                // status: 'Create Charge',
                customerName: dataObj.metadata.customerName || '',
                customerPhone: dataObj.metadata.customerPhone || '',
                livemode: data.livemode,
                last4: dataObj.source.last4,
                brand: dataObj.source.brand,
            };
            stripeCharges.post(dataArr, (err, res) => {
                logger.error("stripe charge insert error", err);
            });
            break;
        case 'charge.captured':
            dataArr = {
                bookingId: parseFloat(dataObj.metadata.bookingId) || '',
                paymentId: dataObj.customer || '',
                cardId: dataObj.source.id || '',
                chargeId: dataObj.id || '',
                captured: dataObj.captured || '',
                customerId: dataObj.metadata.customerId || '',
                amount: (dataObj.amount) / 100 || '',
                amount_refunded: (dataObj.amount_refunded) / 100 || 0,
                stripeAmount: dataObj.amount || '',
                currency: dataObj.currency || '',
                chargeDate: dataObj.created || '',
                status: (dataObj.captured && dataObj.captured == true) ? 'Charge captured' : 'Create Charge',
                // status: 'Charge captured',
                customerName: dataObj.metadata.customerName || '',
                customerPhone: dataObj.metadata.customerPhone || '',
                livemode: data.livemode,
                last4: dataObj.source.last4,
                brand: dataObj.source.brand,
            };
            stripeCharges.post(dataArr, (err, res) => {
                logger.error("stripe charge insert error", err);
            });
            break;
        case 'charge.refunded':
            let statusMsg = 'Partial refunded'
            if (dataObj.amount_refunded == dataObj.amount || dataObj.amount_refunded == "") {
                statusMsg = 'Charge refunded';
            }
            dataArr = {
                bookingId: parseFloat(dataObj.metadata.bookingId) || '',
                paymentId: dataObj.customer || '',
                cardId: dataObj.source.id || '',
                chargeId: dataObj.id || '',
                captured: dataObj.captured || '',
                customerId: dataObj.metadata.customerId || '',
                amount: (dataObj.amount) / 100 || '',
                amount_refunded: (dataObj.amount_refunded) / 100 || 0,
                stripeAmount: dataObj.amount || '',
                currency: dataObj.currency || '',
                chargeDate: dataObj.created || '',
                status: statusMsg,
                customerName: dataObj.metadata.customerName || '',
                customerPhone: dataObj.metadata.customerPhone || '',
                livemode: data.livemode,
                last4: dataObj.source.last4,
                brand: dataObj.source.brand,
            };
            stripeCharges.post(dataArr, (err, res) => {
                logger.error("stripe charge insert error", err);
            });
            break;
        default:



    }


}