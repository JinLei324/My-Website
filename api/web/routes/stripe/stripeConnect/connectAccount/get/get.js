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
}).required();

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };


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
                        return reject({ message: req.i18n.__('stripeConnectAccountGet')['400'], code: 400 });
                    }
                }).catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    getAccount()
        .then((accData) => {
            return reply({ message: req.i18n.__('genericErrMsg')['200'], data: accData }).code(200);
        }).catch((err) => {
            logger.error("Stripe Get Connect Account error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        400: { message: Joi.any().default(errorMsg['stripeConnectAccountGet']['400']) },
        200: { message: Joi.any().default(errorMsg['genericErrMsg']['200']), data: Joi.any() }
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };