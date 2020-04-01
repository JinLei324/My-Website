'use strict';
const smsLog = require('../../models/smsLog');

module.exports = [
{
    method: 'POST',
    path: '/webhooks/twilio',
    config: {// "tags" enable swagger to document API
        tags: ['api', 'webhooks'],
        description: 'Api for twilio logs',
        notes: "It will update sent sms status to db  \n\n 500 - Internal server error, \n\n 400 - Phone number already registered, \n\n 200 - Success", // We use Joi plugin to validate request

    },
    handler: function (req, reply) {
        var condition = {
            query: {msgId: req.payload.SmsSid},
            data: {
                $set: {
                    status: req.payload.SmsStatus,
                    ErrorCode: req.payload.ErrorCode
                }
            }
        };
        smsLog.updateByMsgId(condition, (err, result) => {
        });//update message status by webhook
        
    }
}
];