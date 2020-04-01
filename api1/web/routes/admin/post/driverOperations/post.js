'use strict'
const customer = require('../../../../../models/customer');
const driver = require('../../../../../models/driver');
const storeManagers = require('../../../../../models/storeManagers');
const error = require('../../../../../locales');  // response messages based on language  
const presence = require('../../../../commonModels/presence');
const Joi = require('joi');
const logger = require('winston');

const config = process.env;
const cheerio = require('cheerio');//to extract the html from html files
const fs = require('fs');
const async = require('async');
const distance = require('google-distance');
const ObjectID = require('mongodb').ObjectID;
const Auth = require('../../../../middleware/authentication');
const notifications = require('../../../../../library/fcm');
const notifyi = require('../../../../../library/mqttModule');
const dispatcher = require('../../../../commonModels/dispatcher');
const i18n = require('../../../../../locales/locales');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {

    // let modelName = '';
    // switch (req.payload.status) {
    //     case 1:
    //         modelName = driver;
    //         break;
    //     case 2:
    //         modelName = driver;
    //         break;
    //     case 3:
    //         modelName = driver;
    //         break;
    //     case 4:
    //         modelName = driver;
    //         break;

    //     default:
    //         return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
    // }
    driver.isExistsWithId({ _id: new ObjectID(req.payload.userId.toString()) }, (err, data) => {
        if (err) {
            logger.error('Error occurred during admin check user (isExistsWithId): ' + JSON.stringify(err));
            return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
        }
        if (data) {
            (req.payload.status == 4) ? statusChange(data).then(data => {

                return reply({
                    message: Joi.any().default(i18n.__('genericErrMsg')['200'])
                }).code(200);

            }) : updateLogout(data).then(success => {


                // let token = Auth.SignJWT({ _id: req.payload.userId, key: 'acc', deviceId: data.mobileDevices ? '' + data.mobileDevices.deviceId + '-manuallyxxLogoutxxByxxAdmin' : 1 }, 'driver', '2s');//sign a new JWT
                //  logger.error(token);

                return reply({
                    message: Joi.any().default(i18n.__('genericErrMsg')['200'])
                }).code(200);

            }).catch(e => {
                logger.error('Error occurred place order (catch): ' + JSON.stringify(e));
                return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
            });
        } else {
            return reply({ message: error['emails']['400'] }).code(400);
        }

    });

    //logout() function
    const updateLogout = (data) => {
        return new Promise((resolve, reject) => {
            driver.patchlogoutStatus({ _id: new ObjectID(req.payload.userId) }, (err, result) => {
                if (err) {
                    logger.error('Error occurred during driver logout (patchlogoutStatus2): ' + JSON.stringify(err));
                    return reject(err);
                }
                else
                    driver.deleteFromPresence({ key: 'presence_' + req.payload.userId }, (err, result) => {
                        if (err)
                            logger.error('Error occurred during driver logout (deleteFromPresence): ' + JSON.stringify(err));
                    });
                dispatcher.providerStatus({ _id: req.payload.userId }, (err, res) => { });

                notifications.notifyFcmTopic({ // fcm
                    action: 12,
                    usertype: 2,
                    deviceType: data.mobileDevices ? data.mobileDevices.deviceType : 1,
                    notification: "",
                    msg: req.i18n.__(req.i18n.__('driverStatus')['statusText'], data.orderId),
                    fcmTopic: data.pushToken,
                    title: req.i18n.__(req.i18n.__('driverStatus')['statusTitle'], data.orderId),
                    data: { deviceId: data.mobileDevices ? '' + data.mobileDevices.deviceId + '-manuallyxxLogoutxxByxxAdmin' : 1 }
                }, () => { });// fcm event to driver
                notifyi.notifyRealTime({ 'listner': data.publishChn, message: { action: 12, message: 'You have been logged out by our operations team, please login again to continue accessing your account.', deviceId: data.mobileDevices ? '' + data.mobileDevices.deviceId + '-manuallyxxLogoutxxByxxAdmin' : 1 } }); // mqtt to driver

                return resolve(true);
            });
        });
    }
    //offline() function
    const statusChange = (data) => {
        return new Promise((resolve, reject) => {
            driver.patchOnlineStatus({
                _id: new ObjectID(req.payload.userId), status: parseInt(req.payload.status)
            }, (err, bookings) => {
                if (err) {
                    logger.error('Error occurred during driver status update (patchOnlineStatus) : ' + JSON.stringify(err));
                    return reject(err);
                }
                if (bookings) {   //invoke a method to log the driver presence time
                    presence.driverStatusPresence({ mid: req.payload.userId, status: req.payload.status }, (err, res) => {
                    });
                    if (req.payload.status == 4) {
                        driver.deleteFromPresence({ key: 'presence_' + req.payload.userId }, (err, result) => {
                            if (err) logger.error('Error occurred during driver off job (deleteFromPresence): ' + JSON.stringify(err));
                        });
                    }
                    // websocket
                    dispatcher.providerStatus({ _id: req.payload.userId },
                        (err, res) => {
                            if (err) logger.error('websocket response success api onlineoffline: ' + JSON.stringify(err));
                        });


                    notifications.notifyFcmTopic({ // fcm
                        action: 16,
                        usertype: 2,
                        deviceType: data.mobileDevices ? data.mobileDevices.deviceType : 1,
                        notification: "",
                        msg: req.i18n.__(req.i18n.__('driverStatus')['offlineText'], data.orderId),
                        fcmTopic: data.pushToken,
                        title: req.i18n.__(req.i18n.__('driverStatus')['offlineTitle'], data.orderId),
                        data: { deviceId: data.mobileDevices ? data.mobileDevices.deviceId : 1 }
                    }, () => { });// fcm event to driver

                    notifyi.notifyRealTime({ 'listner': data.publishChn, message: { action: 16, message: 'Your availability status has been switched to offline by our operations team', deviceId: data.mobileDevices ? data.mobileDevices.deviceId : 1 } }); // mqtt to driver

                    return resolve(true);
                }
            });
        });
    }



}


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    userId: Joi.string().required().description('userId'),
    status: Joi.number().integer().min(4).max(5).required().description('4 - driver offline \n\n 5- driver logout')
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }