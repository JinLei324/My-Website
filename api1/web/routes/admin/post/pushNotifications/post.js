
'use strict';

const joi = require('joi');
const Async = require('async');
const moment = require('moment');//date-time
const logger = require('winston');
const ObjectID = require('mongodb').ObjectID;
const adminPushNotifications = require('../../../../../models/adminPushNotifications');
const fcm = require('../../../../../library/fcm');

const payload = joi.object({
    users: joi.any().description('user id , separated'),
    topics: joi.string().required().description('topics (, saprated) for user fcm topic , for city cityId, for area zone zoneId'),
    title: joi.string().required().description('title of the push notification'),
    message: joi.string().required().description('message of the push notification'),
    type: joi.number().required().description('type 1-individual, 2-city, 3-area zone'),
    userType: joi.number().required().description('1-customer, 2-driver 3 - store Manager')
}).required();

const logAdminPushNotification = (data, callback) => {
    adminPushNotifications.post(data, (err, doc) => {
        if (err)
            return callback({ errNum: 500, errMsg: 'Database error', errFlag: 1 });

        return callback({ errFlag: 0, errMsg: 'Success', errNum: 200 });
    });
};

const handler = (req, reply) => {
    let users = req.payload.users || '';
    let topics = req.payload.topics.split(',');
    if (!Array.isArray(topics) || topics.length == 0)
        return reply({ errNum: 500, errMsg: 'fcm topic missing', errFlag: 1 });
        let typeText = "";
    let userTypeText = "";
    let userFcmTopic = "";
    let userTypeName = "";
    switch (parseInt(req.payload.userType)) {
        case 1:
            userTypeText = "customer";
            break;
        case 2:
            userTypeText = "driver";
            break;
        case 3:
            userTypeText = "storeManager";
            break;
        default:
            return reply({ errNum: 200, errMsg: 'User Type Wrong', errFlag: 1 });
            break;
    }
    Async.each(topics, (topic, callback) => { // for each product from cart
      
      
        switch (parseInt(req.payload.type)) {
            case 1:
                userFcmTopic = topic;
                typeText = "Individual";
                break;
            case 2:
                userFcmTopic = userTypeText + "_" + topic;
                // userFcmTopic = topic;
                typeText = "City";
                break;
            case 3:
                userFcmTopic = userTypeText + "_" + topic;
                // userFcmTopic = topic;
                typeText = "area zone";
                break;
            default:
                break;
        }
        fcm.notifyFcmTopic({
            fcmTopic: userFcmTopic,
            action: 111,
            pushType: 1,
            title: req.payload.title,
            msg: req.payload.message,
            data: {},
            deviceType: 1
        }, (e, r) => {
            // log into database
        });

        callback()
    }, function (err) {

        let data = {
            title: req.payload.title,
            message: req.payload.message,
            msg: req.payload.message,
            type: req.payload.type,
            typeText: typeText,
            userType: req.payload.userType,
            userTypeText: userTypeText,
            topic: req.payload.topics,
            users: users.split(","),
            time: moment().unix()
        }
        logger.error('logAdminPushNotification');
        logAdminPushNotification(data, (err, res) => {

        });
        return reply({ errNum: 200, errMsg: 'Success', errFlag: 1 });
    });
    
};

const responseCode = {
    status: {
        // 500: { message: Joi.any().default(i18n.__('genericErrMsg')['500'])[error['lang']] },
        // 200: {
        //     message: error['getProvider']['200'][error['lang']],
        //     data: joi.any()
        // },
    }

}//swagger response code

module.exports = {
    payload,
    handler,
    responseCode
};