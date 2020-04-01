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

const payload = Joi.object({
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
                            } else {
                                return resolve(data);
                            }
                        });
                    } else {
                        reject({ message: req.i18n.__('stripeSubscribeGet')['400'], code: 400 });
                    }
                }).catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    let getSubscription = (customer) => {
        return new Promise((resolve, reject) => {
            if (customer.subscriptionId == '') {
                return reject({ message: req.i18n.__('stripeSubscribeGet')['401'], code: 401 });
            } else {
                stripeLib.retrieveSubscription(customer.subscriptionId, (err, subscription) => {
                    if (err) {
                        stripeModel.stripeError.errorMessage(err, req)
                            .then((message) => {
                                return reject({ message: message, code: 500 });
                            });
                    } else {
                        resolve(subscription);
                    }
                });
            }
        });
    };

    // let checkSubscription = (subscription) => {
    //     return new Promise((resolve, reject) => {
    //         if(subscription.status == 'active'){

    //         } else {

    //         }
    //     });
    // };

    getCustomer()
        .then(getSubscription)
        // .then(checkSubscription)
        .then((subscribePlan) => {
            return reply({ message: req.i18n.__('stripeSubscribeGet')['200'], data: subscribePlan }).code(200);
        }).catch((err) => {
            logger.error("Stripe Get Subsccribe error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        400: { message: Joi.any().default(errorMsg['stripeSubscribeGet']['400']) },
        401: { message: Joi.any().default(errorMsg['stripeSubscribeGet']['401']) },
        200: { message: Joi.any().default(errorMsg['stripeSubscribeGet']['200']), data: Joi.any() }
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };