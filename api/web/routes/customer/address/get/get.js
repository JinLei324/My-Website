const Config = process.env
const ObjectID = require('mongodb').ObjectID;//to convert stringId to mongodb's objectId 
const moment = require('moment');
const savedAddress = require('../../../../../models/savedAddress');
const Joi = require('joi');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const logger = require('winston');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
    // req.headers.language = 'en';
    if (req.auth.credentials.sub == "customer") {

        req.params.userId = new ObjectID(req.auth.credentials._id)
    } else {
        req.params.userId = new ObjectID(req.params.userId)
    }
    savedAddress.getAddress({ userId: req.params.userId }, (err, res) => {
        if (err) {
            logger.error('Error occurred while getting address : ' + err);
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        // return reply({ message: error['getAddress']['200'][req.headers.language], data: res }).code(200);
        return reply({ message: req.i18n.__('getAddress')['200'], data: res }).code(200);
    });
}

/**
* A module that exports address handlers, validators
* @exports handler  
*/

const validator = {
    userId: Joi.string().description('user id ').allow("").optional()
}
module.exports = { handler, validator }