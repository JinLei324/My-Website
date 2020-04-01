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
    accountId: Joi.any().required().description('Account ID')
}).required();

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    let getAccount = () => {
        return new Promise((resolve, reject) => {
            stripeConnectAccount.getAccount(req.payload.userId, stripeMode)
                .then((data) => {
                    if (data) {
                        return resolve(data);
                    } else {
                        return reject({ message: req.i18n.__('stripeExternalAccountPatch')['400'], code: 400 });
                    }
                }).catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    let updateConnectAccount = (data) => {
        return new Promise((resolve, reject) => {
            stripeLib.updateBankAccount(data.stripeId, req.payload.accountId, { default_for_currency: true }, (err, confirmation) => {
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
        .then(updateConnectAccount)
        .then((data) => {
            return reply({ message: req.i18n.__('stripeExternalAccountPatch')['200'] }).code(200);
        }).catch((err) => {
            logger.error("Stripe Patch External Account error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['stripeExternalAccountPatch']['200']) },
        400: { message: Joi.any().default(errorMsg['stripeExternalAccountPatch']['400']) }
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };