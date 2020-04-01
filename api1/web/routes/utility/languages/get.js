'use strict';

const Joi = require('joi');
const logger = require('winston');

const languages = require('../../../../models/langHelp');
const errorMsg = require('../../../../locales');

const APIHandler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    let getLangauges = () => {
        return new Promise((resolve, reject) => {
            languages.Select({ "Active": 1 }, function (err, result) {
                if (err)
                    return reject(dbErrResponse);
                else if (result) {
                    resolve(result);
                } else {
                    return reject(dbErrResponse);
                }
            });
        });
    }
    getLangauges()
        .then(data => {
            data.push(
                {
                    "_id": 0,
                    "lan_id": 0,
                    "lan_name": "english",
                    "langCode": "en",
                    "Active": 1
                }
            );
            return reply({ message: req.i18n.__('genericErrMsg')['200'], data: data }).code(200);
        }).catch(e => {
            logger.error("Customer get Languages API error =>", e)
            return reply({ message: e.message }).code(e.code);
        });
};

const responseCode = {
    status: {
        500: { message: Joi.any().default(errorMsg['genericErrMsg']['500']) },
        200: {
            message: Joi.any().default(errorMsg['genericErrMsg']['200']),
            data: Joi.any()
        }
    }
}//swagger response code

module.exports = { APIHandler, responseCode };