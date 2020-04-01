'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const config = require('../../../../../../config/components/stripe');
const stripeMode = config.stripe.STRIPE_MODE;
const stripePlan = require('../../../../../../models/stripePlan');
const stripeCustomer = require('../../../../../../models/stripeCustomer');

const stripeLib = require('../../../../../../library/stripe');

const errorMsg = require('../../../../../../locales');
const stripeModel = require('../../../../../commonModels/stripe');

const payload = Joi.object({
    billing: Joi.any().allow(['send_invoice', 'charge_automatically']).required().description('send_invoice - do not charge automatically,<br/>charge_automatically - charge automatically')
}).required();

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    let getCustomer = () => {
        return new Promise((resolve, reject) => {
            stripeCustomer.getCustomer(req.auth.credentials._id, stripeMode)
                .then((data) => {
                    if (data) {
                        stripeLib.retrieveCustomer(data.stripeId, (err, customer) => {
                            if (err) {
                                stripeModel.stripeError.errorMessage(err, req)
                                    .then((message) => {
                                        return reject({ message: message, code: 500 });
                                    });
                            } else if (customer.sources.data.length() > 0) {
                                return resolve(data);
                            } else {
                                reject({ message: req.i18n.__('stripeSubscribePatch')['400'], code: 400 });
                            }
                        });
                    } else {
                        reject({ message: req.i18n.__('stripeSubscribePatch')['401'], code: 401 });
                    }
                }).catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    let updateSubscription = (customer) => {
        return new Promise((resolve, reject) => {
            let subscriptionObj = {
                billing: req.payload.billing
            };
            if (req.payload.billing == 'send_invoice')
                subscriptionObj.days_until_due = customer.plan.metadata.dueDays;
            stripeLib.updateSubscription(customer.subscriptionId, subscriptionObj, (err, subscription) => {
                if (err) {
                    stripeModel.stripeError.errorMessage(err, req)
                        .then((message) => {
                            return reject({ message: message, code: 500 });
                        });
                } else {
                    return resolve(subscription);
                }
            });
        });
    };

    getCustomer()
        .then(updateSubscription)
        .then((subscribePlan) => {
            return reply({ message: req.i18n.__('stripeSubscribePatch')['200'] }).code(200);
        }).catch((err) => {
            logger.error("Stripe Patch Subscribe error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};


const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        400: { message: Joi.any().default(errorMsg['stripeSubscribePatch']['400']) },
        401: { message: Joi.any().default(errorMsg['stripeSubscribePatch']['401']) },
        402: { message: Joi.any().default(errorMsg['stripeSubscribePatch']['402']) },
        200: { message: Joi.any().default(errorMsg['stripeSubscribePatch']['200']) },
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };