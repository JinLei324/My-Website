'use strict';

const ObjectID = require('mongodb').ObjectID;

const joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const Bcrypt = require('bcrypt');
const md5 = require('md5');

const configuration = require('../../../../configuration');
const JWT = require('jsonwebtoken');
const errorMsg = require('../../../../locales');
const driver = require('../../../../models/driver');
const customer = require('../../../../models/customer');

const payloadValidator = {
    password: joi.string().required().description('password')
}


let handler = (req, reply) => {

    const dbErrResponse = {
        message: req.i18n.__('genericErrMsg')['500'],
        code: 500
    };
    const tokenInvalid = {
        message: 'Invalid Token',
        code: 401
    };

    let userId = "";
    let resetCode = "";
    let collectionName = "";
    let collection = "";
    let password = "";

    const decodeToken = function () {
        return new Promise((resolve, reject) => {
            JWT.verify(req.headers.authorization, configuration.JWT_KEY, {
                subject: 'resetPassword'
            }, (err, decoded) => {
                if (err)
                    return reject(tokenInvalid);
                else {
                    userId = decoded.id;
                    resetCode = decoded.resetCode;
                    collectionName = decoded.collectionName;
                    return resolve(true);
                }
            });
        });
    }

    let getCollection = () => {
        return new Promise((resolve, reject) => {
            switch (collectionName) {
                case 'driver':
                    password = Bcrypt.hashSync(req.payload.password, parseInt(configuration.SALT_ROUND));
                    collection = driver;
                    break;
                case 'customer':
                    password = Bcrypt.hashSync(req.payload.password, parseInt(configuration.SALT_ROUND));
                    collection = customer;
                    break;
                default:
                    return reject(tokenInvalid);
                    break;
            }
            return resolve(true);
        });
    };

    const validateResetCode = function (notificationData) {
        return new Promise((resolve, reject) => {
            collection.SelectOne({
                _id: new ObjectID(userId),
                'resetCode': resetCode
            }, (err, data) => {
                if (err)
                    return reject(dbErrResponse);
                else if (data === null)
                    return reject(tokenInvalid);
                else
                    return resolve(true);
            });
        });
    }

    const updatePassword = function (notificationData) {
        return new Promise((resolve, reject) => {
            let qryData = {
                query: {
                    _id: new ObjectID(userId),
                    'resetCode': resetCode
                },
                data: {
                    '$set': {
                        'password': password,
                        resetCode: '',
                        resetUrl: ''
                    }
                }
            }
            collection.findOneAndUpdate(qryData, (err, result) => {
                if (err)
                    return reject(dbErrResponse);
                else
                    return resolve(true);
            });

        });
    }

    decodeToken()
        .then(getCollection)
        .then(validateResetCode)
        .then(updatePassword)
        .then(data => {
            return reply({
                message: req.i18n.__('genericErrMsg')['200']
            }).code(200);
        }).catch(e => {
            logger.error("error in validate reselt link API =>", e)
            return reply({
                message: e.message
            }).code(e.code);
        });
};

const responseCode = {
    status: {
        200: {
            message: joi.any().default(errorMsg['genericErrMsg']['200'])
        },
        500: {
            message: joi.any().default(errorMsg['genericErrMsg']['500'])
        }
    }
} //swagger response code



module.exports = {
    payloadValidator,
    handler,
    responseCode
};