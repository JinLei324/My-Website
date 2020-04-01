
'use strict';

const Joi = require('joi');
const logger = require('winston');
const ObjectID = require('mongodb').ObjectID;
var moment = require('moment');
var async = require("async");
const wallet = require('../../models/wallet');
const cities = require('../../models/cities');
var notifications = require('../../library/fcm');
var notifyi = require('../../library/mqttModule');
const i18n = require('../../locales/locales');
var config = process.env;
// const emailModuleCommon = require('../../web/commonModels/email/common')
var _ = require('lodash');
// const emailModuleCustomer = require('../../web/commonModels/email/customer');
// const emailModuleProvider = require('../../web/commonModels/email/provider');

/* 
 *  
 Params = {
 userId,                UserId for(master,slave,operator,inst,instU)REQUIRED
 trigger,               ADMIN/TRIP/PROMO/REFREL                     REQUIRED
 comment,               description of transction                   REQUIRED
 currency,              currency                                    REQUIRED
 currencySymbol,        currencySymbol                              REQUIRED
 txnType,               transction type(1-Credit, 2-Debit)          REQUIRED
 amount,                transction amount                           REQUIRED
 paymentTypeText,           CARD/CASH/WALLET                            REQUIRED
 tripId,                Booking ID                                  OPTIONAL
 paymentTxtId,          PAYMENT GATEWAY TRANSCTION ID               OPTIONAL
 initiatedBy            Transction done by(ADMIN NAME)              OPTIONAL
 bookingTypeText            Booking Type(RIDE/DELIVERY/SERVICE)              OPTIONAL
 userType               USER TYPE(1-MASTER, 2-SLAVE, 3-OPERATOR , 4-APP, 5-PG)              REQUIRED
 cashCollected          cashCollected                               OPTIONAL
 }
 */

const walletTransction = (params, callback) => {

    params.paymentTxtId = (typeof params.paymentTxtId == "undefined" || params.paymentTxtId == "") ? "N/A" : params.paymentTxtId;
    params.initiatedBy = (typeof params.initiatedBy == "undefined" || params.initiatedBy == "") ? "N/A" : params.initiatedBy;
    params.tripId = (typeof params.tripId == "undefined" || params.tripId == "") ? "N/A" : params.tripId;
    params.bookingTypeText = (typeof params.bookingTypeText == "undefined" || params.bookingTypeText == "") ? "N/A" : params.bookingTypeText;
    params.cashCollected = (typeof params.cashCollected == "undefined" || params.cashCollected == "") ? "0" : params.cashCollected;
    params.serviceTypeText = (typeof params.serviceTypeText == "undefined" || params.serviceTypeText == "") ? "N/A" : params.serviceTypeText

    let walletCollection = "", userCollection = "", txnType = "";
    let userId = params.userId || "";

    switch (parseInt(params.userType)) {
        case 1: // customer
            walletCollection = "walletCustomer";
            userCollection = "customer";
            break;
        case 2: // driver
            walletCollection = "walletDriver";
            userCollection = "driver";
            break;
        case 3: // store
            walletCollection = "walletStore";
            userCollection = "stores";
            break;
        case 4: // app
            walletCollection = "walletApp";
            userCollection = "";
            break;
        case 5: // payment gateway
            walletCollection = "walletPg";
            userCollection = "";
            break;
        // case 6:
        //     walletCollection = "walletInstitutions";
        //     userCollection = "institutions";
        //     break;
        // case 7:
        //     walletCollection = "walletInstitutionUser";
        //     userCollection = "institutionUser";
        //     break;
        default:
            return callback({ code: 405, message: "Invalid User Type" });
            break;
    }

    // if (walletCollection == "")
    //     callback({ code: 405, message: "Invalid User Type" });

    const txnId = walletCollection.substring(0, 3).toUpperCase() + "-" + moment().unix() + "-" + Math.random();


    // 1: credit, 2:debit, 4:payment, 5:earning
    switch (parseInt(params.txnType)) {
        case 1:
            txnType = "CREDIT";
            params.amount = Math.abs(parseFloat(params.amount));
            break;
        case 2:
            txnType = "DEBIT";
            params.amount = Math.abs(parseFloat(params.amount)) * -1;
            break;
        case 3:
            txnType = "CREDIT FOR COLLECTION";
            // params.amount = Math.abs(parseFloat(params.amount)) * -1;
            params.amount = Math.abs(parseFloat(params.amount));
            break;
        case 4:
            txnType = "PAYMENT";
            params.amount = parseFloat(params.amount);
            break;
        case 5:
            txnType = "APP EARNING";
            params.amount = parseFloat(params.amount);
            break;
        default:
            callback({ code: 405, message: "Invalid Transaction Type" });
            break;
    }

    params.txnTypeTxt = txnType;

    let closingBal = 0, finalClosingBal = 0;

    wallet.SelectWIthLimitSortSkip(walletCollection, { 'userId': userId }, { '_id': -1 }, 1, 0, function (err, waletData) {

        if (err) {


            callback({ code: 500, message: "internal server error" });
        } else {

            if (waletData.length === 0)
                closingBal = 0;
            else
                closingBal = waletData[0].closingBal || 0;

            finalClosingBal = parseFloat(closingBal) + parseFloat(params.amount);

            if (params.calculateClosingBalance == 0)
                finalClosingBal = closingBal;

            var walletData = {
                test: true,
                txnId: txnId,
                userId: userId,
                txnType: txnType,
                trigger: params.trigger,
                comment: params.comment || '',
                cityId: params.cityId || '',
                currency: params.currency || '',
                currencyAbbr: params.currencyAbbr || 1,
                currencySymbol: params.currencySymbol || '',
                orderId: params.orderId,
                // bookingTypeText: params.bookingTypeText || '',
                paymentTypeText: params.paymentTypeText || '',
                cityName: params.cityName || '',
                serviceTypeText: params.serviceTypeText || '',
                paymentTxnId: params.paymentTxtId || '',

                openingBal: parseFloat((closingBal || 0).toFixed(2)),
                amount: parseFloat((params.amount || 0).toFixed(2)),
                closingBal: parseFloat((finalClosingBal || 0).toFixed(2)),

                cashCollected: parseFloat(params.cashCollected),
                intiatedBy: params.initiatedBy,
                timestamp: parseInt(moment().unix()),
                // lastDue: params.lastDue || 0
            }

            wallet.Insert(walletCollection, walletData, function (err, result) {
                if (err)
                    callback({
                        code: 500,
                        message: "Internal Server Erorr"
                    });
                else {
                    if (userCollection != "" && userId != "") {
                        wallet.FINDONEANDUPDATE(
                            userCollection, {
                            query: {
                                '_id': new ObjectID(userId)
                            },
                            data: {
                                $set: {
                                    "wallet.balance": parseFloat((finalClosingBal || 0).toFixed(2))
                                }
                            },
                            options: {
                                upsert: true
                            }
                        },
                            function (err, userCollectionData) {
                                if (err)
                                    callback({
                                        code: 500,
                                        message: "Internal Server Error"
                                    });
                                else {
                                    if ((params.userType == 1 || params.userType == 2 || params.userType == 6) && params.calculateClosingBalance != 0) {
                                        checkIfAnyLimitHit(params, (err, res) => {
                                            if (err)
                                                console.log(err);
                                        });
                                    }
                                    callback(null, txnId);
                                }
                            }); //create a new document if it does not exists & update the balance                        
                    } else
                        callback(null, txnId);
                }
            });
        }
    });

}


/* 
 Params = {
 userId, UserId for(userId for slave, master)REQUIRED
 userType USER TYPE(1-SLAVE, 2-MASTER,3-operators, 6-institutions)        REQUIRED
 }
 */
