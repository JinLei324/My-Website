'use strict'

const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language  
const Joi = require('joi');
const logger = require('winston');
const smsLog = require('../../../../../models/smsLog');
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
const handler = (request, reply) => {


    smsLog.read({}, (err, data) => {
        if (err) {
            logger.error('Error occurred duringget email logs (read): ' + JSON.stringify(err));
            return reply({ message: request.i18n.__('genericErrMsg')['500']   }).code(500);
        }
        if (data.length > 0) {
            return reply({ message: request.i18n.__('getData')['200'], data: data }).code(200);
        } else
            return reply({ message:request.i18n.__('getData')['404'] }).code(404);
    });



}




/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler }