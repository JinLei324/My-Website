'use strict'
const can_reason = require('../../../../../models/can_reason');
const Auth = require('../../../../middleware/authentication');
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
      can_reason.read({ res_for: 'driver' }, (err, reasons) => {
        if (err) {
            logger.error('Error occurred during managers get (read): ' + JSON.stringify(err));
            return reply({ message: req.i18n.__('genericErrMsg')['500']   }).code(500);
        }
        if (reasons.length > 0) {
            for (let i = 0; i < reasons.length; i++) {
                reasons[i].reasons = reasons[i].reasonObj[req.headers.language]
                delete reasons[i].res_for;
                delete reasons[i].reasonObj;

            }
        }
        return reply({ message:req.i18n.__('getData')['200']   , data: { reasons: reasons } }).code(200);
    });

}


/**
* A module that exports get profile
* @exports handler 
*/
module.exports = { handler }