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
}).required();

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };


    let getCard = () => {
        return new Promise((resolve, reject) => {
            let condition = { '_id': ObjectID(req.auth.credentials._id) };
            customer.isExistsWithCond(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else if (result && result.cardDetails) {
                    let cardArr = result.cardDetails.map(item => {
                        return {
                            'name': item.card_holder_name || '',
                            'last4': item.card_number.slice(-4) || '',
                            'expYear': parseInt(item.expiry_date.substr(0, 2)) || '',
                            'expMonth': parseInt(item.expiry_date.slice(-2)) || '',
                            'id': item.token_name || '',
                            'brand': item.payment_option || '',
                            'isDefault': item.isDefault || false
                        }
                    });
                    return resolve(cardArr);
                } else {
                    return resolve([]);
                }
            });
        });
    };

    getCard()
        .then((cardArr) => {
            return reply({ message: req.i18n.__('genericErrMsg')['200'], data: { 'cards': cardArr } }).code(200);
        }).catch((err) => {
            logger.error("Stripe Get Card error : ", err);
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