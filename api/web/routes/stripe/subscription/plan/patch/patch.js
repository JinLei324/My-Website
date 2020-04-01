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
    dueDays: Joi.number().required().default(1).description('Due Date if Subscription is not auto pay.')
}).required();

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    let getPlan = () => {
        return new Promise((resolve, reject) => {
            stripePlan.getPlan(req.payload.planId, stripeMode)
                .then((data) => {
                    if (data)
                        return resolve(data);
                    else
                        return reject({ message: req.i18n.__('stripePlanPatch')['400'], code: 400 });
                }).catch((err) => {
                    return reject(dbErrResponse);
                });
        });
    };

    let updatePlan = (data) => {
        return new Promise((resolve, reject) => {
            let planObj = {
                name: req.payload.planName,
                statement_descriptor: req.payload.statementDescription,
                metadata: {
                    descripton: req.payload.planDescription,
                    dueDays: req.payload.dueDays
                }
            };
            stripeLib.updatePlan(req.payload.planId, planObj, (err, data) => {
                if (err) {
                    stripeModel.stripeError.errorMessage(err, req)
                        .then((message) => {
                            return reject({ message: message, code: 500 });
                        });
                } else {
                    stripePlan.updatePlan(req.payload.planId, stripeMode, { $set: planObj })
                        .then((data) => {
                            return resolve(data);
                        }).catch((err) => {
                            return reject(dbErrResponse);
                        });
                }
            });
        });
    };

    getPlan()
        .then(updatePlan)
        .then((data) => {
            return reply({ message: req.i18n.__('stripePlanPatch')['200'] }).code(200);
        }).catch((err) => {
            logger.error("Stripe Patch Plan error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['stripePlanPatch']['200']) },
        400: { message: Joi.any().default(errorMsg['stripePlanPatch']['400']) }
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };