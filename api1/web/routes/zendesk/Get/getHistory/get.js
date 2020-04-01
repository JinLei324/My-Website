'use strict'
const Joi = require("joi");
const Async = require('async');
const moment = require('moment');
const zendesk = require('../../../../../models/zendesk');

const Validator = Joi.object({
    id: Joi.string().required().description(' want to detail history about ticket ex. ticket_id 10'),
}).required();

let APIHandler = (request, reply) => {
    var url = zendesk.config.zd_api_url + '/tickets/' + parseInt(request.params.id) + '/audits.json'
    zendesk.users.get(url, function (err, result) {
        if (err) {
            return reply(err);
        } else {
            let results = result.audits[0];

            let event = [];
            let responseData = {
                ticket_id: results.ticket_id,
                timeStamp: moment(results.created_at).unix(),
            }

            // results.events.forEach(res => {
            //     let response = [];
            //     switch (res.field_name) {
            //         case 'subject':
            //             responseData.subject = res.value;
            //             break;
            //         case 'type':
            //             responseData.type = res.value;
            //             break;
            //         case 'priority':
            //             responseData.priority = res.value;
            //             break;
            //         case 'status':
            //             responseData.type = res.value;
            //             break;
            //     }
            // });
            Async.forEach(result.audits, function (res, callback1) {
                res.events.forEach(res => {
                    let response = [];
                    switch (res.field_name) {
                        case 'subject':
                            responseData.subject = res.value;
                            break;
                        case 'type':
                            responseData.type = res.value;
                            break;
                        case 'priority':
                            responseData.priority = res.value;
                            break;
                        case 'status':
                            responseData.type = res.value;
                            break;
                    }
                });
                if (res.events[0].type == 'Comment') {
                    var url = zendesk.config.zd_api_url + '/users/' + res.events[0].author_id + '.json'
                    zendesk.users.get(url, function (err, result) {
                        if (err) {
                            callback1(err);
                        } else {
                            event.push({
                                id: res.id,
                                author_id: res.events[0].author_id,
                                body: res.events[0].body,
                                timeStamp: moment(res.created_at).unix(),
                                created_at: res.created_at,
                                name: result.user.name || ""

                            });
                            callback1(null, event);
                        }
                    })
                } else {
                    callback1(null, event);
                }

            }, function (err, res) {
                if (event.length != 0) {
                    event.sort(function (a, b) {
                        return parseInt(a.timeStamp) - parseInt(b.timeStamp);
                    });
                }
                responseData.events = event;
                return reply({ data: responseData });
                // return reply({ data: result });
            });

        }
    })
}
module.exports = { APIHandler, Validator }