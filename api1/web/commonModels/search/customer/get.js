'use strict'
const stores = require('../../../../models/stores');
const customer = require('../../../../models/customer');
const error = require('../../../../statusMessages/responseMessage'); // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const async = require('async');
const ObjectId = require('mongodb').ObjectID;
/** 
 * @function
 * @name handler 
 * @return {object} Reply to the user.
 * @param {data} 0 - name, 1 - email, 2 - mobile
 */
const handler = (request, reply) => {

    let searchData = {};
    switch (request.params.data) {
        case 0:
            searchData = {
                'name': new RegExp("^" + request.params.needle, "gi"),
                "status": 2
                // 'storesBelongTo.storeId': { $in: [request.params.storeId] }
            };
            break;
        case 1:
            searchData = {
                'email': new RegExp("^" + request.params.needle, "gi"),
                "status": 2
                // 'storesBelongTo.storeId': { $in: [request.params.storeId] }
            };
            break;
        case 2:
            searchData = {
                'phone': new RegExp("^" + request.params.needle, "gi"),
                "status": 2
                // 'storesBelongTo.storeId': { $in: [request.params.storeId] }
            };
            break;
    }
    customer.filter(searchData, (err, data) => {
        if (err) {
            logger.error('Error occurred during search customer  ' + request.auth.credentials.sub + '(filter): ' + JSON.stringify(err));
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        }
        if (data.length > 0) {
            for (let i = 0; i < data.length; i++) {
                data[i].customerId = data[i]._id ? data[i]._id : "";
                delete data[i]._id;
            }
        }
        return reply({
            message: request.i18n.__('stores')['200'],
            data: data
        }).code(200);
    });


}



/** 
 * @function
 * @name handler to search by email, mobile number or name 
 * @return {object} Reply to the user.
 * @param {data} 0 - name, 1 - email, 2 - mobile
 */
const customHandler = (request, reply) => {

    var searchData = {
        $or: [{
            'name': new RegExp("^" + request.params.needle, "gi"),
        }, {
            'email': new RegExp("^" + request.params.needle, "gi"),
        }, {
            'phone': new RegExp("^" + request.params.needle, "gi"),
        }]
        // 'storesBelongTo.storeId': { $in: [request.params.storeId] }
    };


    customer.filter(searchData, (err, data) => {

        if (err) {
            logger.error('Error occurred during search customer  ' + request.auth.credentials.sub + '(filter): ' + JSON.stringify(err));
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        }
        if (data.length > 0) {
            for (let i = 0; i < data.length; i++) {
                data[i].customerId = data[i]._id ? data[i]._id : "";
                delete data[i]._id;
            }
        } else {
            return reply({
                message: request.i18n.__('customer')['404']
            }).code(404);
        }
        return reply({
            message: request.i18n.__('stores')['200'],
            data: data
        }).code(200);
    });


}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    data: Joi.number().integer().required().min(0).max(2).description('0 - name, 1 - email, 2 - mobile').default(0),
    needle: Joi.string().description('search customer'),
    storeId: Joi.string().description('storeId')
};

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const customValidator = {
    needle: Joi.string().description('search customer'),
    storeId: Joi.string().description('  storeId')
};
/**
 * A module that exports business get store handler, validator!
 * @exports validator
 * @exports handler 
 */
module.exports = {
    handler,
    validator,
    customValidator,
    customHandler
}