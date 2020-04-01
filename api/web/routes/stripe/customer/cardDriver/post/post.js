'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;

const config = require('../../../../../../config/components/stripe')
const stripeMode = config.stripe.STRIPE_MODE;
const stripeCustomer = require('../../../../../../models/stripeCustomer');
const stripeLib = require('../../../../../../library/stripe');
const errorMsg = require('../../../../../../locales');
const stripeModel = require('../../../../../commonModels/stripe');
const stripeCard = require('../getModule/get');

const payload = Joi.object({
    email: Joi.any().required().default('shailesh@mobifyi.com').description('Email'),
    cardToken: Joi.any().required().description('Card Token')
}).required();

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    let stripeId = '';
    let cards = [];

    let getCustomer = () => {
        return new Promise((resolve, reject) => {
            stripeCustomer.getCustomer(req.auth.credentials._id, stripeMode)
                .then((data) => {
                    if (data) {
                        stripeId = data.stripeId;
                        return resolve(data);
                    } else {
                        stripeLib.createCustomer({ email: req.payload.email }, (err, data) => {
                            if (err) {
                                stripeModel.stripeError.errorMessage(err, req)
                                    .then((message) => {
                                        return reject({ message: err.message, code: 500 });
                                    });
                            } else {
                                stripeId = data.id;
                                let insObj = {
                                    user: new ObjectID(req.auth.credentials._id),
                                    mode: stripeMode,
                                    stripeId: data.id
                                };
                                stripeCustomer.createCustomer(insObj)
                                    .then((data) => {
                                        return resolve(data);
                                    }).catch((err) => {
                                        return reject(dbErrResponse);
                                    });
                            }
                        });
                    }
                }).catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    let addCard = () => {
        return new Promise((resolve, reject) => {
            stripeLib.addCard({ id: stripeId, cardToken: req.payload.cardToken }, (err, data) => {
                if (err) {
                    stripeModel.stripeError.errorMessage(err, req)
                        .then((message) => {
                            return reject({ message: message, code: 500 });
                        });
                } else {
                    return resolve(data);
                }
            });
        });
    };

    const getStripeCards = (data) => {
        return new Promise((resolve, reject) => {
            stripeCard.getCustomerCards(req, (err, res) => {
                cards = res.data;
                resolve(data);
            });
        });
    }//get stripe cards

    getCustomer()
        .then(addCard)
        .then(getStripeCards)
        .then((data) => {
            return reply({ message: req.i18n.__('stripeCardPost')['200'], data: { cards: cards } }).code(200);
        }).catch((err) => {
            logger.error("Stripe Post Card error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['stripeCardPost']['200']), data: Joi.any() },
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };