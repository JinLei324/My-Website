'use strict'
const driver = require('../../../../../models/driver');
const Auth = require('../../../../middleware/authentication');
const presence = require('../../../../commonModels/presence');
const error = require('../../../../../locales');  // response messages based on language 
const notifyi = require('../../../../../library/mqttModule/mqtt');
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const notifyiWebsocket = require('../../../../../library/websocket/websocket');
const dispatcher = require('../../../../commonModels/dispatcher');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {

    const read = (itemId, zoneId) => {
        return new Promise((resolve, reject) => {
            driver.isExistsWithId({ _id: new ObjectID(req.auth.credentials._id.toString()) }, (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });

        });
    }
    read().then(driverData => {
        let warnMessage = '';
        switch (driverData.status) {
            case 7:
                warnMessage = error['messages']['ban']  ;
                return reply({ message: warnMessage}).code(498);
                break; //cb reject
            case 6:
                warnMessage =  error['messages']['reject'] ;
                return reply({ message: warnMessage}).code(498);
                break; //cb success
            case 1:
                warnMessage =  error['messages']['new'];
                return reply({ message: warnMessage}).code(498);
                break;
            case 8:
                warnMessage = error['messages']['loggedOut'];
                return reply({ message: warnMessage}).code(498);
                break; //cb ban 
        };

        driver.patchOnlineStatus({
            _id: new ObjectID(req.auth.credentials._id), status: parseInt(req.payload.status)
        }, (err, bookings) => {
            if (err) {
                logger.error('Error occurred during driver status update (patchOnlineStatus) : ' + JSON.stringify(err));
                  return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
            }
            if (bookings) {   //invoke a method to log the driver presence time
                presence.driverStatusPresence({ mid: req.auth.credentials._id, status: req.payload.status }, (err, res) => {
                });
                if (req.payload.status == 4) {
                    driver.deleteFromPresence({ key: 'presence_' + req.auth.credentials._id.toString() }, (err, result) => {
                        if (err) logger.error('Error occurred during driver off job (deleteFromPresence): ' + JSON.stringify(err));
                    });
                }

                // websocket
                dispatcher.providerStatus({ _id: req.auth.credentials._id.toString() },
                    (err, res) => {
                        if (err) logger.error('websocket response success api onlineoffline: ' + JSON.stringify(err));
                    });
                  return reply({ message: req.i18n.__('slaveUpdateProfile')['200'] }).code(200);
            }
        });
    }).catch(e => {
        logger.error('err during get fare(catch) ' + JSON.stringify(e));
         return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
    });
}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    status: Joi.number().required().integer().min(3).max(4).description('3- Online ,  4- Offline'),
}


/**
* A module that exports update status API!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }