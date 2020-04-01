'use strict'

const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language  
const Joi = require('joi');
const logger = require('winston');
const appVersions = require('../../../../../models/appVersions');
const config = process.env;
const ObjectID = require('mongodb').ObjectID;
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {

    appVersions.read({ type: parseInt(request.params.type) }, (err, data) => {
        if (err) {
            logger.error('Error occurred duringget email logs (read): ' + JSON.stringify(err));
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        if (data.length > 0) {
            return reply({ message: request.i18n.__('getData')['200'], data: data }).code(200);
        } else
            return reply({ message: request.i18n.__('getData')['404'] }).code(404);
    });



}


const validator = {
    type: Joi.number().integer().required().description('type of the app 11-android driver, 21-ios driver, 12-android customer, 22-ios customer ')
}

/**
* A module that exports customer get appversions handler  
* @exports handler 
*/
module.exports = { handler, validator }