'use strict';

const logger = require('winston');
const ObjectID = require('mongodb').ObjectID;

const config = require('../../../../../../config/components/stripe')
const customer = require('../../../../../../models/customer');
const stripeMode = config.stripe.STRIPE_MODE;
const stripeCustomer = require('../../../../../../models/stripeCustomer');
const stripeLib = require('../../../../../../library/stripe');
const errorMsg = require('../../../../../../locales');
const stripeModel = require('../../../../../commonModels/stripe');

const getCustomerCards = (req, reply) => {
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
            return reply(null, { code: 200, message: req.i18n.__('genericErrMsg')['200'], data: cardArr });
        }).catch((err) => {
            logger.error("Stripe Get Card error : ", err);
            return reply(null, { code: err.code, message: err.message, data: [] });
        });
};

module.exports = { getCustomerCards };