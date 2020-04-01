const Config = process.env
const ObjectID = require('mongodb').ObjectID; //to convert stringId to mongodb's objectId
const moment = require('moment');
const savedAddress = require('../../../../../models/savedAddress');
const Joi = require('joi');
const error = require('../../../../../statusMessages/responseMessage'); // response messages based on language
const config = process.env;
const logger = require('winston');
/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */
const handler = (req, reply) => {
    // req.headers.language = 'en';
    // req.payload.userId = new ObjectID(req.auth.credentials._id)
    if (req.auth.credentials.sub == "customer") {
        req.payload.userId = new ObjectID(req.auth.credentials._id)
    } else {
        req.payload.userId = new ObjectID(req.payload.userId)
    }

    req.payload.addressId = new ObjectID(req.payload.addressId)

    savedAddress.patchAddress(req.payload, (err, res) => {
        if (err) {
            logger.error('Error occurred while updating address : ' + err);
            // return reply({ message: error['genericErrMsg']['500'][req.headers.language] }).code(500);
            return reply({
                message: req.i18n.__('genericErrMsg')['500']
            }).code(500);
        }
        // return reply({ message: error['editAddress']['200'][req.headers.language],data : res.value }).code(200);
        return reply({
            message: req.i18n.__('editAddress')['200'],
            data: res.value
        }).code(200);
    });
}
/**
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    addressId: Joi.string().required().min(24).max(24).description('59c5043985cc1a6c0b029e4c').error(new Error('addressId must be a 24 number')),
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
    taggedAs: Joi.string().description('office / home').allow(""),
    userId: Joi.string().description('User id ').allow(""),
    countryCode: Joi.string().description('countryCode ').allow(""),
    phoneNumber: Joi.string().description('phoneNumber ').allow(""),
    addedFrom: Joi.string().description('1 - google, 2 - Inwani').allow(""),
    zoneNumber: Joi.number().description('zoneNumber').allow(""),
}
/**
 * A module that exports address handlers, validators
 * @exports handler
 */
module.exports = {
    validator,
    handler
}
