
'use strict';

const joi = require('joi');
const Bcrypt = require('bcrypt');
const logger = require('winston');

const errorMsg = require('../../../../locales');
const adminUsers = require('../../../../models/superadmin');
const Auth = require('../../../middleware/authentication');
const configuration = process.env;

const payload = joi.object({
    email: joi.string().required().description('admin email'),
    password: joi.string().required().description('encrpted password')
}).required();

const handler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    const getUser = () => {
        return new Promise((resolve, reject) => {
            let condition = { email: req.payload.email, pass: req.payload.password }
            adminUsers.SelectOne(condition, (err, res) => {
                if (err)
                    reject(dbErrResponse)
                else if (res === null) {
                    reject({ message: req.i18n.__('adminPostSignIn')['404'], code: 404 })
                } else {
                    resolve(res);
                }
            })
        });
    }//get admin by phone or email

    const responseData = (data) => {
        return new Promise((resolve, reject) => {
            let authToken = Auth.SignJWT(
                {
                    _id: data._id.toString(),
                    key: 'acc',
                    deviceId: 'web'
                },
                'admin',
                configuration.jwtTokenExpTime
            );//sign a new JWT

            let responseArr = {
                token: authToken,
                'adminMqttChannel': configuration.ADMIN_MQTT_CHANNEL,
            }
            resolve(responseArr);
        });
    }//response data to the api

    getUser()
        .then(responseData)
        .then(data => {

            return reply({ message: req.i18n.__('genericErrMsg')['200'], data: data }).code(200);
        }).catch(e => {
            logger.error("admin postSignIn API error =>", e)
            return reply({ message: e.message }).code(e.code);
        });

};

const responseCode = {
    status: {
        200: { message: joi.any().default(errorMsg['genericErrMsg']['200']), data: joi.any() },
        404: { message: joi.any().default(errorMsg['adminPostSignIn']['404']) },
        500: { message: joi.any().default(errorMsg['genericErrMsg']['500']) }
    }
}//swagger response code


module.exports = {
    payload,
    handler,
    responseCode
};