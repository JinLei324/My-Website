'use strict'
const customer = require('../../../../../models/customer');
const driverPresenceDaily = require('../../../../../models/driverPresenceDaily');
const storeManagers = require('../../../../../models/storeManagers');
const error = require('../../../../../locales');  // response messages based on language  
const presence = require('../../../../commonModels/presence');
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment')
const config = process.env;
const cheerio = require('cheerio');//to extract the html from html files
const fs = require('fs');
const async = require('async');
const distance = require('google-distance');
const ObjectID = require('mongodb').ObjectID;

const notifications = require('../../../../../library/fcm');
const notifyi = require('../../../../../library/mqttModule');
const dispatcher = require('../../../../commonModels/dispatcher');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {

    let queryObj = {
       mid: new ObjectID(req.payload.userId)  
    };

    if (typeof req.payload.from != 'undefined' && typeof req.payload.to != 'undefined') {
        logger.warn('condition1');
         queryObj['timestamp'] = {
              $gte: moment(req.payload.from).startOf('day').unix(), $lte: moment(req.payload.to).endOf('day').unix()
        };
    }
    else if (typeof req.payload.from != 'undefined') {
        logger.warn('condition2');
         queryObj['timestamp'] = moment(req.payload.from).startOf('day').unix();
    }
    else {
        logger.warn('condition3');
        ;//do not include anything in condition
    }


    driverPresenceDaily.isExists(queryObj, (err, data) => {
        if (err) {
            logger.error('Error occurred during admin check user (isExistsWithId): ' + JSON.stringify(err));
            return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
        }
        if (data.length > 0) {
            return reply({
                message: Joi.any().default(i18n.__('genericErrMsg')['200']), data: data
            }).code(200);
        } else {
            return reply({ message: error['getData']['404'] }).code(404);
        }

    });




}


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    userId: Joi.string().required().description('user Id'),
    from: Joi.string().description('from timestamp'),
    to: Joi.string().description('to timestamp')
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }