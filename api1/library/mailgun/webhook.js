'use strict';
const emailLog = require('../../models/emailLog')
// Mailgun webhook api 
module.exports = [
    {
        method: 'POST',
        path: '/webhooks/mailgun',
        config: {// "tags" enable swagger to document API
            tags: ['api', 'webhooks'],
            description: 'Api for mailgun status',
            notes: "It will update sent emails status to db \n\n 500 - Internal server error, \n\n 400 - Phone number already registered, \n\n 200 - Success", // We use Joi plugin to validate request

        },
        handler: function (req, reply) {
            if (req.payload) {
                emailLog.updateByMsgId(req.payload, (err, result) => {
                });//update mail status in db
            }
            reply(1);
        }
    }
];