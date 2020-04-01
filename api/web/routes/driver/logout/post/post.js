'use strict'
const driver = require('../../../../../models/driver');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../locales');  // response messages based on language 
const config = process.env;
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const dispatcher = require('../../../../commonModels/dispatcher');
/** 
* @function
* @name logoutHandler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    driver.isExistsWithId({ _id: new ObjectID(request.auth.credentials._id) }, (err, res) => {
        if (err) {
            logger.error('Error occurred during driver logout (isExistsWithId): ' + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                           
        }
        else if (res) {
            if (typeof res.vehicleId != 'undefined' && ObjectID.isValid(res.vehicleId)) {
                vehicles.patchLogoutStatus({ _id: new ObjectID(res.vehicleId) }, (err, vehicles) => {
                    logger.error('Error occurred during driver logout (patchlogoutStatus1): ' + JSON.stringify(err));
                });
            }
            driver.patchlogoutStatus({ _id: new ObjectID(request.auth.credentials._id) }, (err, result) => {
                if (err) {
                    logger.error('Error occurred during driver logout (patchlogoutStatus2): ' + JSON.stringify(err));
                    // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                else
                    driver.deleteFromPresence({ key: 'presence_' + request.auth.credentials._id.toString() }, (err, result) => {
                        if (err)
                            logger.error('Error occurred during driver logout (deleteFromPresence): ' + JSON.stringify(err));
                    });
                dispatcher.providerStatus({ _id: request.auth.credentials._id.toString() }, (err, res) => { });
                // return reply({ message: error['supportLogOut']['200'] }).code(200);
                return reply({ message: request.i18n.__('supportLogOut')['200'] }).code(200);
            }); 
        } else {
            // return reply({ message: error['genericErrMsg']['498'] }).code(498);
            return reply({ message: request.i18n.__('genericErrMsg')['498'] }).code(498);
        }
    });
}

/**
* A module that exports customerSignup's handler! 
* @exports handler 
*/
module.exports = { handler }