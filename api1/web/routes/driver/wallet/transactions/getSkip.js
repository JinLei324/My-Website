'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;

const errorMsg = require('../../../../../locales');
const wallet = require('../../../../../models/wallet');

const payloadValidator = Joi.object({
    txnType: Joi.number().required().description('1-Debit,2-credit,3-Both').error(new Error('Transaction type is missing')),
    pageIndex: Joi.number().required().description('0-ddefault').error(new Error('pageIndex is missing'))
}).required();

const APIHandler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    let limit = 10;
    let skip = 10 * req.params.pageIndex;

    let transctions = [];
    let condition = {};
    let totalCount = 0;

    switch (parseInt(req.params.txnType)) {
        case 1:
            condition = {
                'txnType': 'DEBIT',
                'trigger': { '$nin': ['TRIP CAPTURE BALANCE', 'TRIP REFUND BALANCE'] },
                'userId': req.auth.credentials._id.toString()
            };
            break;
        case 2:
            condition = {
                'txnType': 'CREDIT',
                'trigger': { '$nin': ['TRIP CAPTURE BALANCE', 'TRIP REFUND BALANCE'] },
                'userId': req.auth.credentials._id.toString()
            };
            break;
        case 3:
            condition = {
                $or: [{ txnType: 'DEBIT' }, { txnType: 'CREDIT' }],
                'trigger': { '$nin': ['TRIP CAPTURE BALANCE', 'TRIP REFUND BALANCE'] },
                'userId': req.auth.credentials._id.toString()
            };
            break;
        default:
            break;
    }

    let getCounts = () => {
        return new Promise((resolve, reject) => {
            wallet.Count("walletDriver", condition, function (err, count) {
                if (err) {
                    reject(dbErrResponse);
                } else {
                    totalCount = count;
                    resolve(true);
                }
            });
        });
    };

    let getTransctions = () => {
        return new Promise((resolve, reject) => {
            wallet.SelectWIthLimitSortSkip("walletDriver", condition, { '_id': -1 }, limit, skip, function (err, transction) {
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
                        transctions.push(tra);
                    }
                    resolve(true);
                }
            });
        });
    };





    getCounts()
        .then(getTransctions)
        .then(data => {
            let responce = {
                totalCount: totalCount,
                transctions: transctions,
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