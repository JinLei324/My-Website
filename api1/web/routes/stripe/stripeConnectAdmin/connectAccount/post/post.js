'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
var fs = require('fs');
var request = require('request');

const config = require('../../../../../../config/components/stripe')
const stripeMode = config.stripe.STRIPE_MODE;
const stripeConnectAccount = require('../../../../../../models/stripeConnectAccount');

const stripeLib = require('../../../../../../library/stripe');

const errorMsg = require('../../../../../../locales');
const stripeModel = require('../../../../../commonModels/stripe');

const payload = Joi.object({
    userId: Joi.string().required().description('User Id'),
    email: Joi.any().required().default('shailesh@mobifyi.com').description('Email'),

    city: Joi.string().required().description('city name').error(new Error('city Nmae is missing')),
    country: Joi.string().required().description('US').error(new Error('Country is missing')),
    line1: Joi.string().required().description('address line 1').error(new Error('address line is missing')),
    postal_code: Joi.string().required().description('post code').error(new Error('postal code is missing')),
    state: Joi.string().required().description('state').error(new Error('state is missing')),

    day: Joi.string().required().description('Day of your DOB').error(new Error('day of DOB is missing')),
    month: Joi.string().required().description('Month of Your DOB').error(new Error('month of DOB is missing')),
    year: Joi.string().required().description('Year of Your DOB').error(new Error('year of DOB is missing')),

    first_name: Joi.string().required().description('first Name').error(new Error('firstname is missing')),
    last_name: Joi.string().required().description('Last Name').error(new Error('lastName type is missing')),

    document: Joi.string().required().description('Document Image').error(new Error('document is missing')),
    personal_id_number: Joi.string().required().description('9 digits American Id Number').error(new Error('personal id is missing')),
    
    date: Joi.string().required().description('your device date').error(new Error('device date is missing')),
    ip: Joi.string().required().description('Nertwork ip address').error(new Error('ip is missing'))
}).required();

const APIHandler = (req, reply) => {
    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    //Required only for Testing purpose
    // req.auth = {
    //     credentials: { _id: req.payload.id }
    // };
    // req.headers.lan = 0;

    let getAccount = () => {
        return new Promise((resolve, reject) => {
            stripeConnectAccount.getAccount(req.payload.userId, stripeMode)
                .then((data) => {
                    if (data) {
                        stripeLib.retrieveAccount(data.stripeId, (err, account) => {
                            if (err) {
                                stripeModel.stripeError.errorMessage(err, req)
                                    .then((message) => {
                                        return reject({ message: message, code: 500 });
                                    });
                            } else {
                                return resolve(account);
                            }
                        });
                    } else {
                        stripeLib.createAccount({ type: 'custom', country: req.payload.country, email: req.payload.email }, (err, data) => {
                            if (err) {
                                stripeModel.stripeError.errorMessage(err, req)
                                    .then((message) => {
                                        return reject({ message: err.message, code: 500 });
                                    });
                            } else {
                                let insObj = {
                                    user: new ObjectID(req.payload.userId),
                                    mode: stripeMode,
                                    stripeId: data.id
                                };
                                stripeConnectAccount.createAccount(insObj)
                                    .then((insData) => {
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

    let updateInfo = (account) => {
        return new Promise((resolve, reject) => {
            let data = {
                legal_entity: {
                    type: "individual",
                    address: {
                        city: req.payload.city,
                        country: req.payload.country,
                        line1: req.payload.line1,
                        postal_code: req.payload.postal_code,
                        state: req.payload.state
                    },
                    dob: {
                        day: req.payload.day,
                        month: req.payload.month,
                        year: req.payload.year
                    },
                    first_name: req.payload.first_name,
                    last_name: req.payload.last_name,
                    personal_id_number: req.payload.personal_id_number
                },
                tos_acceptance: {
                    date: moment().unix(),
                    ip: req.payload.ip // Assumes you're not using a proxy
                }
            };
            stripeLib.updateAccount(account.id, data, (err, account) => {
                if (err) {
                    stripeModel.stripeError.errorMessage(err, req)
                        .then((message) => {
                            return reject({ message: message, code: 500 });
                        });
                } else {
                    return resolve(account);
                }
            });
        });
    };

    let updateDocument = (account) => {
        return new Promise((resolve, reject) => {
            let filename = 'vf_doc' + moment().unix() + '.jpeg';//temporary image file
            let filePath = './temp/' + filename;//temp folder

            var stream = request.get(req.payload.document)//get the image file from the url
                .pipe(fs.createWriteStream(filePath));//pipe to create a new image file on local system

            //request().get().pipe() emits 'finish' event on completion of creating a file
            stream.on('finish', () => {
                //upload the document file to stripe (required for verification)
                stripeLib.uploadFile(filename, (err, uploadFile) => {
                    if (err) {
                        stripeModel.stripeError.errorMessage(err, req)
                            .then((message) => {
                                return reject({ message: message, code: 500 });
                            });
                    } else {
                        let data = { legal_entity: { verification: { document: uploadFile.id } } };
                        //update the uploadId got on uploading a document file to stripe
                        stripeLib.updateAccount(account.id, data, (err, account) => {
                            if (err) {
                                logger.error('error while updating details : ', err);
                                stripeModel.stripeError.errorMessage(err)
                                    .then((message) => {
                                        return reject({ message: message, code: 500 });
                                    });
                            } else {
                                fs.unlink(filePath, (error) => { });//delete the file on completion on updating document details
                                return resolve(account);
                            }

                        });
                    }
                });
            });
        });
    };

    getAccount()
        .then(updateInfo)
        .then(updateDocument)
        .then((account) => {
            return reply({ message: req.i18n.__('genericErrMsg')['200'] }).code(200);
        }).catch((err) => {
            logger.error("Stripe Post Connect Account error : ", err);
            return reply({ message: err.message }).code(err.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: { message: Joi.any().default(errorMsg['genericErrMsg']['200']) },
    }
}//swagger response code

module.exports = { payload, APIHandler, responseCode };