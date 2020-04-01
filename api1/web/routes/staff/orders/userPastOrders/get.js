'use strict'
const orders = require('../../../../../models/orders');
// const webSocket = require('../../../../library/websocket');
const webSocket = require('../../../../../library/websocket/websocket');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const Async = require('async');


/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
  
    let pageIndex = request.params.index;
    let skip = pageIndex * 100;
    let limit = 100;

    Async.series([

        function (cb) {
            orders.getAllCompleted({ q:{ "storeId": request.params.storeId,"customerDetails.customerId":request.params.userId, "status": { $in: [2, 3, 7,15] } } ,options:{ skip: skip, limit : limit} }, 'completedOrders', (err, completedOrdersObj) => {
                cb(null, completedOrdersObj);
            })
        },
        function (cb) {
             orders.count({ "storeId": request.params.storeId,"customerDetails.customerId":request.params.userId, "status": { $in: [2, 3, 7,15] } }, 'completedOrders', (err, newOrderCount) => {
                cb(null, newOrderCount);
            })
        },

    ], (err, result) => {
        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);


        // webSocket.publish('storePastOrders/' + request.params.storeId, {data : { pastOrders: result[0], pastOrdersCount: result[1] } }, { qos: 2 }, (mqttErr, mqttRes) => {
        // });

        return reply({ message: request.i18n.__('ordersList')['200'], data : {pastOrders: result[0], pastOrdersCount: result[1] } }).code(200);
    });

}



/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    storeId : Joi.string().required().description('storeId'),
    index : Joi.number().integer().required().description('pageIndex'),
    userId: Joi.string().required().description('userId')
}


/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }