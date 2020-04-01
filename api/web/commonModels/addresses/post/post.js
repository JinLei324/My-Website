const Config = process.env
const ObjectID = require('mongodb').ObjectID;//to convert stringId to mongodb's objectId 
const moment = require('moment');
const savedAddress = require('../../../../models/savedAddress');
const Joi = require('joi');
const error = require('../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const logger = require('winston');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
    let createdBy = '';
    switch (req.auth.credentials.sub) {
        case 'customer':
            createdBy = req.auth.credentials.sub;
            req.payload.userId = { _id: new ObjectID(req.auth.credentials._id.toString()) }
            break;
        case 'manager':
            createdBy = req.auth.credentials.sub;
            req.payload.userId = { _id: new ObjectID(req.payload.customerId) }
            break;
        default:
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
    }
    req.headers.language = 'en';
    // req.payload.userId = new ObjectID(req.auth.credentials._id)
    savedAddress.saveDetails(req.payload, (err, res) => {
        if (err) {
            logger.error('Error occurred while adding address : ' + err);
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        // return reply({ message: error['addAddress']['200'][req.headers.language], data: res.ops[0] }).code(200);
        return reply({ message: req.i18n.__('addAddress')['200'], data: res.ops[0] }).code(200);
    });
}

/**
* A module that exports address handlers, validators
* @exports handler  
*/
module.exports = { handler }