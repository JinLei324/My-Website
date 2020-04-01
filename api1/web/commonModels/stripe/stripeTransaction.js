'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const request = require('request');

const config = require('../../../config/components/stripe');
const stripeMode = config.stripe.STRIPE_MODE;
const stripeConnectAccount = require('../../../models/stripeConnectAccount');
const stripeCustomer = require('../../../models/stripeCustomer');
const stripeLib = require('../../../library/stripe');
const stripeError = require('../stripe/stripeError');
let baseUrl = "https://payfort.trolley.app/services.php?/";

/**
 * Authorised Amount (Create Charge)
 * @param {object} req {} - Request object
 * @param {string} user  Mongo ID for stripe customer
 * @param {string} source source to charge
 * @param {float} amount amount
 * @param {string} currency currency(usd)
 * @param {string} description Description of charge
 * @param {object} metadata {} - A set of key/value pairs that you can attach to a charge object
 */
let createCharge = (req, user, source, amount, currency, description, metadata) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'] };

    let chargeCard = (data) => {
        return new Promise((resolve, reject) => {
            let payfortData = {
                amount: amount,
                merchant_reference: moment().valueOf(),
                token_name: source,
                email: req.user.email,
                name: req.user.name
            }
            let options = {
                method: 'POST',
                url: baseUrl + 'chargeCard',
                headers:
                {
                    'cache-control': 'no-cache',
                    'content-type': 'application/json'
                },
                body: payfortData,
                json: true
            };
            request(options, function (error, response, body) {
                // console.log("response, body", response, body)
                if (response['body']['errNum'] == 1) {

                    return reject({ message: 'error got on charge card' });
                } else {
                    return resolve(body);
                }
            })
        });
    };

    return new Promise((resolve, reject) => {
        chargeCard()
            .then((chargeData) => {
                return resolve({ message: req.i18n.__('stripeTransaction')['authoriseSuccess'], data: chargeData })
            }).catch((err) => {
                logger.error("Stripe create charge error : ", err);
                return reject({ message: err.message });
            });
    });
};

/**
 * Cature uncaptured Charge 
 * @param {object} req {} - Request object
 * @param {*} chargeId - Charge ID
 * @param {*} amount - amount to charge (optional for capturing entire amount)
 */
let captureCharge = (req, chargeId, amount) => {
    let refundCharge = () => {
        return new Promise((resolve, reject) => {
            let payfortData = {
                fort_id: chargeId,
                amount: amount,
                merchant_reference: moment().valueOf()
            }
            let options = {
                method: 'POST',
                url: baseUrl + 'captureAmount',
                headers:
                {
                    'cache-control': 'no-cache',
                    'content-type': 'application/json'
                },
                body: payfortData,
                json: true
            };
            request(options, function (error, response, body) {
                error ? reject(error) : resolve(body)
            })
        });
    };
    return new Promise((resolve, reject) => {
        refundCharge()
            .then((chargeData) => {
                return resolve({ message: req.i18n.__('stripeTransaction')['captureChargeSuccess'], data: chargeData })
            }).catch((err) => {
                logger.error("Stripe Capture charge error : ", err);
                return reject({ message: err.message });
            });
    });
};

/**
 * Create and Captured Amount
 * @param {object} req {} - Request object
 * @param {string} user  Mongo ID for stripe customer
 * @param {string} source source to charge
 * @param {float} amount amount
 * @param {string} currency currency(usd)
 * @param {string} description Description of charge
 * @param {object} metadata {} - A set of key/value pairs that you can attach to a charge object
 */
let createAndCaptureCharge = (req, user, source, amount, currency, description, metadata) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'] };

    let chargeCard = (data) => {
        return new Promise((resolve, reject) => {
            let payfortData = {
                token_name: source,
                amount: amount,
                email: req.user.email,
                name: req.user.name,
                merchant_reference: moment().valueOf(),
                ip_address: '139.59.0.162'
            }
            let options = {
                method: 'POST',
                url: baseUrl + 'chargeAndCapture',
                headers:
                {
                    'cache-control': 'no-cache',
                    'content-type': 'application/json'
                },
                body: payfortData,
                json: true
            };
            request(options, function (error, response, body) {

                if (response['body']['errNum'] == 1) {
                    return reject({ message: 'Insufficient fund in card' });
                } else {
                    return resolve(body);
                }

            });
        });
    };

    return new Promise((resolve, reject) => {
        chargeCard()
            .then((chargeData) => {
                return resolve({ message: req.i18n.__('stripeTransaction')['chargeSuccess'], data: chargeData })
            }).catch((err) => {
                logger.error("Stripe Create And Capture Charge error : ", err);
                return reject({ message: err.message });
            });
    });
};


/**
 * Refund Charge 
 * @param {object} req {} - Request object
 * @param {*} chargeId - Charge ID
 * @param {*} amount - amount to refund (optional for refunding entire amount)
 */
let refundCharge = (chargeId, amount, merchant_reference) => {
    let refundCharge = () => {
        return new Promise((resolve, reject) => {
            let payfortData = {
                fort_id: chargeId,
                amount: amount,
                merchant_reference: merchant_reference
                //                merchant_reference: moment().valueOf()

            }
            let options = {
                method: 'POST',
                url: baseUrl + 'refundAmount',
                headers:
                {
                    'cache-control': 'no-cache',
                    'content-type': 'application/json'
                },
                body: payfortData,
                json: true
            };
            request(options, function (error, response, body) {
                if (response['body']['errNum'] == 1) {
                    console.log('Refund amount response : ' + JSON.stringify(response));
                    return reject({ message: 'Error getting while refund amount' });
                } else {
                    return resolve(body);
                }
            })
        });
    };
    return new Promise((resolve, reject) => {
        refundCharge()
            .then((chargeData) => {
                return resolve({ message: req.i18n.__('stripeTransaction')['refundChargeSuccess'], data: chargeData })
            }).catch((err) => {
                logger.error("Stripe cancel charge error : ", err);
                return reject({ message: err.message });
            });
    });
};

/**
 * Transfer to connect account
 * @param {object} req {} - Request object
 * @param {*} user  Mongo ID for stripe connect account user
 * @param {*} amount amount
 * @param {*} currency currency(USD)
 */
let transferToConnectAccount = (req, user, amount, currency) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'] };

    let getAccount = () => {
        return new Promise((resolve, reject) => {
            stripeConnectAccount.getAccount(user, stripeMode)
                .then((data) => {
                    if (data) {
                        return resolve(data);
                    } else {
                        return reject({ message: req.i18n.__('stripeTransaction')['accountNotFound'] });
                    }
                }).catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    let transfer = (data) => {
        return new Promise((resolve, reject) => {
            let transferObj = {
                amount: Math.round(parseFloat(amount) * 100),
                currency: currency || 'usd',
                destination: data.stripeId,
            };

            stripeLib.transferToConnectAccount(transferObj, (err, transfer) => {
                if (err) {
                    stripeError.errorMessage(err, req)
                        .then((message) => {
                            return reject({ message: message });
                        });
                } else {
                    return resolve(transfer);
                }
            });
        });
    };

    return new Promise((resolve, reject) => {
        getAccount()
            .then(transfer)
            .then((transferData) => {
                return resolve({ message: req.i18n.__('stripeTransaction')['transferSuccess'], data: transferData })
            }).catch((err) => {
                logger.error("Stripe Transfer error : ", err);
                return reject({ message: err.message });
            });
    });
};

module.exports = {
    createCharge,
    captureCharge,
    createAndCaptureCharge,
    refundCharge,
    transferToConnectAccount
};