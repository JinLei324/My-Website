


'use strict';

const db = require('../../library/mongodb');
const logger = require('winston');
const fcm = require('../../library/fcm');
const mqtt = require('../../library/mqttModule');
const rabbitMq = require('../../library/rabbitMq');
const ObjectID = require("mongodb").ObjectID;
var messageDB = require('../../models/messageDB');
var userList = require('../../models/userList');
// logger.info('step 3 : Child Process Started For New Booking Queue.......' + process.pid + " ");

/**
 * Connecting RabbitMQ and MongoDB 
 * Calling Prepare Consumer
 */
rabbitMq.connect(() => {
    db.connect(() => {
        prepareConsumer(rabbitMq.getChannel(), rabbitMq.queueMessages, rabbitMq.get());
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
                userList.SelectOne({ _id: ObjectID(data.fromID) }, (err, result) => {
                    if (result && result.firstName) {
                        data["name"] = result.firstName + " " + result.lastName;
                        data["profilePic"] = result.profilePic
                    }
                    let mqttObject = {
                        "listner": `message/${data.targetId}`,
                        "message": { data: data },
                        "qos": 2
                    };
                    mqtt.notifyRealTime(mqttObject, () => { });
                    try {
                        userList.SelectOne({ _id: ObjectID(data.targetId) }, (err, result) => {
                            if (result && result.firebaseTopic) {
                                let msg = ((data.content.indexOf("http://138.197.78.50/simple-Chat-module-images/chat/") > -1) ? "Image" : (
                                    (data.content.indexOf("https://s3.amazonaws.com/livemapplication/chatImages/") > -1) ? "Image" : data.content
                                ))
                                let request = {
                                    fcmTopic: result.firebaseTopic,
                                    action: 1,
                                    pushType: 2,
                                    title: "Message",
                                    msg: msg,
                                    data: data,
                                    deviceType: result.deviceType || 2
                                }
                                fcm.notifyFcmTopic(request, (e, r) => {
                                    if (e) {
                                        logger.error("fcm : ", e);
                                    } else {
                                        logger.silly("fcm sent")
                                    }
                                })
                            } else {
                                logger.error("firebaseTopic is not define.")
                            }
                        })
                    } catch (error) {
                        logger.error("error", error)
                    }

                });
                messageDB.Insert(data, () => { });

            }, { noAck: true }, function (err, ok) {
                //To check if need to exit worker
            });
        }
    });
}
