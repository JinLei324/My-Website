'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const config = require('../../../../../../config/components/stripe');
const stripeMode = config.stripe.STRIPE_MODE;
const stripePlan = require('../../../../../../models/stripePlan');

const errorMsg = require('../../../../../../locales');

const payload = Joi.object({
}).required();

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    let getPlans = () => {
        return new Promise((resolve, reject) => {
            stripePlan.getPlans(stripeMode)
                .then((data) => {
                    if (data) {
                        return resolve(data);
                    } else {
                        return resolve([]);
                    }
                }).catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    getPlans()
        .then((planArr) => {
            return reply({ message: req.i18n.__('genericErrMsg')['200'], data: planArr }).code(200);
        }).catch((err) => {
            logger.error("Stripe Get Plan error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['genericErrMsg']['200']), data: Joi.any() }
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };