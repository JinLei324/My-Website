'use strict'
const logger = require('winston');
const Joi = require("joi");
const zendesk = require('./../../../../../models/zendesk');

const Validator = Joi.object({
    id: Joi.string().required().description('The value of the subject field for this ticket'),
    body: Joi.string().required().description('The first comment on the ticket'),
    author_id: Joi.string().required().description('The id of the comment author')
}).required();

const APIHandler = (request, reply) => {
    var insertCustomerData = {"ticket": {"comment": { "body":request.payload.body,"author_id":request.payload.author_id}}};
    var url =zendesk.config.zd_api_url+'/tickets/'+request.payload.id+'.json';
    logger.info('comment url',url);
    zendesk.users.put(insertCustomerData,url, function (err, result) {
        if (err) {
            return reply(err);
        } else {
            return reply(result);
        }
    })
}
module.exports = { APIHandler, Validator }