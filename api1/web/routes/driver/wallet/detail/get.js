'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;

const errorMsg = require('../../../../../locales');
const cities = require('../../../../../models/cities');

const APIHandler = (req, reply) => {

    let providerData = req.user;
    let cityDetails = {};

    let getCityDetail = () => {
        return new Promise((resolve, reject) => {
            cities.isExists({ _id: new ObjectID(providerData.cityId) }, (err, cityDetail) => {
                console.log("cityDetail", JSON.stringify(cityDetail))
                if (cityDetail) {
                    cityDetails = cityDetail.cities[0];
                    resolve(true);
                } else {
                    reject({ message: req.i18n.__('genericErrMsg')['500'], code: 500 });
                }
            });
        });
    }

    let generateResponce = () => {
        return new Promise((resolve, reject) => {
            let walletHardLimit = cityDetails.driverWalletLimits ? cityDetails.driverWalletLimits.hardLimitForDriver : 0;
            if (providerData.wallet.hardLimit && providerData.wallet.hardLimit != 0) {
                walletHardLimit = providerData.wallet.hardLimit;
            }

            let walletSoftLimit = cityDetails.driverWalletLimits ? cityDetails.driverWalletLimits.softLimitForDriver : 0;
            if (providerData.wallet.softLimit && providerData.wallet.softLimit != 0) {
                walletSoftLimit = providerData.wallet.softLimit;
            }

            let responce = {
                currencySymbol: providerData.currencySymbol || (cityDetails.currencySymbol || ''),
                currencyAbbr: providerData.currencyAbbr || (cityDetails.currencyAbbr || 1),
                walletBalance: parseFloat(providerData.wallet.balance || 0).toFixed(2),
                walletHardLimit: parseFloat(walletHardLimit).toFixed(2),
                walletSoftLimit: parseFloat(walletSoftLimit).toFixed(2)
            };
            resolve(responce);
        });
    }

    getCityDetail()
        .then(generateResponce)
        .then((data) => {
            return reply({ message: req.i18n.__('genericErrMsg')['200'], data: data }).code(200);
        }).catch((e) => {
            logger.error("provider get wallet detail API error =>", e)
            return reply({ message: e.message }).code(e.code);
        });
    // let responce = {
    //     currencyAbbr: userData.currencyAbbr || 1,
    //     currencySymbol: userData.currencySymbol,
    //     walletBalance: parseFloat(userData.wallet.balance).toFixed(2),
    //     walletSoftLimit: parseFloat(userData.wallet.softLimit).toFixed(2),
    //     walletHardLimit: parseFloat(userData.wallet.hardLimit).toFixed(2),
    // };
    // return reply({ message: req.i18n.__('genericErrMsg')['200'], data: responce }).code(200);
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['genericErrMsg']['200']), data: Joi.any() }
    }
}//swagger response code

module.exports = { APIHandler, responseCode };