const checkIfAnyLimitHit = function (params, callback) {

    let userCollection = "";
    let userData = {};
    let cityDetails = {};
    let userCondition = {
        '_id': new ObjectID(params.userId)
    };

    switch (parseInt(params.userType)) {
        case 1: // customer
            userCollection = "customer";
            break;
        case 2: // driver
            userCollection = "driver";
            break;
        case 3: // store
            userCollection = "stores";
            break;
        default:
            return callback({
                code: 405,
                message: "Invalid User Type"
            });
            break;
    }

    const getUserDetail = () => {
        return new Promise((resolve, reject) => {
            wallet.SelectOne(userCollection, userCondition, function (err, user) {
                if (user) {
                    // console.log("user", user)
                    userData = user;
                    return resolve(true);
                } else {
                    return reject({
                        code: 405,
                        message: "user Not Found"
                    })
                }
            });
        });
    }

    const getCityDetail = () => {
        return new Promise((resolve, reject) => {
            cities.readByCityId({
                "cities.cityId": new ObjectID(userData.cityId),
            }, (err, city) => {
                if (city && city.cities) {
                    cityDetails = city.cities[0];
                    return resolve(true);
                } else {
                    return reject({
                        code: 405,
                        message: "City Not Found"
                    })
                }
            })
        });
    }

    const prepareDate = () => {
        return new Promise((resolve, reject) => {

            let walletBalance = userData.wallet.balance || 0;
            let walletHardLimit = 0;
            let walletSoftLimit = 0;
            let walletSoftLimitHit = false;
            let walletHardLimitHit = false;
            let isWalletEnable = false;
            let fcmTopicData = "";
            let mqttTopicData = "";

            switch (parseInt(params.userType)) {
                case 1:
                    walletHardLimit = cityDetails.customerWalletLimits.hardLimitForCustomer || 0;
                    walletSoftLimit = cityDetails.customerWalletLimits.softLimitForCustomer || 0;
                    fcmTopicData = userData.fcmTopic;
                    mqttTopicData = userData.mqttTopic;
                    if (userData.wallet.isEnabled && userData.wallet.isEnabled == true && userData.accountType == 2) {
                        isWalletEnable = true;
                    }

                    break;
                case 2:
                    isWalletEnable = true;
                    fcmTopicData = userData.pushToken;
                    mqttTopicData = userData.listner;
                    walletHardLimit = cityDetails.driverWalletLimits.hardLimitForDriver || 0;
                    walletSoftLimit = cityDetails.driverWalletLimits.softLimitForDriver || 0;
                    break;
                default:
                    break;
            }

            if (userData.language) {
                i18n.setLocale(userData.language);
            }
            if (userData.wallet.hardLimit && userData.wallet.hardLimit != 0) {
                walletHardLimit = userData.wallet.hardLimit;
            }
            if (userData.wallet.softLimit && userData.wallet.softLimit != 0) {
                walletSoftLimit = userData.wallet.softLimit;
            }
            if (walletBalance <= walletSoftLimit)
                walletSoftLimitHit = true;
            if (walletBalance <= walletHardLimit)
                walletHardLimitHit = true;
            let walletDataUpdate = {
                'wallet.softLimitHit': walletSoftLimitHit,
                'wallet.hardLimitHit': walletHardLimitHit
            }
            let limitData = {
                'status': 33,
                'title': i18n.__(i18n.__('wallet')['title'], config.appName),
                'message': i18n.__('wallet')['outOfSoft'],
            };
            let isAnyLimitHit = 0;
            if (walletSoftLimitHit && !walletHardLimitHit) {
                // update soft limit true and hard limit false update in db
                if (userData.wallet.softLimitHit != walletSoftLimitHit) {
                    limitData = {
                        'status': 31,
                        'title': i18n.__(i18n.__('wallet')['title'], config.appName),
                        'message': i18n.__('wallet')['softHit']
                    };
                    isAnyLimitHit = 1;
                } else if (userData.wallet.hardLimitHit != walletHardLimitHit) {
                    limitData = {
                        'status': 34,
                        'title': i18n.__(i18n.__('wallet')['title'], config.appName),
                        'message': i18n.__('wallet')['outOfHard']
                    };
                    isAnyLimitHit = 1;
                }
            } else if (walletHardLimitHit) {
                // update soft limit true and hard limit true update in db
                if (userData.wallet.hardLimitHit != walletHardLimitHit) {
                    limitData = {
                        'status': 32,
                        'title': i18n.__(i18n.__('wallet')['title'], config.appName),
                        'message': i18n.__('wallet')['hardHit']
                    };
                    isAnyLimitHit = 1;
                }
            } else {
                if (userData.wallet.softLimitHit != walletSoftLimitHit) {
                    isAnyLimitHit = 1;
                }
            }
            params.txnTypeTxt = params.txnTypeTxt.toLowerCase() + "ed";
            let amountUpdated = (cityDetails.currencyAbbr == 1) ? cityDetails.currencySymbol + " " + Math.abs(params.amount) : Math.abs(params.amount) + " " + cityDetails.currencySymbol
            let currentBalance = (cityDetails.currencyAbbr == 1) ? cityDetails.currencySymbol + " " + walletBalance : walletBalance + " " + cityDetails.currencySymbol
            let walletDataMsg = {
                status: 30,
                title: i18n.__(i18n.__('wallet')['title'], config.appName),
                message: i18n.__(i18n.__('wallet')['walletTransaction'], i18n.__('wallet')[params.txnTypeTxt], amountUpdated, currentBalance),
                wallet: {
                    currencyAbbr: cityDetails.currencyAbbr || 1,
                    currencySymbol: cityDetails.currencySymbol,
                    isEnabled: isWalletEnable,
                    isWalletEnable: isWalletEnable,
                    walletBalance: walletBalance || 0,
                    walletSoftLimit: parseFloat(walletSoftLimit),
                    walletHardLimit: parseFloat(walletHardLimit)
                }
            };

            if (params.walletAction !== 2 && typeof params.walletAction != 'undefined') { //action wallet enable or disable
                let walletActionPushData = {
                    user: userData._id.toString(),
                    fcmTopic: fcmTopicData,
                    action: 1,
                    pushType: 1,
                    title: i18n.__(i18n.__('wallet')['title'], config.appName),
                    msg: (params.walletAction) ? (i18n.__('wallet')['walletEnabed']) : (i18n.__('wallet')['walletDisabled']),
                    deviceType: userData.mobileDevices.deviceType || 1
                }
                notifications.notifyFcmTopic(walletActionPushData, (e, r) => { });
            }

            notifyi.notifyRealTime({
                'listner': mqttTopicData,
                message: walletDataMsg,
                qos: 2
            });
            if (([1, 2, 3, 4].includes(parseInt(params.txnType))) && params.trigger != "WALLET RECHARGE") {
                let walletPushData = {
                    user: userData._id.toString(),
                    fcmTopic: fcmTopicData,
                    action: 1,
                    pushType: 1,
                    title: walletDataMsg.title,
                    msg: walletDataMsg.message,
                    data: {},
                    deviceType: userData.mobileDevices.deviceType || 1
                }
                notifications.notifyFcmTopic(walletPushData, (e, r) => { });

                let dataForEmail = {
                    "trigger": params.trigger,
                    "comment": params.comment,
                    "currency": params.currency,
                    "currencySymbol": params.currencySymbol,
                    "amount": Math.abs(params.amount).toFixed(2),
                    "txnTypeTxt": _.capitalize(params.txnTypeTxt),
                    "name": userData.firstName + ' ' + userData.lastName,
                    "email": userData.email
                }
                // emailModuleCommon.walletTransaction(dataForEmail);
            }
            wallet.Update(userCollection, userCondition, walletDataUpdate, function (err, res) {
                if (err) {
                    return reject(err);
                } else {
                    if (isAnyLimitHit != 0) {
                        if (params.userType == 1 || params.userType == 2) {
                            let pushData = {
                                user: userData._id.toString(),
                                fcmTopic: fcmTopicData,
                                action: 1,
                                pushType: 1,
                                title: limitData.title,
                                msg: limitData.message,
                                data: limitData,
                                deviceType: userData.mobileDevices.deviceType || 1
                            }
                            if (fcmTopicData && fcmTopicData != "") {
                                notifications.notifyFcmTopic(pushData, (e, r) => { });
                            }
                            if (mqttTopicData && mqttTopicData != "") {
                                notifyi.notifyRealTime({
                                    'listner': mqttTopicData,
                                    message: limitData,
                                    qos: 2
                                });
                            }
                        }
                        if (params.userType == 1 && limitData.status == 32) {
                            // emailModuleCustomer.hardLimitHit(userData);
                        }
                        if (params.userType == 2 && limitData.status == 32) {
                            // emailModuleProvider.hardLimitHit(userData);
                        }
                    }
                    return resolve(true);
                }
            });
        });
    }

    getUserDetail()
        .then(getCityDetail)
        .then(prepareDate)
        .then(data => {
            return callback(null, {
                code: 200,
                message: 'success',
                data: data
            });
        }).catch(e => {
            return callback(e);
        });
}


/* 
 Params = {
 userId,         UserId for(userId for slave, master)REQUIRED
 amount,         amount                              REQUIRED
 userType        USER TYPE(1-SLAVE, 2-MASTER)        REQUIRED
 }
 */
const checkIfAnyLimitHitWithAmount = function (params, callback) {

    let userCollection = "";
    let userData = {};
    let cityDetails = {};

    switch (parseInt(params.userType)) {
        case 1:
            userCollection = "customer";
            break;
        case 2:
            userCollection = "driver";
            break;
        case 3:
            userCollection = "stores";
            break;
        case 6:
            userCollection = "institutions";
            break;
        default:
            return callback({
                code: 405,
                message: "Invalid User Type"
            });
            break;
    }

    const getUserDetail = () => {
        return new Promise((resolve, reject) => {
            wallet.SelectOne(userCollection, {
                '_id': new ObjectID(params.userId)
            }, function (err, user) {
                if (user) {
                    userData = user;
                    return resolve(true);
                } else {
                    return reject({
                        code: 405,
                        message: "user Not Found"
                    })
                }
            });
        });
    }

    const getCityDetail = () => {
        return new Promise((resolve, reject) => {
            cities.readByCityId({
                "cities.cityId": new ObjectID(userData.cityId),
            }, (err, city) => {
                if (city && city.cities) {
                    cityDetails = city.cities[0];
                    return resolve(true);
                } else {
                    return reject({
                        code: 405,
                        message: "City Not Found"
                    })
                }
            })
        });
    }

    const prepareDate = () => {
        return new Promise((resolve, reject) => {

            let walletBalance = userData.wallet.balance || 0;
            let walletHardLimit = 0;
            let walletSoftLimit = 0;
            let walletSoftLimitHit = false;
            let walletHardLimitHit = false;

            switch (parseInt(params.userType)) {
                case 1:
                    walletHardLimit = cityDetails.customerWalletLimits.hardLimitForCustomer || 0;
                    walletSoftLimit = cityDetails.customerWalletLimits.softLimitForCustomer || 0;
                    break;
                case 2:
                    walletHardLimit = cityDetails.customerWalletLimits.hardLimitForDriver || 0;
                    walletSoftLimit = cityDetails.customerWalletLimits.softLimitForDriver || 0;
                    break;
                default:
                    break;
            }

            if (userData.wallet.hardLimit && userData.wallet.hardLimit != 0) {
                walletHardLimit = userData.wallet.hardLimit;
            }
            if (userData.wallet.softLimit && userData.wallet.softLimit != 0) {
                walletSoftLimit = userData.wallet.softLimit;
            }


            if (walletBalance - params.amount <= walletSoftLimit)
                walletSoftLimitHit = true;
            if (walletBalance - params.amount <= walletHardLimit)
                walletHardLimitHit = true;

            let responce = {
                previosHardLimiHit: userData.wallet.hardLimitHit,
                previosSoftLimit: userData.wallet.softLimitHit,
                newSoftLimitHit: walletSoftLimitHit,
                newHardLimitHit: walletHardLimitHit
            }
            return resolve(responce);
        });
    }

    getUserDetail()
        .then(getCityDetail)
        .then(prepareDate)
        .then(data => {
            return callback(null, {
                code: 200,
                message: 'success',
                data: data
            });
        }).catch(e => {
            return callback(e);
        });
}
module.exports = { walletTransction, checkIfAnyLimitHit, checkIfAnyLimitHitWithAmount };