'use strict';

const joi = require('joi');
const logger = require('winston');

const appConfig = require('../../../models/appConfig');
const errorMsg = require('../../../locales');
const notifyi = require("../../../library/mqttModule");

const payloadValidator = {
    billingAccountId: joi.string().required().description('billingAccountId'),
}

const APIHandler = (req, reply) => {
    console.log(req.payload);


    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };
    let validateKeyRotation = () => {
        return new Promise((resolve, reject) => {

            appConfig.updateRotationKey({ "keyRotationArray.billingAccountId": req.payload.billingAccountId }, {
                $set: { "keyRotationArray.$.completeQuotaLimit": true }
            }, function (err, result) {
                let response = result.value

                let currentIndex = 0;
                let updateCurrentIndex = 0;
                response.keyRotationArray.forEach(element => {
                    if (typeof element.completeQuotaLimit == 'undefined' || (element.completeQuotaLimit == false && updateCurrentIndex == 0)) {
                        updateCurrentIndex = currentIndex;
                    }
                    currentIndex++;
                });

                let updateData = {
                    "currentKeyIndex": updateCurrentIndex
                }

                appConfig.fineAndUpdate({ "keyRotationArray.billingAccountId": req.payload.billingAccountId }, updateData, function (err, result) {
                    if (err)
                        return reject(dbErrResponse);

                    notifyi.notifyRealTime({
                        listner: 'googleMapKey',
                        message: {
                            status: 17,
                            googleMapKey: response.keyRotationArray[updateCurrentIndex].currentKey
                        },
                        qos: 2
                    });
                    console.log("-------------->>>>>>>>>", response.keyRotationArray[updateCurrentIndex].currentKey)
                    resolve(true)
                });
            })
        });
    }
    validateKeyRotation()
        .then(data => {
            return reply({
                message: req.i18n.__('genericErrMsg')['200']
            }).code(200);
        }).catch(e => {
            logger.error("Customer get Languages API error =>", e)
            return reply({ message: e.message }).code(e.code);
        });
};

const responseCode = {
    status: {
        500: { message: joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: {
            message: joi.any().default(errorMsg['genericErrMsg']['200']),
            data: joi.any()
        }
    }
} //swagger response code

module.exports = { APIHandler, responseCode, payloadValidator };