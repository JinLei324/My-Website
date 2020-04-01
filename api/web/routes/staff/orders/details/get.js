'use strict'
const orders = require('../../../../../models/orders');
const customer = require('../../../../../models/customer');
// const webSocket = require('../../../../library/websocket');
const webSocket = require('../../../../../library/websocket/websocket');
const error = require('../../../../../locales');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const Async = require('async');
const ObjectID = require('mongodb').ObjectID;

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {

    Async.series([

        function (cb) {

            orders.getOrder({ orderId: request.params.orderId }, 'newOrder', (err, newOrdersObj) => {

                cb(null, newOrdersObj);
            })
        },
        function (cb) {

            orders.getOrder({ orderId: request.params.orderId }, 'orderAccepted', (err, newOrdersObj) => {

                cb(null, newOrdersObj);
            })
        },
        function (cb) {

            orders.getOrder({ orderId: request.params.orderId }, 'pickupOrders', (err, pickupOrdersObj) => {

                cb(null, pickupOrdersObj);
            })
        },
        function (cb) {

            orders.getOrder({ orderId: request.params.orderId }, 'unassignOrders', (err, unassignOrdersObj) => {

                cb(null, unassignOrdersObj);
            })
        },
        function (cb) {

            orders.getOrder({ orderId: request.params.orderId }, 'completedOrders', (err, completedOrdersObj) => {

                cb(null, completedOrdersObj);
            })
        },
        function (cb) {

            orders.getOrder({ orderId: request.params.orderId }, 'assignOrders', (err, assignedOrdersObj) => {

                cb(null, assignedOrdersObj);
            })
        },

    ], (err, result) => {

        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

        let data = result[0] || result[1] || result[2] || result[3] || result[4] || result[5] || {}
        data.customerDetails.customerRevenue = 0;
        data.customerDetails.customerOrderCount = 0;
        customer.getOne({ "_id": data.customerDetails ? new ObjectID(data.customerDetails.customerId) : "" }, (err, customerData) => {

            if (customerData) {
                data.customerDetails.customerOrderCount = customerData.orders ? customerData.orders.ordersCount : 0;
                data.customerDetails.customerRevenue = customerData.orders ? customerData.orders.ordersAmount : 0;
            }
            return reply({ message: request.i18n.__('ordersList')['200'], data: data }).code(200);
        })



    })

}


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    orderId: Joi.number().required().description('orderId'),
}


/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }


