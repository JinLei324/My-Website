'use strict'

var vouchers = require('../../../../../models/vouchers');
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Async = require('async');
var voucher_codes = require('voucher-code-generator');
const wallet = require('../../../../../worker/wallet/wallet');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {

    let checkVoucher = () => {
        return new Promise((resolve, reject) => {
            vouchers.checkVoucher({
                $and: [{ expiryDateTimeStamp: { $gt: moment().unix() } },
                { "vouchersList": { $elemMatch: { name: request.payload.voucherCode, status: 1 } } }]
            }, (err, result) => {
                if (err) {
                    logger.error('Error occurred voucher (checkVoucher): ' + JSON.stringify(err));
                    return reject({ message: request.i18n.__('genericErrMsg')['500'], code: 500 });
                }
                if (result) {
                    logger.warn('valid', result)
                    return resolve(result);
                } else {
                    logger.warn('expired')
                    return reject({ message: request.i18n.__('vouchers')['404'], code: 404 });
                }

            });
        });
    }
    let walletData = {};
    let redeemCode = (data) => {
        return new Promise((resolve, reject) => {
            vouchers.redeemCode({
                query: {
                    expiryDateTimeStamp: { $gt: moment().unix() },
                    "vouchersList.name": request.payload.voucherCode,
                    "vouchersList.status": 1
                },
                data: {
                    $set: {
                        "vouchersList.$.status": 2,
                        "vouchersList.$.statusMsg": 'Redeemed'
                    },
                    $push: {
                        "vouchersList.$.actions": {
                            redeemedBy: request.auth.credentials._id.toString(),
                            redeemedByName: request.user.name,
                            redeemedOn: moment().unix()
                        }
                    }
                },
                options: { returnOriginal: false }
            }, (err, result) => {
                if (err) {
                    logger.error('Error occurred voucher (redeemCode): ' + JSON.stringify(err));
                    return reject({ message: request.i18n.__('genericErrMsg')['500'], code: 500 });
                }
                walletData.amount = result.value.value;
                walletData.userType = 1;
                walletData.trigger = "Vouchers";
                walletData.txnType = 1;
                walletData.comment = 'Redeem voucher';
                walletData.paymentType = 'voucher';
                walletData.initiatedBy = 'Customer';
                walletData.userId = request.auth.credentials._id.toString();
                walletData.currency = request.user.currency;
                walletData.currencySymbol = request.user.currencySymbol;
                walletData.cityName = request.user.cityName;
                walletData.email = request.user.email;
                walletData.name = request.user.name;
                walletData.calculateClosingBalance = 1;
                return resolve(result);
            });
        });
    }
    let updateWallet = (data) => {
        return new Promise((resolve, reject) => {
            wallet.walletTransction(walletData, function (err, data) {
                return resolve(data);
            });
        });
    }
    checkVoucher().then(redeemCode).then(updateWallet).then(data => {
        return reply({
            message: request.i18n.__('vouchers')['200'] + " " + walletData.amount
        }).code(200);
    }).catch(e => {
        logger.error('Error occurred redeem voucher ' + request.auth.credentials.sub + ' (catch): ' + JSON.stringify(e));
        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
        return reply({
            message: e.message
        }).code(e.code);
    });

}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    voucherCode: Joi.string().required().description('code')
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }