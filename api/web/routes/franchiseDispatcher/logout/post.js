'use strict'
const users = require('../../../../models/users');
const error = require('../../../../locales');  // response messages based on language 
const config = process.env;
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const logger = require('winston');
const dispatcher = require('../../../commonModels/dispatcher');

// const handler = (request, reply) => {
//     return reply({ message: request.i18n.__('supportLogOut')['200'], data: {} }).code(200);
// }
const handler = (request, reply) => {
    users.SelectOne({ _id: new ObjectID(request.auth.credentials._id) }, (err, res) => {
        if (err) {
            logger.error('Error occurred during driver logout (isExistsWithId): ' + JSON.stringify(err));
            // return reply({ message: error['genericErrMsg']['500'] }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

        }
        else if (res) {
            users.patchlogoutStatus({ _id: new ObjectID(request.auth.credentials._id) }, (err, result) => {
                if (err) {
                    logger.error('Error occurred during driver logout (patchlogoutStatus2): ' + JSON.stringify(err));
                    // return reply({ message: error['genericErrMsg']['500'] }).code(500);
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                else
                    // return reply({ message: error['supportLogOut']['200'] }).code(200);
                    return reply({ message: request.i18n.__('supportLogOut')['200'], data: {} }).code(200);
            });
        } else {
            // return reply({ message: error['genericErrMsg']['498'] }).code(498);
            return reply({ message: request.i18n.__('genericErrMsg')['498'] }).code(498);
        }
    });
}

const responseCode = {
    status: {
        // 200: { message: error['postLogOut']['200'][error['lang']] }
    }

}//swagger response code

module.exports = {
    handler,
    responseCode
}