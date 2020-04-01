'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;

const errorMsg = require('../../../../locales');
const wallet = require('../../../../models/wallet');

const payloadValidator = Joi.object({
    pageIndex: Joi.number().required().description('0-ddefault').error(new Error('pageIndex is missing'))
}).required();

const APIHandler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    let limit = 10;
    let skip = 10 * req.pageIndex;

    let debitTransctions = [];
    let creditTransctions = [];
    let creditDebitTransctions = [];

    let getAllDebitTransctions = () => {
        return new Promise((resolve, reject) => {
            let debitCond = { 'txnType': 'DEBIT', 'userId': req.auth.credentials._id.toString() };
            wallet.SelectWIthLimitSortSkip("walletCustomer", debitCond, { '_id': -1 }, limit, skip, function (err, transction) {
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
                            'currencyAbbr': parseInt(transction[key].currencyAbbr) || 1,
                            'amount': parseFloat(transction[key].amount),
                            'paymentTypeText': transction[key].paymentTypeText,
                            'txnDate': transction[key].timestamp,
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
            wallet.SelectWIthLimitSortSkip("walletCustomer", creditCond, { '_id': -1 }, limit, skip, function (err, transction) {
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
                            'currencyAbbr': parseInt(transction[key].currencyAbbr) || 1,
                            'amount': parseFloat(transction[key].amount),
                            'paymentTypeText': transction[key].paymentTypeText,
                            'txnDate': transction[key].timestamp,
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

            // {'userId' : '5ac04b686d99ba39de130990'}
            let creditDebitCond = { $or: [{ txnType: 'DEBIT' }, { txnType: 'CREDIT' }], 'userId': req.auth.credentials._id.toString() };
            wallet.SelectWIthLimitSortSkip("walletCustomer", creditDebitCond, { '_id': -1 }, limit, skip, function (err, transction) {
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
                            'currencyAbbr': parseInt(transction[key].currencyAbbr) || 1,
                            'amount': parseFloat(transction[key].amount),
                            'paymentTypeText': transction[key].paymentTypeText,
                            'txnDate': transction[key].timestamp,
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
        .then(getAllCreditTransctions)
        .then(getAllCreditDreditTransctions)
        .then(data => {
            let responce = {
                creditTransctions: creditTransctions,
                debitTransctions: debitTransctions,
                creditDebitTransctions: creditDebitTransctions
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