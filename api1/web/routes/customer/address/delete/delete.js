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
    savedAddress.removeAddress({ _id: new ObjectID(req.params.id) }, (err, res) => {
        if (err) {
            logger.error('Error occurred while deleting address : ' + err);
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        // return reply({ message: error['removeAddress']['200'][req.headers.language] }).code(200);
        return reply({ message: req.i18n.__('removeAddress')['200'] }).code(200);
    });
}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    id: Joi.string().required().min(24).max(24).description('59c5043985cc1a6c0b029e4c').error(new Error('addressId must be a 24 number')),
}
/**
* A module that exports address handlers, validators
* @exports handler  
*/
module.exports = { validator, handler }