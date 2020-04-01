'use strict';
const joi = require('joi')
const moment = require('moment');//date-time
const logger = require('winston');
const config = require('../../config/components/mailgun')
const emailLog = require('../../models/emailLog')
const configuration = require('../../configuration')

const mailgun = require('mailgun-js')({ apiKey: config.MAILGUN_AUTH_KEY, domain: config.MAILGUN_DOMAIN_NAME });

const envVarsSchema = joi.object({
    from: joi.string().default(configuration.MAILGUN_FROM_NAME),
    to: joi.string().required(),
    subject: joi.string().required(),
    html: joi.string().required(),

}).unknown();

function sendMail(params, callback) {
    try {
        const mailParam = joi.attempt(params, envVarsSchema)
        mailgun.messages().send(mailParam, function (error, body) {
            if (typeof body != 'undefined') {
                var insData = {
                    msgId: body.id,
                    createDate: moment().unix(),
                    isoDate: new Date(),
                    status: body.message,
                    trigger: params.trigger,
                    subject: params.subject,
                    to: params.to
                };
                emailLog.Insert(insData, (err, response) => {
                });
                return callback(null, insData)
            } else {
                return callback(error)
            }
        });
    } catch (e) {
        return callback(e)
    }
}//send mail and store database

module.exports = { sendMail };


