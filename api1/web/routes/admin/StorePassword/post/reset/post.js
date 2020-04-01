'use strict'

const stores = require('../../../../../../models/stores');
const verificationCode = require('../../../../../../models/verificationCode');
const error = require('../../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const md5 = require('md5');
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const jwt = require('jsonwebtoken');
const cheerio = require('cheerio');//to extract the html from html files
const rabbitMq = require('../../../../../../library/rabbitMq');
const fs = require('fs');
const Message = require('../../../../../../statusMessages/statusMessages');
/** 
* @function
* @name loginHandler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => { //Action
    let token = req.payload.token;
    let collectionName = '';

    async.waterfall([
        (cb) => {
            jwt.verify(token, config.Secret, (err, decoded) => {
                if (err) {
                    logger.error('Error occurred during superadmin reset password (isExists): ' + JSON.stringify(err));
                    return cb(err);
                }
                return cb(null, decoded);
            });
        },//verify if the token is valid

        (decoded, cb) => {
            verificationCode.isExists({ _id: new ObjectID(decoded.id) }, (err, doc) => {
                if (err) {
                    logger.error('Error occurred during storeadmin reset password (isExists): ' + JSON.stringify(err));
                    return cb(err);
                }
                if (doc === null) return cb({ errNum: 400, errMsg: 'Link expired!', errFlag: 1 });

                if (doc.lastToken === token) return cb({ errNum: 400, errMsg: 'Link expired!', errFlag: 1 });

                return cb(null, decoded, doc);
            });
        },//verify if the reset password request is a valid & link cannot be used multiple times

        (decoded, doc, cb) => {

            //collectionName = (decoded.type === 1) ? 'storeadmin' : 'storeadmin';
            stores.isExistsWithId({ _id: new ObjectID(doc.userId) }, (err, user) => {
                if (err) {
                    logger.error('Error occurred during storeadmin reset password (isExistsWithId): ' + JSON.stringify(err));
                    return cb(err);
                }
                if (doc === null) return cb({ errNum: 400, errMsg: 'Link expired!', errFlag: 1 }); // doubt doc or user

                return cb(null, decoded, doc, user);
            });
        },//check if the user is valid

        (decoded, doc, user, cb) => {

            //var password = Bcrypt.hashSync(req.payload.password, parseInt(config.SaltRounds));//hash the password and store in db
            // var password = md5(req.payload.password);//hash the password and store in db
            var password = req.payload.password;//hash the password and store in db
            stores.setPassword({ _id: new ObjectID(doc.userId), password: password }, (err, result) => {
                if (err) {
                    logger.error('Error occurred during storeadmin reset password (setPassword): ' + JSON.stringify(err));
                    return cb(err);
                }
                return cb(null, doc, user);
            });
        },//update the hashed password

        (doc, user, cb) => {
            verificationCode.setLastToken({ _id: new ObjectID(doc._id), lastToken: token }, (err, result) => {
                if (err) {
                    logger.error('Error occurred during storeadmin reset password (setLastToken): ' + JSON.stringify(err));
                    return cb(err);
                }

                return cb(null, user);
            });
        },//update the lastToken used
    ], (err, result) => {
        
        if (err) {
            logger.error('Error occurred during storeadmin reset password (callback): ' + JSON.stringify(err));
            return reply(err);
        }
        fs.readFile(config.prodEmailTemplateUrl + 'superadminpasswordchangebysuperadmin.html', (err, body) => {
            if (err) {
                logger.error('Error occurred during storeadmin reseted password (readFile): ' + JSON.stringify(err));
            }
            var $ = cheerio.load(body);
            Object.keys({ username: result.name, appName: config.appName }).forEach(key => {
                $(key).replaceWith({ username: result.name, appName: config.appName }[key]);
            });
            if (config.mailGunService == "true") {
                let param = {
                    from: "" + config.appName + " <" + config.emailsFromEmail + ">",
                    email: result.email,
                    subject: config.appName + ' storeadmin password change',
                    body: $('body').html(),
                    trigger: 'Reset Password'
                }
                rabbitMq.sendToQueue(rabbitMq.queueEmail, param, (err, doc) => {
                });
            }
            return reply({ errNum: 200, errMsg: req.i18n.__('supportPassword')['200'], errFlag: 0 });
        });

    });
}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    token: Joi.string().required().description('Token'),
    password: Joi.string().required().description('Password')
}




/**
* A module that exports storeadmin reset password handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }