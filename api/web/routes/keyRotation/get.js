'use strict';

const joi = require('joi');
const logger = require('winston');

const appConfig = require("../../../models/appConfig");
const errorMsg = require("../../../locales");
const notifyi = require("../../../library/mqttModule");


const APIHandler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };
    let appConfigData = "";

    let fetchCurrentKey = () => {
        return new Promise((resolve, reject) => {
            appConfig.getAppConfigration()
                .then((result) => {
                    appConfigData = result;
                    resolve(true);
                })
                .catch((err) => {
                    console.log(err)
                    return reject(dbErrResponse);
                });
        })
    }
    fetchCurrentKey()
        .then(data => {
            let responseData = {
                currentKey: appConfigData.keyRotationArray[appConfigData.currentKeyIndex].currentKey
            }
            return reply({
                message: req.i18n.__('genericErrMsg')['200'],
                data: responseData
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
}//swagger response code

module.exports = { APIHandler, responseCode };