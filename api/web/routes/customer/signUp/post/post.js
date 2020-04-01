'use strict'
const customer = require('../../../../../models/customer');
const cities = require('../../../../../models/cities');
const zendesk = require('../../../../../models/zendesk');
const appConfig = require('../../../../../models/appConfig');
const zones = require('../../../../../models/zones');
const mobileDevices = require('../../../../../models/mobileDevices');
const verificationCode = require('../../../../../models/verificationCode');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const sendMsg = require('../../../../../library/twilio')
const sendMail = require('../../../../../library/mailgun')
const cheerio = require('cheerio');//to extract the html from html files
const fs = require('fs');
const jwt = require('jsonwebtoken');
const email = require('../../../../commonModels/email/email');
const userList = require('../../../../commonModels/userList');
// const referralCampaigns = require('../../../referralCampaigns/post');
const referralCampaigns = require('../../../campaignAndreferral/referralCampaigns/post');



/** salesforce
* @library 
* @author Umesh Beti
*/
const superagent = require('superagent');
const sf = require('../../../../../library/salesforce');
/*salesforce*/

let geocodder = require('node-geocoder');
var options = {
    provider: 'google',
    // Optionnal depending of the providers
    httpAdapter: 'https', // Default
    apiKey: config.GoogleMapsApiKEy, // for Mapquest, OpenCage, Google Premier
    formatter: null        // 'gpx', 'string', ...
};
let geo = geocodder(options);


/** 
* @function
* @name handler 
* @return {object} Reply to the user.
* @param {data} 0 - name, 1 - email, 2 - mobile
*/
const handler = (req, reply) => {
    req.payload.zendeskId = "";
    let mongoId = new ObjectID();
    let fcmTopic = 'FCM-' + mongoId.toString() + moment().unix();//generate a new fcmTopic on new login
    let mqttTopic = 'MQTT-' + mongoId.toString() + moment().unix();//generate a new mqttTopic on new login
    req.payload.coordinates = { longitude: parseFloat(req.payload.longitude || 0.0), latitude: parseFloat(req.payload.latitude || 0.0) }
    req.payload.fcmTopic = fcmTopic;
    req.payload.mqttTopic = mqttTopic;
    async.series([
        (cb) => {
            var url = zendesk.config.zd_api_url + '/users.json';
            var dataArr = { "user": { "name": req.payload.name, "email": req.payload.email, "role": 'end-user' } };


            customer.count({ email: req.payload.email, status: { $nin: [4, '4'] }, userType: { $nin: [4] } }, (e, r) => {
                if (e) {
                    logger.error('Error occurred during customer signup (count email): ' + JSON.stringify(e));
                    return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                if (r > 0)
                    return reply({ message: req.i18n.__('postSignUp')['412'] }).code(412);
                zendesk.users.post(dataArr, url, function (err, result) {
                    if (err) {

                    }


                    req.payload.zendeskId = result.user ? result.user.id : "";
                    return cb(null, 'done');
                });

            });
        }, //check if the email is already registered
        (cb) => {
            customer.count({ countryCode: req.payload.countryCode, phone: req.payload.mobile, status: { $nin: [4, '4'] }, userType: { $nin: [4] } }, (e, r) => {
                if (e) {
                    logger.error('Error occurred during customer signup (count phone): ' + JSON.stringify(e));
                    return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                if (r > 0)
                    return reply({ message: req.i18n.__('postSignUp')['413'] }).code(413);
                return cb(null, 'done');
            });
        }, //check if the phone is already registered
        (cb) => {
            let geoip = require('geoip-lite');
            let geoCalcIp = geoip.lookup(req.payload.ipAddress);
            req.payload.registeredFromCity = geoCalcIp ? geoCalcIp.city : "";
            req.payload.ip = {
                address: req.payload.ipAddress ? req.payload.ipAddress : "",
                city: geoCalcIp ? geoCalcIp.city : ""
            };
            req.payload.cityId = '';
            try {
                req.payload.cityId = "";
                req.payload.registeredFromCity = "";
                cities.inZone({ lat: req.payload.latitude || 0, long: req.payload.longitude || 0 }, (err, zone) => {
                    req.payload.cityId = zone ? zone.cities[0].cityId.toString() : "";
                    req.payload.registeredFromCity = zone ? zone.cities[0].cityName : "";
                    return cb(null, 'done');
                });

                // geo.reverse({ lat: req.payload.latitude || 0, lon: req.payload.longitude || 0 }, (err, data) => {

                //     if (data && data[0]) {
                //         req.payload.registeredFromCity = data[0]['city'] ? data[0]['city'] : "";
                //         zones.getCityId({ city: req.payload.registeredFromCity }, (err, zone) => {
                //             req.payload.cityId = zone ? zone.city_ID : "";
                //             return cb(null, 'done');
                //         });
                //         cities.inZone({ lat: req.payload.latitude || 0, long: req.payload.longitude || 0 }, (err, zone) => {
                //             req.payload.cityId = zone ? zone.cities[0].cityId.toString() : "";
                //             req.payload.registeredFromCity = zone ? zone.cities[0].cityName : "";
                //             return cb(null, 'done');
                //         });
                //     } else {
                //         return cb(null, 'done');
                //     }
                // });
                // } else {
                //     return cb(null, 'done');
                // }
                // });
            } catch (e) {
                return cb(null, 'done');
            }
        }, //check if the phone is already registered
        (cb) => {


            req.payload.id = req.auth.credentials._id;
            req.payload.userReferalCode = req.payload.referralCode ? req.payload.referralCode : "";
            req.payload.referralCode = "";
            req.payload.password = Bcrypt.hashSync(req.payload.password, parseInt(config.SaltRounds));//hash the password and store in db
            customer.isExistsWithIdType({ _id: new ObjectID(req.auth.credentials._id) }, (err, isExist) => {
                if (isExist) {
                    req.payload.userType = 3;//user type 3 for update
                    customer.saveDetails(req.payload, (err, result) => {
                        if (err) {
                            logger.error('Error occurred during customer signup (saveDetails 1): ' + JSON.stringify(err));
                            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                        }
                        let id = req.auth.credentials ? req.auth.credentials._id.toString() : result.value._id;
                        req.payload.newUserId = id;
                        updateLogs(id, 1, req.payload, (err, res) => {
                        });//asynchronously update the login status
                        return cb(null, id);
                    });
                } else {
                    req.payload.userType = 1; //user type 1 for insert
                    customer.saveDetails(req.payload, (err, result) => {
                        if (err) {
                            logger.error('Error occurred during customer signup (saveDetails 2): ' + JSON.stringify(err));
                            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                        }
                        let id = result.value._id.toString();
                        req.payload.newUserId = id;

                        updateLogs(id, 1, req.payload, (err, resData) => {

                        });//asynchronously update the login status


                        return cb(null, id);
                    });
                }
            });
        },
        (cb, ID) => {
            verificationCode.saveVerificationCode({
                id: req.auth.credentials._id.toString(),
                email: req.payload.email,
            }, (err, response) => {
                if (err) {
                    logger.error('Error occurred during customer signup (saveVerificationCode): ' + JSON.stringify(err));
                    return reply(err);
                }
                return cb(null, ID);
            })
        },
        (cb, ID) => {
            appConfig.get({}, (err, appConfig) => {
                if (err) {
                    logger.error('Error occurred during customer signup (get): ' + JSON.stringify(err));
                    return reply(err);
                }
                return cb(null, appConfig);
            })
        }
    ], (err, results) => {
        if (err)
            return reply(err);
        let accessTokenExp = 604800;//7days 

        if (results) {
            accessTokenExp = results.securitySettings ? parseInt(results.securitySettings.accessToken) : accessTokenExp;
        }
        if (config.mailGunService == "true" || config.mailGunService == true) {
            email.getTemplateAndSendEmail({
                templateName: 'customerNewSignup.html',
                toEmail: req.payload.email,
                subject: 'Welcome to ' + config.appName + '!',
                trigger: 'Customer New Registration',
                keysToReplace: { username: req.payload.name.charAt(0).toUpperCase() + req.payload.name.slice(1), appName: config.appName }
            }, () => {
            });
        }
        referralCampaigns.referralCodeHandler({
            userId: req.payload.newUserId.toString(),
            userType: 1,
            firstName: req.payload.name,
            lastName: "",
            email: req.payload.email,
            countryCode: req.payload.countryCode,
            phoneNumber: req.payload.mobile,
            referralCode: req.payload.userReferalCode ? req.payload.userReferalCode : "",
            currencySymbol: req.payload.currencySymbol ? req.payload.currencySymbol : "",
            currency: req.payload.currency ? req.payload.currency : "",
            cityId: req.payload.cityId,
            zoneId: req.payload.zoneId
        }, (err, doc) => { });

        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['200'])[req.headers.language] }).code(200);
        // userList.createUser(req.payload.newUserId, req.payload.name, "", req.payload.pushToken || "", req.payload.profilePic || "",
        //     req.payload.countryCode + req.payload.mobile, 1, req.payload.fcmTopic, req.payload.mqttTopic);
        let authToken = Auth.SignJWT({ _id: req.payload.newUserId.toString(), key: 'acc', deviceId: req.payload.deviceId }, 'customer', accessTokenExp);//sign a new JWT
        let mongoId = new ObjectID();

        if (config.salesforceService) {
            // Calling Salesforce Api  
            var data = req.payload;

            var dob = '01/01/1990';
            if (data.dateOfBirth) {
                dob = moment(data.dateOfBirth).format('MM/DD/YYYY')
            }
            var createdD = moment().format('YYYY-MM-DD HH:mm:ss');
            var dType = "";
            if (data.deviceType == 1) {
                dType = "IOS";
            }
            else if (data.deviceType == 2) {
                dType = "Android";
            }
            sf.login(() => { });
            var authData = sf.get();
            var bodyData = {
                "mongoId": data.newUserId.toString(),
                "deviceName": dType,
                "name": data.name ? data.name : "",
                "email": data.email ? data.email : "",
                "password": data.password ? data.password : "",
                "countryCode": data.countryCode ? data.countryCode : "",
                "phone": data.mobile ? data.mobile : "",
                "userType": "Customer",
                "birthdate": dob,
                "status": "New",
                "picURL": data.profilePic ? data.profilePic : "",
                "tAndC": true,
                "walletBalance": "0",
                "walletBlock": "0",
                "walletHardLimit": "0",
                "walletSoftLimit": "0",
                "deviceType": dType,
                "deviceId": data.deviceId ? data.deviceId : "",
                "appVersion": data.appVersion ? data.appVersion : "",
                "currentlyActive": data.currentlyActive ? data.currentlyActive : true,
                "deviceOsVersion": data.deviceOsVersion ? data.deviceOsVersion : "",
                "createdDateAndTime": createdD ? createdD : "",
                //"createdBy":,
                "emailVerified": data.emailVerified ? data.emailVerified : true,
                "mobileVerified": data.mobileVerified ? data.mobileVerified : true,
                "registeredFromCity": data.registeredFromCity ? data.registeredFromCity : "",
                "socialMediaId": data.socialMediaId ? data.socialMediaId : "",
                //"lastLogin": data.lastLogin ? data.lastLogin : "" 
                "lastLoginTime": createdD ? createdD : ""

            }
            if (authData) {
                superagent
                    .post(authData.instanceUrl + '/services/apexrest/delivx/Contact')
                    .send(bodyData) // sends a JSON post body
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Bearer ' + authData.accessToken)
                    .end((err, res) => {
                        if (err) {
                            logger.warn('Signup customer sent to salesforece failed', err)
                        }
                        else {
                            logger.info('Signup new customer sent to salesforece success')
                        }
                    });
            }

            // end salesforce api
        }
        return reply({
            message: req.i18n.__('genericErrMsg')['200'],
            data: {
                token: authToken,
                sid: req.payload.newUserId.toString(),
                mobile: req.payload.mobile,
                countryCode: req.payload.countryCode,
                email: req.payload.email,
                // referralCode: customer.referralCode,
                name: req.payload.name ? req.payload.name : "",
                fcmTopic: fcmTopic,
                mqttTopic: mqttTopic,
                mmjCard: { url: req.payload.mmjCard ? req.payload.mmjCard : "", verified: false },
                identityCard: { url: req.payload.identityCard ? req.payload.identityCard : "", verified: false },
                requester_id: req.payload.zendeskId || "",
            }
        }).code(200);

    });
}

/** 
 * @function
 * @name updateLogs
 * @param {string} id - customer id.
 * @param {string} userType - customer or guest
 * @param {object} data - data coming from req.payload
 */
function updateLogs(id, userType, data, callback) {
    data.id = id
    data.userType = userType
    data.userTypeMsg = 'Customer';
    mobileDevices.updateMobileDevices(data, (err, result) => {
        if (err) {
            logger.error('Error occurred during customer signup (updateMobileDevices): ' + JSON.stringify(err));
            return callback('Error updating customer signin status');
        }
        customer.updateDeviceLog(data, (err, result) => {
            if (err) {
                logger.error('Error occurred during customer signup (updateDeviceLog): ' + JSON.stringify(err));
                return callback('Error updating customer signin status');
            }
            logger.info('==salesforce=', config.salesforceService);
            if (config.salesforceService) {
                // Calling Salesforce Api 
                var dob = '01/01/1990';
                if (data.dateOfBirth) {
                    dob = moment(data.dateOfBirth).format('MM/DD/YYYY')
                }
                var createdD = moment().format('YYYY-MM-DD HH:mm:ss');
                var dType = "";
                if (data.deviceType == 1) {
                    dType = "IOS";
                }
                else if (data.deviceType == 2) {
                    dType = "Android";
                }
                sf.login(() => { });
                var authData = sf.get();
                var bodyData = {
                    "mongoId": data.newUserId.toString(),
                    "deviceName": dType,
                    "name": data.name ? data.name : "",
                    "email": data.email ? data.email : "",
                    "password": data.password ? data.password : "",
                    "countryCode": data.countryCode ? data.countryCode : "",
                    "phone": data.mobile ? data.mobile : "",
                    "userType": "Customer",
                    "birthdate": dob,
                    "status": "New",
                    "picURL": data.profilePic ? data.profilePic : "",
                    "tAndC": true,
                    "walletBalance": "0",
                    "walletBlock": "0",
                    "walletHardLimit": "0",
                    "walletSoftLimit": "0",
                    "deviceType": dType,
                    "deviceId": data.deviceId ? data.deviceId : "",
                    "appVersion": data.appVersion ? data.appVersion : "",
                    "currentlyActive": data.currentlyActive ? data.currentlyActive : true,
                    "deviceOsVersion": data.deviceOsVersion ? data.deviceOsVersion : "",
                    "createdDateAndTime": createdD ? createdD : "",
                    //"createdBy":,
                    "emailVerified": data.emailVerified ? data.emailVerified : true,
                    "mobileVerified": data.mobileVerified ? data.mobileVerified : true,
                    "registeredFromCity": data.registeredFromCity ? data.registeredFromCity : "",
                    "socialMediaId": data.socialMediaId ? data.socialMediaId : "",
                    //"lastLogin": data.lastLogin ? data.lastLogin : "" 
                    "lastLoginTime": createdD ? createdD : ""

                }
                if (authData) {
                    superagent
                        .post(authData.instanceUrl + '/services/apexrest/delivx/Contact')
                        .send(bodyData) // sends a JSON post body
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authData.accessToken)
                        .end((err, res) => {
                            if (err) {
                                sf.login(() => {
                                    var authData = sf.get();
                                    if (authData) {
                                        superagent
                                            .post(authData.instanceUrl + '/services/apexrest/delivx/Contact')
                                            .send(bodyData) // sends a JSON post body
                                            .set('Accept', 'application/json')
                                            .set('Authorization', 'Bearer ' + authData.accessToken)
                                            .end((err, res) => {
                                                if (err) {
                                                    logger.warn('Signup customer sent to salesforece failed', err)
                                                } else {
                                                    logger.info('Signup new customer sent to salesforece success')
                                                }
                                            });
                                    }
                                });

                            }
                            else {
                                logger.info('Signup new customer sent to salesforece success')
                            }
                        });
                }

                // end salesforce api
            }
            return callback(null, result.lastErrorObject.updatedExisting);
        });
    });

}


/**
* A module that exports business get store handler! 
* @exports handler 
*/
module.exports = { handler }