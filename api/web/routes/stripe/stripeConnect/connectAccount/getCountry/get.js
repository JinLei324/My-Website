'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const errorMsg = require('../../../../../../locales');
const stripeCountry = require('../../../../../../models/stripeCountry');

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };
    let countryList = [];

    let getStripeCountry = () => {
        return new Promise((resolve, reject) => {
            stripeCountry.SelectAll({}, (err, data) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {
                    data.forEach(element => {
                        countryList.push({
                            'country': element.country,
                            'countryCode': element.countryCode
                        });
                    });
                    return resolve(true);
                }
            });
        });
    };

    getStripeCountry()
        .then((data) => {
            let response = {
                countryList: countryList
            }
            return reply({ message: req.i18n.__('genericErrMsg')['200'], data: response }).code(200);
        }).catch((err) => {
            logger.error("Stripe Get Connect Account Country error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['genericErrMsg']['200']), data: Joi.any() }
    }
}//swagger response code

module.exports = { APIHandler, responseCode };