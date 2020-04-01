'use strict'

const joi = require('joi')
let moment = require('moment');//date-time
const config = require('../../config/components/twilio');
const smsLog = require('../../models/smsLog')
const configuration = process.env;
const client = require('twilio')(
    config.TWILIO_ACCOUNT_SID,
    config.TWILIO_AUTH_TOKEN
);
const envVarsSchema = joi.object({
    to: joi.string().required(),
    body: joi.string().required(),
    from: joi.string().default(config.CELL_PHONE_NUMBER),
    statusCallback: configuration.API_URL + '/webhooks/twilio'//twillo call back in this api
}).unknown().required()


function sendSms(params, callback) {
    try {
        const twilioConf = joi.attempt(params, envVarsSchema)//Joi validation
        client.messages.create({
            to: twilioConf.to,
            body: twilioConf.body,
            from: twilioConf.from,
            statusCallback: configuration.API_URL + '/webhooks/twilio'//twillo call back in t
        }, (err, message) => {
            if (typeof message != 'undefined') {
                let userdata = {
                    msgId: message.sid,
                    createDate: moment().unix(),
                    isoDate: new Date(),
                    status: message.status,
                    trigger: params.trigger,
                    msg: message.body,
                    to: message.to
                };
                smsLog.Insert(userdata, (err, response) => {
                });//insert  log in database

                callback(null, userdata);
            }
            else
                callback(err);
        });
    } catch (e) {
        return callback(e)
    }
}

module.exports = { sendSms };