'use strict'

var vouchers = require('../../../../../models/vouchers');
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Async = require('async');
var voucher_codes = require('voucher-code-generator');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    let voucherList = [];
    request.payload.actions = [{ createdOnTimeStamp: moment().unix(), createdBy: "admin" }];
    request.payload.expiryDateTimeStamp = moment(request.payload.expiryDate).unix();
    request.payload.expiryDateIsoDate = new Date(request.payload.expiryDate);
    request.payload.createdOnTimeStamp = moment().unix();
    request.payload.createdOnIsoDate = new Date(); 
    request.payload.status = 1;
    request.payload.statusMsg = 'Active';
    
    voucherList = voucher_codes.generate({
        prefix: request.payload.codePrefix + "-",
        postfix: "-" + request.payload.codePostfix,
        length: 10,
        count: request.payload.count,
        charset: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*?@"
    });
    let i;
    request.payload.vouchersList = [];
    for (i = 0; i < voucherList.length; i++) {
        request.payload.vouchersList.push({
            name: voucherList[i],
            status: 1,
            statusMsg: 'Active'
        });
    }
    vouchers.create(request.payload, (err, result) => {
        if (err) {
            logger.error('Error occurred voucher (create): ' + JSON.stringify(err));
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        return reply({ message: request.i18n.__('genericErrMsg')['200'] }).code(200);
    });
}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    name: Joi.string().required().description('name of voucher'),
    codePrefix: Joi.string().required().description('prefix of voucher'),
    codePostfix: Joi.string().required().description('postfix of voucher'),
    count: Joi.number().required().description('count of voucher'),
    value: Joi.number().required().description('value of voucher'),
    expiryDate: Joi.string().required().description('expiry of voucher')
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }