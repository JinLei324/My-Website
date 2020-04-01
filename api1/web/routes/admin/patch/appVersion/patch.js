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
    let mandatory = (req.payload.mandatory == 'true') ? true : false;
    appVersions.patchMandatory({ mandatory: mandatory, version: req.payload.version, type: parseInt(req.payload.type) }, (err, appVersion) => {
        if (err) return reply({ message:  req.i18n.__('genericErrMsg')['500']  }).code(500);

        return reply({ message: req.i18n.__('appVersions')['200']   }).code(200);
    });

}
/** 
* @function
* @name newVersionHandler 
* @return {object} Reply to the user.
*/
const newVersionHandler = (req, reply) => {
    let mandatory = (req.payload.mandatory == 'true') ? true : false;
    appVersions.push({ mandatory: mandatory, version: req.payload.version, type: parseInt(req.payload.type) }, (err, appVersion) => {
        if (err) return reply({ message:req.i18n.__('genericErrMsg')['500']  }).code(500);

        return reply({ message: req.i18n.__('appVersions')['200']  }).code(200);
    });
}


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    type: Joi.number().min(1).description('1-android, 2-ios,   2-customer'),
    version: Joi.string().description('version number 1.0.0'),
    mandatory: Joi.string().description('mandatory update to be enabled')
}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const newVersionValidator = {
    type: Joi.number().min(1).description('1-android, 2-ios,   2-customer'),
    version: Joi.string().description('version number 1.0.0'),
    mandatory: Joi.string().description('mandatory update to be enabled')
}
/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, newVersionHandler, validator, newVersionValidator }