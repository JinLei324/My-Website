'use strict';

const Joi = require('joi');
const logger = require('winston');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');

// const configuration = require('../../../../../configuration');
const config = require('../../../../config');
const errorMsg = require('../../../../locales');
const stripe = require('../../../commonModels/stripe/stripeTransaction');
const transcation = require('../../../commonModels/wallet/transcation');
const cities = require('../../../../models/cities');

const payloadValidator = Joi.object({
    cardId: Joi.string().required().description('cardId').error(new Error('cardId is missing')),
    amount: Joi.number().required().description('amount').error(new Error('amount is missing')),
}).required();

const APIHandler = (req, reply) => {
    logger.error(req.payload)
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };
    let userData = req.user;
    let chargeId = "";
    let pgComm = (req.payload.amount * (2.9 / 100)) + 0.3;
    let cityDetails = {};
    let walletResponce = {};

    let getCityDetail = () => {
        return new Promise((resolve, reject) => {
            cities.isExists({ _id: userData.cityId ? new ObjectID(userData.cityId) : "" }, (err, cityDetail) => {
                if (cityDetail) {
                    cityDetails = cityDetail.cities[0];
                    resolve(true);
                } else {
                    resolve(true);
                }
            });
        });
    }

    let createChargeForWalletRecharge = () => {
        return new Promise((resolve, reject) => {
            stripe.createAndCaptureCharge(
                req,
                req.auth.credentials._id,
                req.payload.cardId,
                req.payload.amount,
                cityDetails.currency,
                'wallet Recharge - ' + req.payload.amount,
                {
                    customerId: req.auth.credentials._id,
                    bookingId: 0,
                    customerName: userData.firstName,
                    customerPhone: userData.countryCode + userData.mobile
                }
            ).then(res => {
                chargeId = res.data.id;
                resolve(true);
            }).catch(e => {
                return reject({ message: e.message, code: 410 });
            }); //create a charge on the customers card(captured) and log the chargeId
        });
    };

    let walletEntryForWalletRecharge = () => {
        return new Promise((resolve, reject) => {
            let data = {
                bookingId: 0,
                userId: req.auth.credentials._id.toString(),
                amount: req.payload.amount,
                appEarning: 0,
                chargeId: chargeId,
                pgComm: pgComm,
                providerEarning: 0,
                paymentType: 'CARD',
                currency: cityDetails.currency,
                currencySymbol: cityDetails.currencySymbol,
                currencyAbbr: userData.currencyAbbr || 1,
                cityId: userData.cityId ? userData.toString() : "",
                serviceTypeText: '',
                bookingTypeText: '',
                paymentTypeText: 'WALLET',
                cityName: userData.cityName || ''
            }
            transcation.rechargeWalletForDriver(data, (err, res) => {
            });
            resolve(true);
        });
    };

    let generateResponce = () => {
        return new Promise((resolve, reject) => {
            let isWalletEnable = false;
            if (userData.wallet && userData.wallet.isEnabled && userData.wallet.isEnabled == true) {
                isWalletEnable = true;
            }
            let hardLimit = cityDetails.customerWalletLimits && cityDetails.customerWalletLimits.hardLimitForCustomer || 0;
            if (userData.wallet && userData.wallet.hardLimit && userData.wallet.hardLimit > 0) {
                hardLimit = userData.wallet.hardLimit;
            }

            let softLimit = cityDetails.customerWalletLimits && cityDetails.customerWalletLimits.softLimitForCustomer || 0;
            if (userData.wallet && userData.wallet.softLimit && userData.wallet.softLimit > 0) {
                softLimit = userData.wallet.softLimit;
            }
            walletResponce = {
                "currencySymbol": cityDetails.currencySymbol,
                "currencyAbbr": cityDetails.currencyAbbr,
                'isWalletEnable': isWalletEnable,
                'walletBalance': userData.wallet ? parseFloat(userData.wallet.balance) - parseFloat(userData.wallet.blocked) + (parseFloat(req.payload.amount)) : 0,
                'softLimit': softLimit,
                'hardLimit': hardLimit
            };
            resolve(true);
        });
    };

    getCityDetail()
        .then(createChargeForWalletRecharge)
        .then(walletEntryForWalletRecharge)
        .then(generateResponce)
        .then(data => {
            return reply({ message: req.i18n.__(req.i18n.__('genericErrMsg')['200'], config.appName, cityDetails.currencySymbol + " " + req.payload.amount), data: { 'walletData': walletResponce } }).code(200);
        }).catch(e => {
            logger.error("Customer recharge wallet TIP API error =>", e)
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