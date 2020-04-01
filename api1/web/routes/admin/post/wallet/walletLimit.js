'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;

const errorMsg = require('../../../../../locales');
const wallet = require('../../../../../worker/wallet/wallet')

const payload = Joi.object({
    userType: Joi.number().required().description('USER TYPE(1-SLAVE, 2-MASTER,3-OPERATOR, 6-INSTUTION)'),
    userId: Joi.string().required().description('user Id'),
    walletAction: Joi.any().description('wallet action if enable and disable from admin side 0 - disable , 1- enable')
}).required();

const APIHandler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    const checkIfAnyLimitHit = () => {
        return new Promise((resolve, reject) => {
            let inputData = {
                txnTypeTxt: "Wallet Limit Chang",
                amount: 0,
                userId: req.payload.userId,
                userType: req.payload.userType,
                walletAction: (typeof req.payload.walletAction === 'undefined') ? (parseInt(2)) : parseInt(req.payload.walletAction)
            };
            wallet.checkIfAnyLimitHit(inputData, (err, res) => {
                if (err)
                    reject(err);
                else
                    resolve(true);
            });
        });
    }

    checkIfAnyLimitHit()
        .then(data => {
            return reply({ message: req.i18n.__('genericErrMsg')['200'] }).code(200);
        }).catch(e => {
            logger.error("wallet limit api error =>", e)
            return reply({ message: e.message }).code(e.code);
        });
};

const responseCode = {
    status: {
        200: { message: Joi.any().default(errorMsg['genericErrMsg']['200']) },
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) }
    }
}

module.exports = { payload, APIHandler, responseCode };