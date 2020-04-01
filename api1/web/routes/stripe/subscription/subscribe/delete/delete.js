'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const config = require('../../../../../../config/components/stripe');
const stripeMode = config.stripe.STRIPE_MODE;
const stripePlan = require('../../../../../../models/stripePlan');

const stripeLib = require('../../../../../../library/stripe');

const errorMsg = require('../../../../../../locales');
const stripeModel = require('../../../../../commonModels/stripe');

const payload = Joi.object({
}).required();

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    let getCustomer = () => {
        return new Promise((resolve, reject) => {
            stripeCustomer.getCustomer(req.auth.credentials._id, stripeMode)
                .then((data) => {
                    if (data) {
                        if (data.subscriptionId != '') {
                            return resolve(data);
                        } else {
                            reject({ message: req.i18n.__('stripeSubscribeDelete')['400'], code: 400 });
                        }
                    } else {
                        reject({ message: req.i18n.__('stripeSubscribeDelete')['401'], code: 401 });
                    }
                }).catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    let deleteSubscription = (customer) => {
        return new Promise((resolve, reject) => {
            stripeLib.deleteSubscription(customer.subscriptionId, (err, plan) => {
                if (err) {
                    stripeModel.stripeError.errorMessage(err, req)
                        .then((message) => {
                            return reject({ message: message, code: 500 });
                        });
                } else {
                    let updateObj = {
                        subscriptionId: "",
                        subscribedPlan: ""
                    };
                    stripeCustomer.updateCustomer(req.auth.credentials._id, stripeMode, { $set: updateObj })
                        .then((data) => {
                            return resolve(customer);
                        }).catch((err) => {
                            return reject(dbErrResponse);
                        });
                }
            });
        });
    };

    getPlan()
        .then(deleteSubscription)
        .then((data) => {
            return reply({ message: req.i18n.__('stripeSubscribeDelete')['500'] }).code(200);
        }).catch((err) => {
            logger.error("Stripe Delete Subscribe error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['stripeSubscribeDelete']['200']) },
        400: { message: Joi.any().default(errorMsg['stripeSubscribeDelete']['400']) },
        401: { message: Joi.any().default(errorMsg['stripeSubscribeDelete']['401']) }
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };