'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;

const cities = require('../../../../models/cities');
const errorMsg = require('../../../../locales');

const APIHandler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };
    let customerData = req.user;
    let cityDetails = {};

    let getCityDetails = () => {
        return new Promise((resolve, reject) => {
            if (customerData.cityId != '' && customerData.cityId != null) {
                cities.isExists({ "_id": new ObjectID(customerData.cityId) }, (err, res) => {
                    if (err)
                        return reject(dbErrResponse);
                    if (res)
                        cityDetails = res.cities[0];
                    resolve(true);
                })
            } else {
                resolve(true);
            }
        });
    };

    getCityDetails()
        .then((data) => {
            let isWalletEnable = false;
            if (customerData.wallet && customerData.wallet.isEnabled && customerData.wallet.isEnabled == true) {
                isWalletEnable = true;
            }

            let hardLimit = cityDetails.customerWalletLimits && cityDetails.customerWalletLimits.hardLimitForCustomer || 0;
            if (customerData.wallet && customerData.wallet.hardLimit && customerData.wallet.hardLimit != 0) {
                hardLimit = customerData.wallet.hardLimit;
            }

            let softLimit = cityDetails.customerWalletLimits && cityDetails.customerWalletLimits.softLimitForCustomer || 0;
            if (customerData.wallet && customerData.wallet.softLimit && customerData.wallet.softLimit != 0) {
                softLimit = customerData.wallet.softLimit;
            }

            let responce = {
                currencyAbbr: cityDetails.currencyAbbr || 1,
                currencySymbol: cityDetails.currencySymbol,
                isEnabled: isWalletEnable,
                walletBalance: (customerData.wallet && customerData.wallet.balance || 0) - (customerData.wallet && customerData.wallet.blocked || 0),
                walletSoftLimit: parseFloat(softLimit),
                walletHardLimit: parseFloat(hardLimit)
            };
            return reply({ message: req.i18n.__('genericErrMsg')['200'], data: responce }).code(200);
        }).catch((err) => {
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['genericErrMsg']['200']), data: Joi.any() }
    }
}//swagger response code

module.exports = { APIHandler, responseCode };