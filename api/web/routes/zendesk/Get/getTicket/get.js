'use strict'
const Joi = require("joi");
const moment = require('moment');
const zendesk = require('../../../../../models/zendesk');

const Validator = Joi.object({
    emailId: Joi.string().required().description(' want to details information about ticket ex. ticket_id 10')
}).required();
const APIHandler = (request, reply) => {
    const url = zendesk.config.zd_api_url + '/search.json?query=requester:' + request.params.emailId;

    return new Promise((resolve, reject) => {
        zendesk.users.get(url, function (err, result) {
            if (err) {
                return reply(err);
            } else {

                let open = [];
                let close = [];

                result.results.forEach(element => {

                    if (element.status != 'open') {
                        close.push({
                            id: element.id,
                            status: element.status,
                            timeStamp: moment(element.created_at).unix(),
                            subject: element.subject,
                            type: element.type,
                            priority: element.priority,
                            description: element.description
                        });
                    } else {
                        open.push({
                            id: element.id,
                            status: element.status,
                            timeStamp: moment(element.created_at).unix(),
                            subject: element.subject,
                            type: element.type,
                            priority: element.priority,
                            description: element.description
                        });
                    }
                });
                return reply({ data: { open: open, close: close } });
            }
        });
    })
}

module.exports = { APIHandler, Validator }