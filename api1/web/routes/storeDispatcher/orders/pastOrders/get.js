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
    let cond = {
        "status": { $in: [2, 3, 7, 9, 15, 16] }
    };
    if (parseInt(request.params.storeId) != 0) {
        cond['storeId'] = request.params.storeId;
    }

    if (parseInt(request.params.cityId) != 0) {
        cond['cityId'] = request.params.cityId;
    }
    if (request.params.search != "0") {
        cond = {
            $and: [
                {
                    $or: [
                        { $where: "/^.*" + request.params.search + ".*/.test(this.orderId)" },
                        { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.name)" },
                        { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.email)" },
                        { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.mobile)" }
                    ]
                },
                cond
            ]
        }
    }

    Async.series([

        function (cb) {
            orders.getAllCompleted({ q: cond, options: { skip: skip, limit: limit } }, 'completedOrders', (err, completedOrdersObj) => {
                cb(null, completedOrdersObj);
            })
        },
        function (cb) {
            orders.count(cond, 'completedOrders', (err, newOrderCount) => {
                cb(null, newOrderCount);
            })
        },

    ], (err, result) => {
        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);


        webSocket.publish('storePastOrders/' + request.params.storeId, { data: { pastOrders: result[0], pastOrdersCount: result[1] } }, { qos: 2 }, (mqttErr, mqttRes) => {
        });

        return reply({ message: request.i18n.__('ordersList')['200'], data: { pastOrders: result[0], pastOrdersCount: result[1] } }).code(200);
    });


}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    storeId: Joi.string().required().description('storeId'),
    cityId: Joi.string().required().description('cityId'),
    index: Joi.number().integer().required().description('pageIndex'),
    search: Joi.string().required().description('search')
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }