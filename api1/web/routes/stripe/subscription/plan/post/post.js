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
    planId: Joi.any().required().description('Plan ID'),
    planName: Joi.any().required().description('Plan Name'),
    planDescription: Joi.any().required().description('Plan Description'),
    statementDescription: Joi.any().required().description('Statement Description'),
    amount: Joi.number().required().description('Plan Amount'),
    interval: Joi.any().allow(['day', 'week', 'month', 'year']).required().description('Plan Interval : day, week, month, year'),
    interval_count: Joi.number().required().description('Plan Interval Count'),
    currency: Joi.any().required().default('usd').description('currency'),
    dueDays: Joi.number().required().default(1).description('Due Date if Subscription is not auto pay.')
}).required();

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    let createPlan = () => {
        return new Promise((resolve, reject) => {
            let planObj = {
                id: req.payload.planId,
                name: req.payload.planName,
                statement_descriptor: req.payload.statementDescription,
                amount: Math.round(parseFloat(req.payload.amount) * 100),
                interval: req.payload.interval,
                interval_count: req.payload.interval_count,
                currency: req.payload.currency,
                metadata: {
                    descripton: req.payload.planDescription,
                    dueDays: req.payload.dueDays
                }
            };
            stripeLib.createPlan(planObj, (err, data) => {
                if (err) {
                    stripeModel.stripeError.errorMessage(err, req)
                        .then((message) => {
                            return reject({ message: message, code: 500 });
                        });
                } else {
                    planObj.mode = stripeMode;
                    stripePlan.createPlan(planObj)
                        .then((data) => {
                            return resolve(data);
                        }).catch((err) => {
                            return reject(dbErrResponse);
                        });
                }
            });
        });
    };

    createPlan()
        .then((data) => {
            return reply({ message: req.i18n.__('stripePlanPost')['200']}).code(200);
        }).catch((err) => {
            logger.error("Stripe Post Plan error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['stripePlanPost']['200']) },
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };