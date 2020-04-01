'use strict';
const joi = require('joi');
const logger = require('winston');
const errorMsg = require('../../../../locales');
const customer = require('../../../../models/customer');
const cities = require('../../../../models/cities');
const referralCodes = require('../../../../models/referralCampaigns/referralCode');

const payload = joi.object({
    referralCode: joi.string().required().min(4).description('Code required'),
}).required();

const handler = (req, reply) => {
    referralCodes.getDetailsByCode(req.payload.referralCode, (error, response) => {
        if (error) {
            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
        } else if (response.length == 0) {
            return reply({ message: req.i18n.__('customerReferralCodeValidation')['404'] }).code(404);
        } else {
            return reply({ message: req.i18n.__('genericErrMsg')['200'] }).code(200);
        }
    });
}
const responseCode = {
}

module.exports = {
    payload,
    handler,
    responseCode
};