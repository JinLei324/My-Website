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
    planId: Joi.any().required().description('Plan ID'),
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
                            } else if (customer.sources.data.length > 0) {
                                return resolve(data);
                            } else {
                                reject({ message: req.i18n.__('stripeSubscribePost')['400'], code: 400 });
                            }
                        });
                    } else {
                        reject({ message: req.i18n.__('stripeSubscribePost')['401'], code: 401 });
                    }
                }).catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    let getPlan = (customer) => {
        return new Promise((resolve, reject) => {
            stripePlan.getPlan(req.payload.planId, stripeMode)
                .then((data) => {
                    if (data) {
                        customer.plan = data;
                        return resolve(customer);
                    } else
                        return reject({ message: req.i18n.__('stripeSubscribePost')['402'], code: 402 });
                }).catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    let checkSubscription = (customer) => {
        return new Promise((resolve, reject) => {
            if (customer.subscriptionId == '' || typeof customer.subscriptionId == 'undefined')
                resolve(customer);
            else if (customer.subscribedPlan == req.payload.planId) {
                return reject({ message: req.i18n.__('stripeSubscribePost')['208'], code: 208 });
            } else {
                stripeLib.deleteSubscription(customer.subscriptionId, (err, plan) => {
                    if (err) {
                        stripeModel.stripeError.errorMessage(err, req)
                            .then((message) => {
                                return reject({ message: message, code: 500 });
                            });
                    } else {
                        resolve(customer);
                    }
                });
            }
        });
    };

    let subscribePlan = (customer) => {
        return new Promise((resolve, reject) => {
            let subscriptionObj = {
                customer: customer.stripeId,
                billing: req.payload.billing,
                items: [
                    {
                        plan: req.payload.planId,
                    },
                ]
            };
            if (req.payload.billing == 'send_invoice')
                subscriptionObj.days_until_due = customer.plan.metadata.dueDays;
            stripeLib.createSubscription(subscriptionObj, (err, data) => {
                if (err) {
                    stripeModel.stripeError.errorMessage(err, req)
                        .then((message) => {
                            return reject({ message: message, code: 500 });
                        });
                } else {
                    let updateObj = {
                        subscriptionId: data.id,
                        subscribedPlan: req.payload.planId
                    };
                    stripeCustomer.updateCustomer(req.auth.credentials._id, stripeMode, { $set: updateObj })
                        .then((data) => {
                            return resolve(data);
                        }).catch((err) => {
                            return reject(dbErrResponse);
                        });
                }
            });
        });
    };

    getCustomer()
        .then(getPlan)
        .then(checkSubscription)
        .then(subscribePlan)
        .then((subscribePlan) => {
            return reply({ message: req.i18n.__('stripeSubscribePost')['200'] }).code(200);
        }).catch((err) => {
            logger.error("Stripe Post Card error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        400: { message: Joi.any().default(errorMsg['stripeSubscribePost']['400']) },
        401: { message: Joi.any().default(errorMsg['stripeSubscribePost']['401']) },
        402: { message: Joi.any().default(errorMsg['stripeSubscribePost']['402']) },
        200: { message: Joi.any().default(errorMsg['stripeSubscribePost']['200']) },
        208: { message: Joi.any().default(errorMsg['stripeSubscribePost']['208']) },
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };