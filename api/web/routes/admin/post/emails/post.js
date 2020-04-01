'use strict'
const rabbitMq = require('../../../../../library/rabbitMq');
const customer = require('../../../../../models/customer');
const driver = require('../../../../../models/driver');
const storeManagers = require('../../../../../models/storeManagers');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language  
const Joi = require('joi');
const logger = require('winston');

const config = process.env;
const cheerio = require('cheerio');//to extract the html from html files
const fs = require('fs');
const async = require('async');
const distance = require('google-distance');
const ObjectID = require('mongodb').ObjectID;

const notifications = require('../../../../../library/fcm');
const notifyi = require('../../../../../library/mqttModule');
const dispatcher = require('../../../../commonModels/dispatcher');
const Auth = require('../../../../middleware/authentication');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
    let filename = '';
    let modelName = '';
    let message = '';
    let trigger = '';
    let subject = '';
    switch (req.payload.status) {
        case 1:
            filename = config.prodEmailTemplateUrl + "customerBannedNotification.html"
            modelName = customer;
            trigger = 'Customer Banned'
            message = error['slaveSignIn']['415'][req.headers.language];
            subject = 'Action Required. Your profile has been banned.';
            break;
        case 2:
            filename = config.prodEmailTemplateUrl + "customerRejectedNotification.html"
            modelName = customer;
            trigger = 'Customer Rejected'
            message = error['slaveSignIn']['403'][req.headers.language];
            subject = 'Action Required. Your profile has been rejected.';
            break;
        case 3:
            filename = config.prodEmailTemplateUrl + "driverBannedNotification.html"
            modelName = driver;
            trigger = 'Driver Banned'
            // message = 'error['postSignIn']['406'][req.headers.language]';
            message = 'You have been banned by our operations team, please reach out to our support team for more information.';
            subject = 'Action Required. Your driver profile has been banned.';
            break;
        case 4:
            filename = config.prodEmailTemplateUrl + "driverRejectedNotification.html"
            modelName = driver;
            trigger = 'Driver Rejected'
            // message = error['postSignIn']['403'][req.headers.language];
            message = 'You have been rejected by our operations team, please reach out to our support team for more information.';
            subject = 'Action Required. Your driver profile has been rejected.';
            break;
        case 5:
            filename = config.prodEmailTemplateUrl + "storeRejectedNotification.html"
            modelName = store;
            trigger = 'Store Rejected'
            subject = 'Action Required. Your store profile has been rejected.';
            break;
        case 6:
            filename = config.prodEmailTemplateUrl + "CustomerActiveAfterBannedNotification.html"
            modelName = customer;
            trigger = 'Customer Approved'
            subject = 'Your profile is back in action. Happy Shopping!';
            break;
        case 7:
            filename = config.prodEmailTemplateUrl + "driverApprovedNotification.html"
            modelName = driver;
            trigger = 'Driver Approved'
            subject = 'Congratulations !! Your driver profile has been approved.';
            break;
        case 8:
            filename = config.prodEmailTemplateUrl + "storeApprovedNotification.html"
            modelName = store;
            trigger = 'Store Approved'
            subject = 'Congratulations !! Your store profile has been approved.';
            break;
        case 9:
            filename = config.prodEmailTemplateUrl + "customerNewSignup.html"
            modelName = customer;
            trigger = 'Customer New Registration'
            subject = 'Welcome to ' + config.appName + '!';
            break;
        case 10:
            filename = config.prodEmailTemplateUrl + "driverActiveAfterBannedNotification.html"
            modelName = driver;
            trigger = 'Driver Active After Banned'
            subject = 'Congratulations !! Your account has been reactivated .';
            break;
        case 11:
            filename = config.prodEmailTemplateUrl + "driverNewSignUp.html"
            modelName = driver;
            trigger = 'Driver New Registration'
            subject = 'Welcome to ' + config.appName + '!';
            break;
        case 12:
            filename = config.prodEmailTemplateUrl + "storeNewSignUp.html"
            modelName = store; //
            trigger = 'Store New Registration'
            subject = 'Welcome to ' + config.appName + '!';
            break;
        case 13:
            filename = config.prodEmailTemplateUrl + "storeManagerPasswordchangebystoreManager.html"
            modelName = storeManagers;
            trigger = 'Store Manager Password Change'
            subject = 'Your password has been successfully updated.';
            break;
        case 14:
            filename = config.prodEmailTemplateUrl + "storeCmsPasswordchangebystoreCms.html"
            modelName = store;
            subject = 'Your password has been successfully updated.';
            trigger = 'Store CMS Password Change'
            break;
        case 15:
            filename = config.prodEmailTemplateUrl + "customerpasswordchangebyadmin.html"
            modelName = customer;
            trigger = 'Customer Password Change By Admin'
            subject = 'Your password has been successfully updated.';
            break;
        case 16:
            filename = config.prodEmailTemplateUrl + "driverpasswordchangebyadmin.html"
            modelName = driver;
            trigger = 'Driver Password Change By Admin'
            subject = 'Your password has been successfully updated.';
            break;
        case 17:
            filename = config.prodEmailTemplateUrl + "storeManagerNewSignup.html"
            modelName = storeManagers;
            trigger = 'Store Manager Registration'
            subject = 'Congratulations !! Your manager profile for ' + req.payload.storeName + ' has been succeesfully created.';
            break;
        case 18:
            modelName = customer; // id verified
            break;

        default:
            return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
    }
    modelName.isExistsWithId({ _id: new ObjectID(req.payload.userId.toString()) }, (err, data) => {
        if (err) {
            logger.error('Error occurred during admin check user (isExistsWithId): ' + JSON.stringify(err));
            return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
        }
        if (data) {
            switch (req.payload.status) {
                case 1:
                    data.mobileDevices.deviceId = data.mobileDevices ? 'bannedByAdmin' + data.mobileDevices.deviceId : "";
                    sendNotification({ trigger: trigger, mobileDevices: data.mobileDevices, fcmTopic: data.fcmTopic, mqttTopic: data.mqttTopic, message: message, action: 12 });
                    break;
                case 2:
                    data.mobileDevices.deviceId = data.mobileDevices ? 'rejectedByAdmin' + data.mobileDevices.deviceId : "";
                    sendNotification({ trigger: trigger, mobileDevices: data.mobileDevices, fcmTopic: data.fcmTopic, mqttTopic: data.mqttTopic, message: message, action: 12 });
                    break;
                case 3:
                    sendNotification({ trigger: trigger, mobileDevices: data.mobileDevices, fcmTopic: data.pushToken ? data.pushToken : "", mqttTopic: data.publishChn ? data.publishChn : "", message: message, action: 12 });
                    Auth.SignJWT({ _id: req.payload.userId, key: 'acc', deviceId: data.mobileDevices ? '' + data.mobileDevices.deviceId + '-manuallyxxLogoutxxByxxAdmin' : 1 }, 'driver', '2s');//sign a new JWT

                    break;
                case 4:
                    sendNotification({ trigger: trigger, mobileDevices: data.mobileDevices, fcmTopic: data.pushToken ? data.pushToken : "", mqttTopic: data.publishChn ? data.publishChn : "", message: message, action: 12 });
                    Auth.SignJWT({ _id: req.payload.userId, key: 'acc', deviceId: data.mobileDevices ? '' + data.mobileDevices.deviceId + '-manuallyxxLogoutxxByxxAdmin' : 1 }, 'driver', '2s');//sign a new JWT

                    break;
                case 5:
                    sendNotification({ trigger: trigger, mobileDevices: data.mobileDevices, fcmTopic: data.pushToken ? data.pushToken : "", mqttTopic: data.publishChn ? data.publishChn : "", message: message, action: 12 });
                    break;
                case 18:
                    sendNotification({ trigger: trigger, mobileDevices: data.mobileDevices, fcmTopic: data.fcmTopic, mqttTopic: data.mqttTopic, message: message, action: 18 });
                    return reply({ message: error['emails']['200'][req.headers.language] }).code(200);
                    break;
            }

            fs.readFile(filename, (err, body) => {
                if (err) {
                    logger.error('Error occurred during admin notifiy (readFile): ' + JSON.stringify(err));
                    return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                }
                var $ = cheerio.load(body);
                Object.keys({ webUrl: config.webUrl, emailsFromEmail: config.emailsFromEmail, appName: config.appName, username: req.payload.name || '', emailAddress: req.payload.email || '', phoneNumber: req.payload.mobile || '', emailOrMobile: req.payload.email + ' / ' + req.payload.mobile || '', reason1: req.payload.reason1 || 'N/A', reason2: req.payload.reason2 || 'N/A', reason3: req.payload.reason3 || 'N/A', storeName: req.payload.storeName || '', password: req.payload.password || '', linkDriverPoliciesUrl: req.payload.reason1 || '', supportMobileNumber: "+1-415-813-5833", supportEmail: "dreamer@appscrip.com" }).forEach(key => {

                    $(key).replaceWith({ webUrl: config.webUrl, emailsFromEmail: config.emailsFromEmail, appName: config.appName, username: req.payload.name || '', emailAddress: req.payload.email || '', emailOrMobile: req.payload.email + ' / ' + req.payload.mobile || '', reason1: req.payload.reason1 || 'N/A', reason2: req.payload.reason2 || 'N/A', reason3: req.payload.reason3 || 'N/A', storeName: req.payload.storeName || '', password: req.payload.password || '', linkDriverPoliciesUrl: req.payload.reason1 || '', supportMobileNumber: "+1-415-813-5833", supportEmail: "dreamer@appscrip.com" }[key]);
                    req.payload.reason1 ? true : $(key).find('reason').removeAttr('clear');
                });
                let param = {
                    from: "" + config.appName + " <" + config.emailsFromEmail + ">",
                    email: req.payload.email,
                    subject: subject,
                    body: $('body').html(),
                    trigger: trigger
                };
                if (config.mailGunService == "true") {
                    rabbitMq.sendToQueue(rabbitMq.queueEmail, param, (err, doc) => {
                    });
                }
                return reply({ message: error['emails']['200'][req.headers.language] }).code(200);
            });
        } else {
            return reply({ message: error['emails']['400'][req.headers.language] }).code(400);
        }

    });






}
/**
 * 
 * @param {*} data user data
 */
function sendNotification(data) {
    logger.info('Admin Mqtt & fcm sent');
    //fcm events
    notifications.notifyFcmTopic({
        action: data.action,
        usertype: 1,
        deviceType: data.mobileDevices ? data.mobileDevices.deviceType : 1,
        notification: "",
        msg: data.message,
        fcmTopic: data.fcmTopic,
        title: data.trigger,
        data: {}
    }, () => { });

    // mqtt events
    notifyi.notifyRealTime({ 'listner': data.mqttTopic, message: { action: data.action, message: data.message, deviceId: data.mobileDevices ? data.mobileDevices.deviceId : "" } });
}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    userId: Joi.string().required().description('userId'),
    name: Joi.string().required().description('name'),
    email: Joi.string().required().description('email'),
    mobile: Joi.number().integer().required().description('phone'),
    status: Joi.number().integer().required().description('1 - customer ban \n\n 2- customer reject \n\n 3 -driver ban 4- driver reject \n\n 5-storeRejectedNotification \n\n 6-CustomerActiveAfterBannedNotification \n\n 7-driverApprovedNotification \n\n 8-storeApprovedNotification \n\n 9-customerNewSignup \n\n 10-driverActiveAfterBannedNotification \n\n 11-driverNewSignUp  \n\n 12-storeNewSignUp \n\n 13 -storeManagerPasswordchangebystoreManager \n\n 14 -storeCmsPasswordchangebystoreCms \n\n  15- customerpasswordchangebyadmin \n\n  16 - driverpasswordchangebyadmin \n\n  17 - store manager new signup \n\n  18 - identity card mmj card changes by admin'),
    storeName: Joi.string().description('if storeName'),
    reason1: Joi.string().description('if reason1 if driverActiveAfterBannedNotification send driverpolicies url'),
    reason2: Joi.string().description('if reason2'),
    reason3: Joi.string().description('if reason3'),
    password: Joi.string().description('if password for new signup')
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }