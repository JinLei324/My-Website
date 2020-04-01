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

const validator = {
    customerId: Joi.string().allow('').description('address line 1'),
    addLine1: Joi.string().required().description('address line 1'),
    addLine2: Joi.string().description('address line 2').allow(""),
    flatNumber: Joi.string().description('flat Number').allow(""),
    landmark: Joi.string().description('landmark').allow(""),
    city: Joi.string().required().description('city'),
    state: Joi.string().required().description('state'),
    country: Joi.string().required().description('country'),
    placeId: Joi.string().description('placeId').allow(""),
    pincode: Joi.string().description('pincode').error(new Error('Pincode must be number')),
    latitude: Joi.number().description('latitude').error(new Error('Latitude must be number')),
    longitude: Joi.number().description('longitude').error(new Error('Longitude must be number')),
    taggedAs: Joi.string().description('office / home').allow("")
}

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
            createdBy = req.auth.credentials.sub;
            req.payload.userId = { _id: new ObjectID(req.payload.customerId) }
            break;
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
    }
    req.headers.language = 'en';
    // req.payload.userId = new ObjectID(req.auth.credentials._id)
    savedAddress.saveDetails(req.payload, (err, res) => {
        if (err) {
            logger.error('Error occurred while adding address : ' + err);
            // return reply({ message: error['genericErrMsg']['500'][req.headers.language] }).code(500);
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
module.exports = {
    validator,
    handler
}