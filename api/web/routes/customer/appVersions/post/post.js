'use strict'
const appVersions = require('../../../../../models/appVersions');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const _ = require('underscore-node');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    appVersions.checkVersion({ type: parseInt(request.payload.type) }, (err, appVersion) => {
        if (err) {
            logger.error('Error occurred during driver email phone validate (checkVersion): ' + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        if (appVersion === null)
            // return reply({ message: error['appVersions']['404'][request.headers.language] }).code(404);
            return reply({ message: request.i18n.__('appVersions')['404'] }).code(404);
        if (appVersion.latestVersion != request.payload.version)
            // return reply({ message: error['appVersions']['400'][request.headers.language], data: { mandatory: appVersion.mandatory, version: appVersion.latestVersion } }).code(400);
            return reply({ message: request.i18n.__('appVersions')['400'], data: { mandatory: appVersion.mandatory, version: appVersion.latestVersion } }).code(400);
        // return reply({ message: error['appVersions']['200'][request.headers.language] }).code(200);
        return reply({ message: request.i18n.__('appVersions')['200'] }).code(200);

    });
}
/** 
* @function
* @name validator 
* @return {object} Reply to the user.
*/
const validator = {

    type: Joi.number().required().min(1).description('1-android, 2-ios,  2-customer'),
    version: Joi.string().description('version number 1.0.0'),
}

/**
* A module that exports get vehicle type Handler,validator! 
* @exports handler 
*/
module.exports = { handler, validator }