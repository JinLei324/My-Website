'use strict'

const joi = require('joi')
let moment = require('moment');//date-time

const request = require("request");
const config = require('../../config/components/twilio');
const smsLog = require('../../models/smsLog')
const configuration = process.env;
function sendSms(params, callback) {
    try {
        let number = [];
        number.push(params.phoneNumber)

        var options = {
            method: 'POST',
            url: 'https://egacela.com/api/sms/launch',
            headers:
            {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: 'Bearer 87MUPhYZQwEk279k/U1qll96sN6L2r242TxKqQ/wd5vBFAbofkgwnwX1+AX51ohDE3f3qGTbyo+M0zApTBzD++fhuL4s1i5rShpul9fMg2nKzeboAA=='
            },
            body:
            {
                config: { recipients: number, message: params.body },
                sendNow: true,
                name: 'RinnApp'
            },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            if (typeof body.success != 'undefined' && body.success == true) {
                let userdata = {
                    msgId: body.bulkId,
                    createDate: moment().unix(),
                    isoDate: new Date(),
                    status: body.success,
                    trigger: params.trigger,
                    msg: params.body,
                    to: params.phoneNumber
                };
                console.log("userdata  For Send OTP", userdata)
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

