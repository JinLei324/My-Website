'use strict'
const config = process.env;
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const Bcrypt = require('bcrypt');//hashing module 
const logger = require('winston');
const users = require('../../../../models/users');
const stores = require('../../../../models/stores');
const Auth = require('../../../middleware/authentication');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {

    users.SelectOne({ _id: new ObjectID(req.auth.credentials._id) }, (err, doc) => {
        if (err) {
            logger.error('Error occurred during customer profile get (isExistsWithId): ' + JSON.stringify(err));
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        if (doc === null)
            return reply({ message: req.i18n.__('managerSignIn')['404'] }).code(404);
        return reply({
            message: req.i18n.__('slaveProfile')['200'],
            data: doc
        }).code(200);
    });

}


/**
* A module that exports get profile
* @exports handler 
*/
module.exports = { handler }