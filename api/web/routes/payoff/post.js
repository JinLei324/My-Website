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
    city: Joi.array().description('City Array'),
    userType: Joi.number().allow([2, 3]).description('User Type'),
    initiatedBy: Joi.string().default('Admin').description('Initiator UserName')
}).required();

const params = Joi.object({

}).required();

const handler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    // var cityArr = req.payload.city.map((item) => {
    //     return new ObjectID(item);
    // });

    let payoffCollection = "payoff";

    const getUserCollection = () => {
        return new Promise((resolve, reject) => {
            let userCollection = "";
            switch (parseInt(req.payload.userType)) {
                case 2:
                    payoffCollection = "payoffDriver";
                    userCollection = "driver";
                    break;
                case 3:
                    payoffCollection = "payoffOperator";
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
                let queryObj = [
                    {
                        $match: {
                            "wallet.balance": {
                                $ne: 0,
                                $exists: true
                            },
                            "cityId": {
                                $in: req.payload.city
                            }
                        }
                    },
                    {
                        $group: {
                            '_id': "$cityId",
                            users: {
                                $addToSet: {
                                    "id": "$_id",
                                    "currencySymbol": "$currencySymbol",
                                    "currency": "$currency",
                                    "wallet": "$wallet.balance"
                                }
                            }
                        }
                    }
                ];
                payoff.readUserData(userCollection, queryObj)
                    .then((data) => {
                        logger.error('data ', data)
                        return resolve(data);
                    }).catch((err) => {
                        logger.error('readUserData ', err)
                        return reject(dbErrResponse);
                    });
            }
        });
    };

    const payToUser = (cityData) => {
        logger.error(cityData);
        logger.error('cityData');
        return new Promise((resolve, reject) => {
            async.forEachOf(cityData, function (city, ind, callbackloop) {
                city.payable = 0;
                city.successPayment = [];
                city.issuedPayment = [];
                city.cashCollect = 0;
                city.cashCollection = [];
                async.forEach(city.users, function (userData, callbackloopUser) {
                    userData.txnDate = new Date(moment().format("YYYY-MM-DD HH:mm:ss"));
                    if (userData.wallet > 0) {
                        city.payable += userData.wallet;
                        stripeTransaction.transferToConnectAccount(req, userData.id.toString(), userData.wallet, userData.currency)
                            .then((data) => {
                                logger.error('transferToConnectAccount', data)
                                userData.message = 'Payment Success';
                                userData.txnId = data.data.id;
                                city.successPayment.push(userData);
                                let txnObj = {
                                    userId: userData.id.toString(),
                                    trigger: "ADMIN",
                                    comment: "Payoff from Admin",
                                    currency: userData.currency,
                                    currencySymbol: userData.currencySymbol,
                                    txnType: 2,
                                    amount: userData.wallet,
                                    paymentTypeText: "BANK",
                                    paymentTxtId: userData.txnId,
                                    initiatedBy: req.payload.initiatedBy,
                                    userType: req.payload.userType
                                };
                                wallet.walletTransction(txnObj, function (err, data) {
                                    txnObj.userId = 1;
                                    txnObj.userType = 4;
                                    wallet.walletTransction(txnObj, function (err, data) {
                                        return callbackloopUser(null);
                                    });
                                });
                            }).catch((err) => {
                                userData.message = err.message;
                                userData.txnId = '';
                                city.issuedPayment.push(userData);
                                return callbackloopUser(null);
                            })
                    } else {
                        city.cashCollect += Math.abs(userData.wallet);
                        userData.message = 'Cash Collection';
                        userData.txnId = '';
                        city.cashCollection.push(userData);
                        return callbackloopUser(null);
                    }
                }, function (loopErr) {
                    if (loopErr)
                        return callbackloop(err);
                    else {
                        return callbackloop(null);
                    }
                });
            }, function (loopErr) {
                if (loopErr)
                    return reject(dbErrResponse);
                else
                    return resolve(cityData);
            });
        });
    };

    const generateCycle = (cityData) => {
        logger.error('came to generateCycle')
        logger.error('cityData', cityData)
        return new Promise((resolve, reject) => {
            let cityIdArr = [];
            let insObj = {
                cityId: "",
                startDate: "",
                endDate: new Date(moment().format("YYYY-MM-DD HH:mm:ss")),
                userType: parseInt(req.payload.userType),
                trips: 0,
                totalBilling: 0,
                users: 0,
                cashCollect: 0,
                payable: 0,
                usersList: [],
                successPayment: [],
                issuedPayment: [],
                cashCollection: []
            };
            async.forEach(cityData, function (city, callbackloop) {
                let cityCycleData = Object.assign({}, insObj);

                cityCycleData.cityId = new ObjectID(city._id);
                cityCycleData.usersList = city.users;
                cityCycleData.payable = city.payable || 0;
                cityCycleData.successPayment = city.successPayment || [];
                cityCycleData.issuedPayment = city.issuedPayment || [];
                cityCycleData.cashCollect = city.cashCollect || 0;
                cityCycleData.cashCollection = city.cashCollection || [];

                //getting cycle start date
                payoff.aggregate(payoffCollection, [
                    { $match: { cityId: new ObjectID(city._id) } },
                    { $sort: { endDate: -1 } },
                    {
                        $group: {
                            _id: "$cityId",
                            endDate: { $first: "$endDate" }
                        }
                    }
                ]).then((lastCycleData) => {
                    return new Promise((resolve, reject) => {
                        if (lastCycleData.length > 0) {
                            cityCycleData.startDate = new Date(moment(lastCycleData[0].endDate).add(1, 'seconds').format("YYYY-MM-DD HH:mm:ss"));
                        } else {
                            cityCycleData.startDate = "";//new Date(moment().add(-7, 'days').format("YYYY-MM-DD HH:mm:ss"));
                        }
                        return resolve(true);
                    });
                }).then((data) => {
                    // getting trips and drivers list included in cycle
                    return new Promise((resolve, reject) => {
                        let queryCondition = [
                            {
                                $match: {
                                    cityId: new ObjectID(city._id)
                                }
                            },
                            {
                                $group: {
                                    _id: "$driverDetails.driverId",
                                    total: { $sum: '$accouting.total' },
                                    trips: { $sum: 1 }
                                }
                            }
                        ];
                        if (cityCycleData.startDate != "") {
                            queryCondition[0]['$match']["timeStamp.created"] = {
                                $gte: moment(cityCycleData.startDate).unix()
                            };
                        }
                        bookingsPast.aggregate(queryCondition, function (err, res) {
                            logger.error('err', err)
                            logger.error('err');
                            if (res) {
                                logger.error('res', res)
                                logger.error('res');
                                res.map((qryData) => {
                                    if (qryData._id != "")
                                        cityCycleData.users += 1;
                                    cityCycleData.totalBilling += qryData.total;
                                    cityCycleData.trips += qryData.trips;
                                });
                            }
                            return resolve(true);
                        });
                    });
                }).then((data) => {
                    // inserting cycle data
                    payoff.insert(payoffCollection, cityCycleData)
                        .then((insRes) => {
                            cityIdArr.push(city._id);
                            return callbackloop(null);
                        }).catch((err) => {
                            return callbackloop(err);
                        });
                }).catch((err) => {
                    return callbackloop(err);
                });
            }, function (loopErr) {
                if (loopErr)
                    return reject(dbErrResponse);
                else
                    return resolve(cityIdArr);
            });
        });
    };

    getUserCollection()
        .then(getUserData)
        .then(payToUser)
        .then(generateCycle)
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