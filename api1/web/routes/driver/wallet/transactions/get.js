'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;

const cities = require('../../../../../models/cities');
const errorMsg = require('../../../../../locales');
const wallet = require('../../../../../models/wallet');

const payloadValidator = Joi.object({
    pageIndex: Joi.number().required().description('0-ddefault').error(new Error('pageIndex is missing'))
}).required();

const APIHandler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    let limit = 10;
    let skip = 10 * req.pageIndex;
    let driverData = req.user;
    let debitTransctions = [];
    let creditTransctions = [];
    let creditDebitTransctions = [];
    let cityDetails = {};

    let getCityDetails = () => {
        return new Promise((resolve, reject) => {
            if (driverData.cityId == '') {
                resolve(true);
            } else {
                cities.readByCityId({
                    "cities.cityId": driverData.cityId ? new ObjectID(driverData.cityId) : "",
                }, (err, res) => {
                    if (err) {
                        logger.error(err)
                        return reject(dbErrResponse);

                    }

                    if (res && res.cities) {
                        cityDetails = res.cities[0]
                    }
                    resolve(true);
                })
            }
        });
    };
    let getAllDebitTransctions = () => {
        return new Promise((resolve, reject) => {
            let debitCond = { 'txnType': 'DEBIT', 'userId': req.auth.credentials._id.toString() };
            wallet.SelectWIthLimitSortSkip("walletDriver", debitCond, { '_id': -1 }, limit, skip, function (err, transction) {
                if (err) {
                    reject(dbErrResponse);
                } else {
                    for (var key = 0; key < transction.length; key++) {
                        var tra = {
                            'txnId': transction[key].txnId,
                            'trigger': transction[key].trigger,
                            'txnType': transction[key].txnType,
                            'comment': transction[key].comment,
                            'currencySymbol': transction[key].currencySymbol || '',
                            'currencyAbbr': transction[key].currencyAbbr || 1,
                            'openingBal': transction[key].openingBal,
                            'amount': transction[key].amount,
                            'closingBal': transction[key].closingBal,
                            'paymentTypeText': transction[key].paymentTypeText,
                            'timestamp': transction[key].timestamp,
                            'tripId': transction[key].tripId || ''
                        }
                        debitTransctions.push(tra);
                    }
                    resolve(true);
                }
            });
        });
    };

    let getAllCreditTransctions = () => {
        return new Promise((resolve, reject) => {
            let creditCond = { 'txnType': 'CREDIT', 'userId': req.auth.credentials._id.toString() };
            wallet.SelectWIthLimitSortSkip("walletDriver", creditCond, { '_id': -1 }, limit, skip, function (err, transction) {
                if (err) {
                    reject(dbErrResponse);
                } else {
                    for (var key = 0; key < transction.length; key++) {
                        var tra = {
                            'txnId': transction[key].txnId,
                            'trigger': transction[key].trigger,
                            'txnType': transction[key].txnType,
                            'comment': transction[key].comment,
                            'currencySymbol': transction[key].currencySymbol || '',
                            'currencyAbbr': transction[key].currencyAbbr || 1,
                            'openingBal': transction[key].openingBal,
                            'amount': transction[key].amount,
                            'closingBal': transction[key].closingBal,
                            'paymentTypeText': transction[key].paymentTypeText,
                            'timestamp': transction[key].timestamp,
                            'tripId': transction[key].tripId || ''
                        }
                        creditTransctions.push(tra);
                    }
                    resolve(true);
                }
            });
        });
    };

    let getAllCreditDreditTransctions = () => {
        return new Promise((resolve, reject) => {
            let creditDebitCond = { $or: [{ txnType: 'DEBIT' }, { txnType: 'CREDIT' }], 'userId': req.auth.credentials._id.toString() };
            wallet.SelectWIthLimitSortSkip("walletDriver", creditDebitCond, { '_id': -1 }, limit, skip, function (err, transction) {
                if (err) {
                    reject(dbErrResponse);
                } else {
                    for (var key = 0; key < transction.length; key++) {
                        var tra = {
                            'txnId': transction[key].txnId,
                            'trigger': transction[key].trigger,
                            'txnType': transction[key].txnType,
                            'comment': transction[key].comment,
                            'currencySymbol': transction[key].currencySymbol || '',
                            'currencyAbbr': transction[key].currencyAbbr || 1,
                            'openingBal': transction[key].openingBal,
                            'amount': transction[key].amount,
                            'closingBal': transction[key].closingBal,
                            'paymentTypeText': transction[key].paymentTypeText,
                            'timestamp': transction[key].timestamp,
                            'tripId': transction[key].tripId || ''
                        }
                        creditDebitTransctions.push(tra);
                    }
                    resolve(true);
                }
            });
        });
    };

    getAllDebitTransctions()
        .then(getCityDetails)
        .then(getAllCreditTransctions)
        .then(getAllCreditDreditTransctions)
        .then(data => {


            let hardLimit = cityDetails.driverWalletLimits && cityDetails.driverWalletLimits.hardLimitForDriver || 0;
            if (driverData.wallet && driverData.wallet.hardLimit && driverData.wallet.hardLimit != 0) {
                hardLimit = driverData.wallet.hardLimit;
            }

            let softLimit = cityDetails.driverWalletLimits && cityDetails.driverWalletLimits.softLimitForDriver || 0;
            if (driverData.wallet && driverData.wallet.softLimit && driverData.wallet.softLimit != 0) {
                softLimit = driverData.wallet.softLimit;
            }


            let responce = {
                creditTransctions: creditTransctions,
                debitTransctions: debitTransctions,
                creditDebitTransctions: creditDebitTransctions,
                currencyAbbr: cityDetails.currencyAbbr || 1,
                currencySymbol: cityDetails.currencySymbol ? cityDetails.currencySymbol : "",
                walletBalance: (driverData.wallet && driverData.wallet.balance || 0),
                walletSoftLimit: parseFloat(softLimit),
                walletHardLimit: parseFloat(hardLimit)
            };
            return reply({ message: req.i18n.__('genericErrMsg')['200'], data: responce }).code(200);
        }).catch(e => {
            logger.error("Customer get all wallet transction API error =>", e)
            return reply({ message: e.message }).code(e.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['genericErrMsg']['200']), data: Joi.any() }
    }
}//swagger response code

module.exports = { payloadValidator, APIHandler, responseCode };