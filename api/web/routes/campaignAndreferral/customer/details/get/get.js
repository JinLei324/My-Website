'use strict'
const error = require('../../../../../../statusMessages/responseMessage'); // response messages based on language 
const config = process.env;
const Joi = require('joi');
const customer = require('../../../../../../models/customer');
const logger = require('winston');
const async = require('async');

const customerDetailsByIdValidator = {
    customerId: Joi.string().required().description("Mandatory field.")
}



const customerDetailsByIdHandler = (request, reply) => {
    
    customer.getDetails(request.params.customerId, (err, res) => {

        if (err) {
            logger.error('Error occurred while getting data : ' + JSON.stringify(err));
            return reply({
                message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language]
            }).code(500);
        } 
        // else if (res.length == 0 || res.length == 'undefined') {
        //     logger.error('No data found' + JSON.stringify(err));
        //     return reply({
        //         message: error['customer']['404'][request.headers.language]
        //     }).code(200);
        // }
         else {
            logger.error('Request success. Returning dadta: ' + JSON.stringify(err));
            return reply({
                message: error['customer']['200'][request.headers.language], data:res
            }).code(200);
        }

    });
}

module.exports = {
    customerDetailsByIdHandler,
    customerDetailsByIdValidator
}