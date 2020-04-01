'use strict'

const joi = require('joi')
let moment = require('moment');//date-time
const config = require('../../config/components/nexmo');
const smsLog = require('../../models/smsLog')
const configuration = process.env;
const Nexmo = require('nexmo');

const nexmo = new Nexmo({
    apiKey: config.NEXMO_ACCOUNT_SID,
    apiSecret: config.NEXMO_AUTH_TOKEN
})

function sendSms(params, callback) {
   
    let from = 'Flexy'
    let to = params.to
    let text = params.body;
    nexmo.message.sendSms(from, to, text);

}

module.exports = {
    sendSms
};


// function sendSms(params, callback) {
//     try {
//         const twilioConf = joi.attempt(params, envVarsSchema)//Joi validation
//         client.messages.create({
//             to: twilioConf.to,
//             body: twilioConf.body,
//             from: twilioConf.from,
//             statusCallback: configuration.API_URL + '/webhooks/twilio'//twillo call back in t
//         }, (err, message) => {
//             if (typeof message != 'undefined') {
//                 let userdata = {
//                     msgId: message.sid,
//                     createDate: moment().unix(),
//                     isoDate: new Date(),
//                     status: message.status,
//                     trigger: params.trigger,
//                     msg: message.body,
//                     to: message.to
//                 };
//                 smsLog.Insert(userdata, (err, response) => {
//                 });//insert  log in database

//                 callback(null, userdata);
//             }
//             else
//                 callback(err);
//         });
//     } catch (e) {
//         return callback(e)
//     }
// }

