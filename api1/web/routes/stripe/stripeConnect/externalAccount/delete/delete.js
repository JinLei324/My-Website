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
    accountId: Joi.string().required().description('Account ID'),
}).required();

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

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
                        return resolve(data);
                    } else {
                        return reject({ message: req.i18n.__('stripeExternalAccountDelete')['400'], code: 400 });
                    }
                }).catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    let deleteExternalAccount = (data) => {
        return new Promise((resolve, reject) => {
            stripeLib.deleteBankAccount(data.stripeId, req.payload.accountId, (err, confirmation) => {
                if (err) {
                    stripeModel.stripeError.errorMessage(err, req)
                        .then((message) => {
                            return reject({ message: message, code: 500 });
                        });
                } else {
                    return resolve(true);
                }
            });
        });
    };

    getAccount()
        .then(deleteExternalAccount)
        .then((data) => {
            return reply({ message: req.i18n.__('stripeExternalAccountDelete')['200'] }).code(200);
        }).catch((err) => {
            logger.error("Stripe Delete External Account error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['stripeExternalAccountDelete']['200']) },
        400: { message: Joi.any().default(errorMsg['stripeExternalAccountDelete']['400']) }
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };