'use strict'
const customer = require('../../../../../models/customer');
const zones = require('../../../../../models/zones');
const mobileDevices = require('../../../../../models/mobileDevices');
const verificationCode = require('../../../../../models/verificationCode');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const sendMsg = require('../../../../../library/twilio')
const sendMail = require('../../../../../library/mailgun')
const cheerio = require('cheerio');//to extract the html from html files
const fs = require('fs');
const jwt = require('jsonwebtoken');
const email = require('../../../../commonModels/email/email');
const userList = require('../../../../commonModels/userList');

// const referralCampaigns = require('../../../referralCampaigns/post');
const configStripe = require('../../../../../config/components/stripe')
const stripeMode = configStripe.stripe.STRIPE_MODE;
const stripeCustomer = require('../../../../../models/stripeCustomer');

const stripeLib = require('../../../../../library/stripe');

const stripeModel = require('../../../../commonModels/stripe');
const dbErrResponse = { message: error['genericErrMsg']['500'], code: 500 };
let stripeId = '';

let geocodder = require('node-geocoder');
var options = {
    provider: 'google',
    // Optionnal depending of the providers
    httpAdapter: 'https', // Default
    apiKey: config.GoogleMapsApiKEy, // for Mapquest, OpenCage, Google Premier
    formatter: null        // 'gpx', 'string', ...
};
let geo = geocodder(options);


/** 
* @function
* @name handler 
* @return {object} Reply to the user.
* @param {data} 0 - name, 1 - email, 2 - mobile
*/
const handler = (req, reply) => {
    // [
    //     {$match : { "_id" : ObjectId("5ab49686d2066057c39da406"),}}, 
    //      { $lookup: { "from": "savedAddress", "localField": "_id",
    //             "foreignField": "userId", "as": "savedAddresses" } }  
    //     ]
    customer.aggregateData({ _id: new ObjectID(req.params.customerId) }, (e, r) => {
        if (e) {
            logger.error('Error occurred during customer crate by dispatcher (aggregateData): ' + JSON.stringify(e));
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        if (r[0]) {
            r[0].customerId = r[0]._id;
            delete r[0]._id;
            r[0].defaultAddress = {
            };
            if (r[0].savedAddresses.length > 0) {
                for (let i = 0; i < r[0].savedAddresses.length; i++) {
                    if (r[0].addressId && r[0].addressId.toString() == r[0].savedAddresses[i]._id.toString()) {
                        r[0].defaultAddress = r[0].savedAddresses[i];
                    }
                }
            }
            r[0].savedCards = [];
            getCustomer(r[0].customerId.toString())
                .then(getCard)
                .then((cardArr) => {
                    if (cardArr.length > 0)
                    r[0].savedCards = cardArr;
                    return reply({ message: req.i18n.__('genericErrMsg')['200'], data: r[0] }).code(200);
                }).catch((err) => {
                    logger.error('main catch');
                   
                    return reply({ message: req.i18n.__('genericErrMsg')['200'], data: r[0] }).code(200);
                });



        } else {
            return reply({ message: req.i18n.__('getData')['404'] }).code(404);
        }
    });
}


let getCard = (defaultCard) => {
    return new Promise((resolve, reject) => {
        logger.error(defaultCard);
        logger.error('defaultCard');
        if (stripeId == '')
            return resolve([]);
        else {

            stripeLib.getCards(stripeId, (err, data) => {
                if (err) {
                    stripeModel.stripeError.errorMessage(err, req)
                        .then((message) => {
                            logger.error('err while getting getCards');
                            return reject({ message: message, code: 500 });
                        });
                } else {
                    let cardData = data['data'] || [];
                    let cardArr = cardData.map(item => {
                        return {
                            'name': item.name || '',
                            'last4': item.last4,
                            'expYear': item.exp_year,
                            'expMonth': item.exp_month,
                            'id': item.id,
                            'brand': item.brand,
                            'funding': item.funding,
                            'isDefault': (item.id === defaultCard) ? true : false//set the default flag
                        }
                    });
                    return resolve(cardArr);
                }
            });
        }
    });
};
let getCustomer = (id) => {

    return new Promise((resolve, reject) => {
        logger.error(stripeMode);
        stripeCustomer.getCustomer(id, stripeMode)
            .then((data) => {

                if (data) {
                    stripeId = data.stripeId;
                    stripeLib.retrieveCustomer(data.stripeId, (err, customer) => {
                        if (err) {
                            stripeModel.stripeError.errorMessage(err, req)
                                .then((message) => {
                                    logger.error('err while getting stripeModel.stripeError  ');
                                    return reject({ message: message, code: 500 });
                                });
                        } else {
                            logger.warn(JSON.stringify(customer));
                            logger.warn(customer.default_source);
                            return resolve(customer.default_source);
                        }
                    });
                } else {
                    return resolve(true);
                }
            }).catch((err) => {
                logger.error('err while getting dbErrResponse catch');
                return reject(dbErrResponse);
            });
    });
};

/**
* A module that exports business get store handler! 
* @exports handler 
*/
module.exports = { handler }