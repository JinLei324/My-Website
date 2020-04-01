'use strict';

const Joi = require('joi');
const logger = require('winston');
const async = require('async');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;

const payoff = require('../../../models/payoff');
const bookingsPast = require('../../../models/bookingsPast');
const stripeTransaction = require('../../commonModels/stripe/stripeTransaction');
const wallet = require('../../../worker/wallet/wallet');

const errorMsg = require('../../../locales');

const payload = Joi.object({
    userId: Joi.string().description('City Array'),
    userType: Joi.number().allow([2, 3,]).description('User Type'),
    amount: Joi.any().description('User Type'),
    comment: Joi.string().description('User Type'),
    chargeBy: Joi.number().allow([1, 2]).description('1- bank, 2- cash'),
    initiatedBy: Joi.string().default('Admin').description('Initiator UserName')
}).required();

const params = Joi.object({

}).required();

const handler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };
    
    const getUserCollection = () => {
        return new Promise((resolve, reject) => {
            let userCollection = "";
            switch (parseInt(req.payload.userType)) {
                case 2:
                    userCollection = "masters";
                    break;
                case 3:
                    userCollection = "operators";
                    break;
                default:
                    return reject(dbErrResponse);
                    break;
            }
            return resolve(userCollection);
        });
    };

    const getUserData = (userCollection) => {
        return new Promise((resolve, reject) => {
            if (userCollection == '') {
                return reject(dbErrResponse);
            } else {
                let queryObj = { "_id": new ObjectID(req.payload.userId) };
                payoff.read(userCollection, queryObj)
                    .then((data) => {
                        return resolve(data);
                    }).catch((err) => {
                        return reject(dbErrResponse);
                    });
            }
        });
    };

    const payToDriver = (userData) => {
        return new Promise((resolve, reject) => {
            if (req.payload.chargeBy == 1) {
                stripeTransaction.transferToConnectAccount(req, userData._id.toString(), req.payload.amount, userData.currency)
                    .then((data) => {
                        userData.message = 'Payment Success';
                        userData.txnId = data.data.id;
                        city.successPayment.push(userData);
                        let txnObj = {
                            userId: userData._id.toString(),
                            trigger: "ADMIN",
                            comment: "Payoff from Admin",
                            currency: userData.currency,
                            currencySymbol: userData.currencySymbol,
                            txnType: 2,
                            amount: req.payload.amount,
                            paymentTypeText: "BANK",
                            paymentTxtId: userData.txnId,
                            initiatedBy: req.payload.initiatedBy,
                            userType: req.payload.userType
                        };
                        wallet.walletTransction(txnObj, function (err, data) {
                            txnObj.userId = 1;
                            txnObj.userType = 4;
                            wallet.walletTransction(txnObj, function (err, data) {
                                return resolve(true);
                            });
                        });
                    }).catch((err) => {
                        return reject(dbErrResponse);
                    })
            } else {
                let txnObj = {
                    userId: userData._id.toString(),
                    trigger: "ADMIN",
                    comment: "Payoff from Admin",
                    currency: userData.currency,
                    currencySymbol: userData.currencySymbol,
                    txnType: 2,
                    amount: req.payload.amount,
                    paymentTypeText: "Cash",
                    paymentTxtId: "",
                    initiatedBy: req.payload.initiatedBy,
                    userType: req.payload.userType
                };
                wallet.walletTransction(txnObj, function (err, data) {
                    txnObj.userId = 1;
                    txnObj.userType = 4;
                    wallet.walletTransction(txnObj, function (err, data) {
                        return resolve(true);
                    });
                });
            }
        });
    };

    getUserCollection()
        .then(getUserData)
        .then(payToDriver)
        .then((data) => {
            return reply({ message: req.i18n.__('genericErrMsg')['200'], data: data }).code(200);
        }).catch((e) => {
            logger.error("payoff API error =>", e)
            return reply({ message: e.message }).code(e.code);
        });
};

const response = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: {
            message: Joi.any().default(errorMsg['genericErrMsg']['200']),
            data: Joi.any()
        }
    }
}//swagger response code

module.exports = {
    payload,
    params,
    handler,
    response
};