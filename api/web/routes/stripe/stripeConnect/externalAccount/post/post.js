'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const config = require('../../../../../../config/components/stripe');
const stripeMode = config.stripe.STRIPE_MODE;
const stripeConnectAccount = require('../../../../../../models/stripeConnectAccount');

const stripeLib = require('../../../../../../library/stripe');

const errorMsg = require('../../../../../../locales');
const stripeModel = require('../../../../../commonModels/stripe');

const payload = Joi.object({
    // Testing Purpose Only
    // id: Joi.any().required().default('59de3501cb1a0d242003901a').description('_id'),
    email: Joi.any().required().default('shailesh@mobifyi.com').description('Email'),

    account_number: Joi.string().required().description('000123456789').default('000123456789'),
    routing_number: Joi.string().required().description('110000').default('110000000'),
    // iban_number: Joi.string().required().description('NL39RABO0300065264').default('NL39RABO0300065264'),
    account_holder_name: Joi.string().required().description('account holder name').default('test'),
    country: Joi.string().required().description('country').default('US'),
    currency: Joi.string().required().description('currency').default('USD')
}).required();

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    // req.payload.currency = "EUR"

    // Testing Purpose Only
    // req.auth = {
    //     credentials: { _id: req.payload.id }
    // };
    // req.headers.lan = 0;

    let getAccount = () => {
        return new Promise((resolve, reject) => {
            stripeConnectAccount.getAccount(req.auth.credentials._id, stripeMode)
                .then((data) => {
                    if (data) {
                        stripeLib.retrieveAccount(data.stripeId, (err, account) => {
                            if (err) {
                                stripeModel.stripeError.errorMessage(err, req)
                                    .then((message) => {
                                        return reject({ message: message, code: 500 });
                                    });
                            } else {
                                return resolve(account);
                            }
                        });
                    } else {
                        return reject({ message: req.i18n.__('stripeExternalAccountPost')['400'], code: 400 });
                    }
                }).catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    let addExternalAccount = (account) => {
        return new Promise((resolve, reject) => {
            let data = {
                account_number: req.payload.account_number,
                // routing_number: req.payload.routing_number,
                // iban_number: req.payload.iban_number,
                // account_holder_name: req.payload.account_holder_name,
                country: req.payload.country,
                currency: req.payload.currency,
                // account_number : req.payload.iban_number

                account_holder_name: req.payload.account_holder_name,
                // country: "NL",
                // currency: "EUR",
                // account_number : req.payload.iban_number
            };
            if (req.payload.routing_number != "" && req.payload.routing_number != 0) {
                data['routing_number'] = req.payload.routing_number;
            }
            stripeLib.addBankAccount(account.id, data, (err, banckAccount) => {


                if (err) {
                    stripeModel.stripeError.errorMessage(err, req)
                        .then((message) => {
                            return reject({ message: message, code: 500 });
                        });
                } else {
                    return resolve(banckAccount);
                }
            });
        });
    };

    getAccount()
        .then(addExternalAccount)
        .then((data) => {
            return reply({ message: req.i18n.__('genericErrMsg')['200'] }).code(200);
        }).catch((err) => {
            logger.error("Stripe Post External Acccount error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        400: { message: Joi.any().default(errorMsg['stripeExternalAccountPost']['400']) },
        200: { message: Joi.any().default(errorMsg['genericErrMsg']['200']) },
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };