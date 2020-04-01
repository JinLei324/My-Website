'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');

const stripeLib = require('../../../../../../library/stripe');
const errorMsg = require('../../../../../../locales');
const stripeCountry = require('../../../../../../models/stripeCountry');

const paramsValidator = Joi.object({
    countryId: Joi.string().required().description('countryId')
}).required();

const APIHandler = (req, reply) => {
    let response = {};
    let countryDetail = {};

    let getCountryFromDB = () => {

        return new Promise((resolve, reject) => {
            stripeCountry.SelectOne({ "countryCode": req.params.countryId }, (err, data) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {
                    countryDetail = data;
                    return resolve(true);
                }
            });
        });
    };


    let getCurrencyByCountry = () => {
        
        return new Promise((resolve, reject) => {
            stripeLib.countrySpecsRetrieve(req.params.countryId, function (err, con) {
                if (err) {
                    return reject({ 'message': err.message, code: 410 });
                } else if (con) {
                    
                    let currencyArray = [];
                    for (var k in con.supported_bank_account_currencies) {
                        if (typeof con.supported_bank_account_currencies[k] !== 'function') {
                            currencyArray.push(k);
                        }
                    }
                    
                    response = {
                        default_currency: con.default_currency,
                        currency: currencyArray,
                        defaultExternalAccount: countryDetail ? countryDetail.defaultExternalAccount : {},
                        externalAccount: countryDetail ? countryDetail.externalAccount : []
                    }
                    
                    return resolve(true);
                } else {
                    
                    return reject({ 'message': 'Invalid Country ID', code: 410 });
                }
            });
        });
    };

    getCountryFromDB()
        .then(getCurrencyByCountry)
        .then((data) => {
            return reply({ message: req.i18n.__('genericErrMsg')['200'], data: response }).code(200);
        }).catch((err) => {
            logger.error("Stripe Get Connect Account Currency error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['genericErrMsg']['200']), data: Joi.any() }
    }
}//swagger response code

module.exports = { paramsValidator, APIHandler, responseCode };