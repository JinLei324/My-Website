'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const config = require('../../../../../../config/components/stripe')
const stripeMode = config.stripe.STRIPE_MODE;
const stripeConnectAccount = require('../../../../../../models/stripeConnectAccount');

const stripeLib = require('../../../../../../library/stripe');

const errorMsg = require('../../../../../../locales');
const stripeModel = require('../../../../../commonModels/stripe');

const payload = Joi.object({
    userId: Joi.string().required().description('User Id'),
    email: Joi.any().required().default('shailesh@mobifyi.com').description('Email'),

    account_number: Joi.string().required().description('000123456789').default('000123456789'),
    routing_number: Joi.string().description('110000').default('110000000'),

    // iban_number: Joi.string().required().description('DE89370400440532013000').default('DE89370400440532013000'),
    account_holder_name: Joi.string().required().description('account holder name').default('test'),
    country: Joi.string().required().description('country').default('US'),
    currency: Joi.string().required().description('currency').default('USD'),
}).required();

const APIHandler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    let getAccount = () => {
        return new Promise((resolve, reject) => {
            stripeConnectAccount.getAccount(req.payload.userId, stripeMode)
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
                // iban_number: req.payload.iban_number,
                account_holder_name: req.payload.account_holder_name,
                country: req.payload.country,
                // currency: "EUR",
                currency : req.payload.currency
            };
            if (req.payload.routing_number !== "undefined" || req.payload.routing_number !== "") {
                data.routing_number = req.payload.routing_number
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