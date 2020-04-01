'use strict'
const customer = require('../../../../../models/customer');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../locales');  // response messages based on language 
const config = process.env;
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
/** 
* @function
* @name logoutHandler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    customer.isExistsWithId({ _id: new ObjectID(request.auth.credentials._id) }, (err, res) => {
        if (err) {
            logger.error('Error occurred during customer logout (check): ' + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        } else if (res)
            customer.patchloggedOutStatus({ _id: new ObjectID(request.auth.credentials._id) }, (err, result) => {
                if (err) {
                    logger.error('Error occurred during customer logout (update): ' + JSON.stringify(err));
                    // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                } else
                    // return reply({ message: error['supportLogOut']['200'] }).code(200);
                    return reply({ message: request.i18n.__('supportLogOut')['200'] }).code(200);
            });
        else
            // return reply({ message: error['genericErrMsg']['498'] }).code(498);
            return reply({ message: request.i18n.__('genericErrMsg')['498'] }).code(498);
    });
}

/**
* A module that exports customerSignup's handler! 
* @exports handler 
*/
module.exports = { handler }