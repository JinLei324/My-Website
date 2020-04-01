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

    console.log("orders get");
    let pageIndex = request.params.index;
    let skip = pageIndex * 20;
    let limit = 20;
    /*
    //1-delivery  , 2 - pickup servicetype
    Async.series([

        function (cb) {
            orders.getAllNew({ q: { "storeId": request.params.storeId, "status": 1 }, options: { skip: skip, limit: limit, option: { timeStamp: 0, drop: 0, pickup: 0, dispatchSetting: 0, customerCoordinates: 0, Items: 0, storeCoordinates: 0, storeLogo: 0, storeName: 0, managerLogs: 0, activities: 0 } } }, 'newOrder', (err, newOrdersObj) => {
                cb(null, newOrdersObj);
            })
        },
        function (cb) {
            orders.getAllPickups({ q: { "storeId": request.params.storeId, "status": { $in: [4, 18] }, "serviceType": 2 }, options: { skip: skip, limit: limit, option: { timeStamp: 0, drop: 0, pickup: 0, dispatchSetting: 0, customerCoordinates: 0, Items: 0, storeCoordinates: 0, storeLogo: 0, storeName: 0, managerLogs: 0, activities: 0 } } }, 'pickupOrders', (err, pickupOrdersObj) => {
                cb(null, pickupOrdersObj);
            })
        },
        function (cb) {
            orders.getAllunassign({ q: { "storeId": request.params.storeId, "status": { $in: [4, 18] }, inDispatch: false, "serviceType": 1 }, options: { skip: skip, limit: limit, option: { timeStamp: 0, drop: 0, pickup: 0, dispatchSetting: 0, customerCoordinates: 0, Items: 0, storeCoordinates: 0, storeLogo: 0, storeName: 0, managerLogs: 0, activities: 0 } } }, 'unassignOrders', (err, unassignOrdersObj) => {
                cb(null, unassignOrdersObj); //yun 11
            })
            // orders.getAllunassign({ q: { "storeId": request.params.storeId, "status": { $in: [4, 18] },  "serviceType": 1 }, options: { skip: skip, limit: limit, option: { timeStamp: 0, drop: 0, pickup: 0, dispatchSetting: 0, customerCoordinates: 0, Items: 0, storeCoordinates: 0, storeLogo: 0, storeName: 0, managerLogs: 0, activities: 0 } } }, 'unassignOrders', (err, unassignOrdersObj) => {
            //     cb(null, unassignOrdersObj);
            // })
        },
        function (cb) {
            orders.getAllassign({ q: { "storeId": request.params.storeId, "status": { $in: [8, 10, 11, 12, 13, 14] }, "serviceType": 1 }, options: { skip: skip, limit: limit, option: { timeStamp: 0, drop: 0, pickup: 0, dispatchSetting: 0, customerCoordinates: 0, Items: 0, storeCoordinates: 0, storeLogo: 0, storeName: 0, managerLogs: 0, activities: 0 } } }, 'assignOrders', (err, assignOrdersObj) => {
                cb(null, assignOrdersObj);
            })
        },
        function (cb) { //yun 11
            orders.getAllindispatch({ q: { "storeId": request.params.storeId, "status": { $in: [4, 18] }, inDispatch: true, "serviceType": 1 }, options: { skip: skip, limit: limit, option: { timeStamp: 0, drop: 0, pickup: 0, dispatchSetting: 0, customerCoordinates: 0, Items: 0, storeCoordinates: 0, storeLogo: 0, storeName: 0, managerLogs: 0, activities: 0 } } }, 'unassignOrders', (err, indispatchOrdersObj) => {
                cb(null, indispatchOrdersObj);
            })
        },
        function (cb) {
            orders.getAllPickups({ q: { "storeId": request.params.storeId, "status": { $in: [5, 6] }, "serviceType": 2 }, options: { skip: skip, limit: limit, option: { timeStamp: 0, drop: 0, pickup: 0, dispatchSetting: 0, customerCoordinates: 0, Items: 0, storeCoordinates: 0, storeLogo: 0, storeName: 0, managerLogs: 0, activities: 0 } } }, 'pickupOrders', (err, pickupOrdersObj) => {
                cb(null, pickupOrdersObj);
            })
        }
    ], (err, result) => {
        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);


        // webSocket.publish('storeOrders/' + request.params.storeId, {data : {newOrders: result[0], pickup: result[1], unassign: result[2], assign: result[3],indispatch: result[4], newCount: result[5], pickupCount: result[6], unassignCount: result[7], assignCount: result[8], indispatchCount: result[9]} }, { qos: 2 }, (mqttErr, mqttRes) => {
        // });

        var preparing = result[1].concat(result[2]);

        function sortNumber(a, b) {
            return b.orderId - a.orderId;
        }
        // preparing.sort(sortNumber);

        // var ready = result[3].concat(result[4]); // shedole
        var ready = result[3].concat(result[4]);
       ready = ready.concat(result[5]); //yun 11
        // ready = ready.concat(preparing); // shedole
        ready.sort(sortNumber);


        return reply({ message: request.i18n.__('ordersList')['200'], data: { newOrders: result[0], newOrdersCount: result[0] ? result[0].length : 0, preparing: preparing, preparingCount: preparing.length, ready: ready, readyCount: ready ? ready.length : 0 } }).code(200);
    });
    */



}


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    storeId: Joi.string().required().description('storeId'),
    index: Joi.number().integer().required().description('pageIndex')
}


/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }