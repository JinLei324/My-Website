'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const customer = require('../../../../../../models/customer');
const config = require('../../../../../../config/components/stripe')
const stripeMode = config.stripe.STRIPE_MODE;
const stripeCustomer = require('../../../../../../models/stripeCustomer');
const stripeLib = require('../../../../../../library/stripe');
const errorMsg = require('../../../../../../locales');
const stripeModel = require('../../../../../commonModels/stripe');

const payload = Joi.object({
    cardId: Joi.any().required().description('Card ID')
}).required();


const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    let updateAllCard = (data) => {
        return new Promise((resolve, reject) => {
            let quaryData = {
                query: { '_id': new ObjectID(req.auth.credentials._id.toString()) },
                data: {
                    $set: {
                        'cardDetails.$[].isDefault': false
                    }
                }
            };
            customer.findOneAndUpdate(quaryData, (err, user) => {
                return resolve(true);
            });
        });
    };

    let updateCustomer = (data) => {
        return new Promise((resolve, reject) => {
            let quaryData = {
                query: { 'cardDetails.token_name': req.payload.cardId },
                data: {
                    $set: {
                        'cardDetails.$.isDefault': true
                    }
                }
            };
            customer.findOneAndUpdate(quaryData, (err, user) => {
                return resolve(true);
            });
        });
    };

    updateAllCard()
        .then(updateCustomer)
        .then((data) => {
            return reply({ message: req.i18n.__('stripeCardPatch')['200'] }).code(200);
        }).catch((err) => {
            logger.error("Stripe Patch Card error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['stripeCardPatch']['200']) },
        400: { message: Joi.any().default(errorMsg['stripeCardPatch']['400']) }
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };