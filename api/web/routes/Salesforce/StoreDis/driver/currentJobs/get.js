'use strict'
const drivers = require('../../../../../../models/driver');
// const webSocket = require('../../../../../../library/websocket');
const webSocket = require('../../../../../../library/websocket/websocket');
const error = require('../../../../../../locales');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const orders = require('../../../../../../models/orders');
const Async = require('async');

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {


    let pageIndex = request.params.index;
    let skip = pageIndex * 20;
    let limit = 20;

    drivers.getDriver({ "_id": new ObjectID(request.params.driverId) }, (err, driverObj) => {
        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

        if (!driverObj) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

        if (!driverObj.currentBookings || driverObj.currentBookings.length <= 0) {
            return reply({ message: request.i18n.__('driverList')['200'], data: { currentBookings: [] } }).code(200);
        } else {
            let currentBookings = [];
            Async.forEach(driverObj.currentBookings, function (item, callbackloop) {


                orders.getOrder({ "orderId": item.bid }, 'assignOrders', (err, orderObj) => {
                    if (orderObj) {
                        currentBookings.push(orderObj);
                    }

                    callbackloop();
                })

            }, function (loopErr) {
                return reply({ message: request.i18n.__('driverList')['200'], data: { currentBookings: currentBookings } }).code(200);
            });
        }
    })
};


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    driverId: Joi.string().required().description('storeId'),
    index: Joi.number().integer().required().description('index')
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }