'use strict'

const appVersions = require('../../../../../models/appVersions');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language  
const Joi = require('joi');
const logger = require('winston');
var moment = require('moment');
const config = process.env;
const cheerio = require('cheerio');//to extract the html from html files
const fs = require('fs');
const async = require('async');
const distance = require('google-distance');
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {


    let data = {
        type: req.payload.type,
        typeName: req.payload.typeName,
        latestVersion: req.payload.version,
        mandatory: (req.payload.mandatory == 'true') ? true : false,
        versions: [{
            version: req.payload.version,
            timestamp: moment().unix(),
            mandatory: (req.payload.mandatory == 'true') ? true : false
        }],
        timestamp: moment().unix()
    };

    async.series([

        function (cb) {
            appVersions.checkVersion({ type: parseInt(req.payload.type) }, (err, appVersion) => {
                if (err)
                    return cb({ errNum: 500, message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] });

                if (appVersion != null)
                    return cb({ errNum: 400, message: error['appVersionAlreadyExist']['400'][req.headers.language] });

                return cb(null, 'continue');
            });
        },//check if the app with this type already exists

        function (cb) {
            appVersions.save(data, (err, doc) => {
                if (err)
                    return cb({ errNum: 500, message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] });

                return cb(null, 'continue');
            });
        }//create a new type for the app version
    ], (err, results) => {
        if (err) return reply({ message: err.message }).code(err.errNum);
        return reply({ message: error['appVersions']['200'][req.headers.language] }).code(200);
    });

}



/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    type: Joi.number().min(1).description('1-android, 2-ios, 1-driver, 2-customer'),
    typeName: Joi.string().description('name of the app'),
    version: Joi.string().description('version number 1.0.0'),
    mandatory: Joi.string().description('mandatory update to be enabled'),
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }