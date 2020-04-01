'use strict';

const path = require('path');
const joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const errorMsg = require('../../../../locales');
const JWT = require('jsonwebtoken');
const configuration = require('../../../../configuration');
const driver = require('../../../../models/driver');
const customer = require('../../../../models/customer');

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
                    collection = driver;
                    break;
                case 'customer':
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

    decodeToken()
        .then(getCollection)
        .then(validateResetCode)
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
}

module.exports = {
    handler,
    responseCode
};