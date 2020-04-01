'use strict'
const can_reason = require('../../../../../models/can_reason');
const appConfig = require('../../../../../models/appConfig');
const notifications = require('../../../../../library/fcm');
const notifyi = require('../../../../../library/mqttModule');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');



/** 
* @function
* @name loginHandler
* @param  {string} status:  0 - Active , 1 - Banned , 2 - Unverfied
* @param  {string}  loginType -1- Normal login, 2- Fb , 3-Google, if 2,3 socialMediaID required
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
    //req.headers.language = 'en';
    can_reason.read({ res_for: req.auth.credentials.sub }, (err, reasons) => {
        if (err) {
            logger.error('Error occurred get cancel reasons  : ' + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        if (reasons.length > 0) {
            for (let i = 0; i < reasons.length; i++) {
                reasons[i].reasons = reasons[i].reasonObj?reasons[i].reasonObj[req.headers.language]:""
                delete reasons[i].res_for;

            }
        }
        // return reply({ message: error['getData']['200'][req.headers.language], data: reasons }).code(200);
        return reply({ message: req.i18n.__('genericErrMsg')['200'], data: reasons }).code(200);

    });
}
/**
* A module that exports customer signin's handler
* @exports handler 
*/
module.exports = { handler }