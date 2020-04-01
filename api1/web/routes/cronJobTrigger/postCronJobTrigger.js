'use strict';

const Joi = require('joi');
const logger = require('winston');
var async = require("async");
var moment = require('moment');
const ObjectID = require('mongodb').ObjectID;

const appconfig = require('../../../models/appConfig')

const payloadValidator = Joi.object({
    triggerType: Joi.number().required().description('triggerType').error(new Error('triggerType is missing'))
}).required();

const APIHandler = (req, reply) => {
    appconfig.fineAndUpdate({},
        {
            "currentKeyIndex": 0,
            "keyRotationArray.$[].completeQuotaLimit": false
        }, function (err, response) {


            reply({ message: 'success for cronjob' }).code(200);
        })
};

module.exports = { payloadValidator, APIHandler };