'use strict'
const customer = require('../../../../../models/customer');
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
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
   // req.headers.language ='en';
    customer.isExistsWithId({ _id: new ObjectID(req.auth.credentials._id) }, (err, doc) => {
        if (err) {
            logger.error('Error occurred during customer profile get (isExistsWithId): ' + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        if (doc === null)
            // return reply({ message: error['genericErrMsg']['498'][req.headers.language] }).code(498);
            return reply({ message: req.i18n.__('genericErrMsg')['498'] }).code(498);
        return reply({
            message:req.i18n.__('getProfile')['200'],
            data: {
                'name': doc.name ? doc.name : '',
                'countryCode': doc.countryCode ? doc.countryCode : '',
                'mobile': doc.phone ? doc.phone : '',
                'email': doc.email ? doc.email : "",
                'profilePic': doc.profilePic ? doc.profilePic : "",
                'mmjCard': { url: doc.mmjCard ? doc.mmjCard.url : "", verified: doc.mmjCard ? doc.mmjCard.verified : false },
                'identityCard': { url: doc.identityCard ? doc.identityCard.url : "", verified: doc.identityCard ? doc.identityCard.verified : false }
            }
        }).code(200);
    });

}


/**
* A module that exports get profile
* @exports handler 
*/
module.exports = { handler }