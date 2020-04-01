const config = process.env
const ObjectID = require('mongodb').ObjectID;//to convert stringId to mongodb's objectId 
const moment = require('moment');
const savedAddress = require('../../../../../models/savedAddress');
const Joi = require('joi');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language
const logger = require('winston');
/** salesforce
* @library
* @author Umesh Beti
*/
const superagent = require('superagent');
const sf = require('../../../../../library/salesforce');
/*salesforce*/
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
    savedAddress.saveDetails(req.payload, (err, res) => {
        if (err) {
            logger.error('Error occurred while adding address : ' + err);
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        // return reply({ message: error['addAddress']['200'][req.headers.language], data: res.ops[0] }).code(200);
        /** salesforce
            * @library
            * @author Umesh Beti
            */
        if (config.salesforceService) {
            var authData = sf.get();
            var DataToSF =
            {
                "mongoId": req.payload.userId ? req.payload.userId : '',
                "addressType": req.payload.taggedAs ? req.payload.taggedAs : 'other',
                "phoneNumber": req.payload.phoneNumber ? req.payload.phoneNumber : '',
                "flatNo": req.payload.flatNumber ? req.payload.flatNumber : '',
                "landmark": req.payload.landmark ? req.payload.landmark : '',
                "addressLine1": req.payload.addLine1 ? req.payload.addLine1 : '',
                "addressLine2": req.payload.addLine2 ? req.payload.addLine2 : '',
                "city": req.payload.city ? req.payload.city : '',
                "state": req.payload.state ? req.payload.state : '',
                "country": req.payload.country ? req.payload.country : '',
                "postalCode": req.payload.pincode ? req.payload.pincode : ''
            }
            logger.info('--DataToSF--', DataToSF);
            if (authData) {
                superagent
                    .patch(authData.instanceUrl + '/services/apexrest/delivx/Contact')
                    .send(DataToSF) // sends a JSON post body
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Bearer ' + authData.accessToken)
                    .end((err, res) => {
                        if (res.status == 200 || res.statusCode == 200) {
                            logger.info('post new customer address to salesforece success(single).');

                        } else if (res.status == 204 || res.statusCode == 204) {
                            logger.info('this customer is not found on salesforce, can\'t insert address to salesforece(single).');
                        } else if (err) {
                            logger.info('post new customer address to salesforece failes(single).')
                        }
                    });
            }
            var DataToSF1 =
            {
                "mongoId": res.ops[0]._id,

                "addressType": req.payload.taggedAs ? req.payload.taggedAs : 'Other',
                "flatNo": req.payload.flatNumber ? req.payload.flatNumber : '',
                "landmark": req.payload.landmark ? req.payload.landmark : '',
                "addressLine1": req.payload.addLine1 ? req.payload.addLine1 : '',
                "addressLine2": req.payload.addLine2 ? req.payload.addLine2 : '',
                "city": req.payload.city ? req.payload.city : '',
                "state": req.payload.state ? req.payload.state : '',
                "country": req.payload.country ? req.payload.country : '',
                "pincode": req.payload.pincode ? req.payload.pincode : '',
                "customerMongoId": req.payload.userId ? req.payload.userId : ''

            }
            if (authData) {
                superagent
                    .post(authData.instanceUrl + '/services/apexrest/delivx/UserMultipleAddress')
                    .send(DataToSF1) // sends a JSON post body
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Bearer ' + authData.accessToken)
                    .end((err, res) => {
                        if (res.status == 200 || res.statusCode == 200) {
                            logger.info('post new customer address to salesforece success(Multiplpe).');

                        } else if (res.status == 204 || res.statusCode == 204) {
                            logger.info('this customer is not found on salesforce, can\'t insert address to salesforece.(Multiplpe)');
                        } else if (err) {
                            logger.info('post new customer address to salesforece failes(Multiplpe).')
                        }
                    });
            }
            /*Salesforce */
        }
        return reply({ message: req.i18n.__('addAddress')['200'], data: res.ops[0] }).code(200);
    });
}
/**
*@constant
*@type {object}
*@default
*A object that validates request payload!
*/
const validator = {
    addLine1: Joi.string().description('address line 1').allow(""),
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
    userId: Joi.string().description('user id ').allow(""),
    phoneNumber: Joi.string().description('phoneNumber').allow(""),
    countryCode: Joi.string().description('countryCode').allow(""),
    addedFrom: Joi.string().description('1 - google, 2 - Inwani').allow(""),
    zoneNumber: Joi.number().description('zoneNumber').allow(""),

}
/**
* A module that exports address handlers, validators
* @exports handler
*/
module.exports = { validator, handler }
