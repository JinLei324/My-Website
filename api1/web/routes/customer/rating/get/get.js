'use strict'
const ratingParams = require('../../../../../models/RatingParams');
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
 * @return {object} Reply to the user.
*/
const handler = (req, reply) => {
    //  req.headers.language = 'en';
    let cond = {
        "associated": { $in: [1, 2] },
        "status": 1,
        "storeType": req.params.storeType.toString()
    };
    // storeType
    ratingParams.read(cond, (err, params) => {
        if (err) {
            logger.error('Error occurred get cancel reasons  : ' + JSON.stringify(err));
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
        }
        if (params.length > 0) {
            for (let i = 0; i < params.length; i++) {
                params[i].name = params[i].name[req.headers.language] ? params[i].name[req.headers.language] : params[i].name["en"],
                    params[i].attributes = params[i].attributes ? params[i].attributes[req.headers.language] : [];
            }
        }
        return reply({ message: req.i18n.__('getData')['200'], data: params }).code(200);
        // return reply({ message: error['getData']['200'][req.headers.language], data: params }).code(200);
    });
}
/**
* A module that exports customer ratings handler
* @exports handler 
*/
const validator = {
    storeType: Joi.number().integer().min(0).max(10).description('storeType : 1 for Grocery, 2 for restarent, 0 for all order'),
}
module.exports = { handler, validator }