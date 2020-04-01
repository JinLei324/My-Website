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
const searchhandler = (request, reply) => {

    let pageIndex = request.params.index;
    let skip = pageIndex * 20;
    let limit = 20;


    // let Obj = {
    //     $and: [
    //         {
    //             $or: [
    //                 { $where: "/^.*" + request.params.search + ".*/.test(this.orderId)" },
    //                 { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.name)" },
    //                 { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.email)" },
    //                 { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.mobile)" }
    //             ]
    //         },
    //         { "storeId": request.params.storeId }
    //     ]
    // }

    switch (request.params.flag) {
        case 1:

            let Obj = {
                $and: [
                    {
                        $or: [
                            { $where: "/^.*" + request.params.search + ".*/.test(this.orderId)" },
                            { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.name)"},
                            { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.email)" },
                            { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.mobile)" }
                        ]
                    },
                    { "storeId": request.params.storeId,"status": 1 }
                ]
            }

            orders.getAllNew({ q: Obj, options: { skip: skip, limit: limit } }, 'newOrder', (err, newOrdersObj) => {

                if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                return reply({ message: request.i18n.__('ordersList')['200'], data: { searchOrders: newOrdersObj } }).code(200);
            })
            break;
        case 2:

            Async.series([
                function (cb) {
                    let Obj = {
                        $and: [
                            {
                                $or: [
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.orderId)" },
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.name)"},
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.email)" },
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.mobile)" }
                                ]
                            },
                            { "storeId": request.params.storeId ,"status": { $in: [4, 18] }, "serviceType": 2}
                        ]
                    }
                    orders.getAllPickups({ q: Obj, options: { skip: skip, limit: limit } }, 'pickupOrders', (err, pickupOrdersObj) => {
                        cb(null, pickupOrdersObj);
                    })
                },
                function (cb) {

                    let Obj = {
                        $and: [
                            {
                                $or: [
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.orderId)"},
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.name)" },
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.email)" },
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.mobile)" }
                                ]
                            },
                            { "storeId": request.params.storeId,"status": { $in: [4, 18] }, inDispatch: false, "serviceType": 1 }
                        ]
                    }

                    orders.getAllunassign({ q: Obj, options: { skip: skip, limit: limit } }, 'unassignOrders', (err, unassignOrdersObj) => {
                       
                        cb(null, unassignOrdersObj);
                    })
                },
                    function (cb) {

                    let Obj = {
                        $and: [
                            {
                                $or: [
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.orderId)" },
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.name)" },
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.email)" },
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.mobile)" }
                                ]
                            },
                            { "storeId": request.params.storeId,"status": { $in: [8, 10, 11, 12, 13, 14] }, "serviceType": 1 }
                        ]
                    }
                    orders.getAllassign({ q: Obj, options: { skip: skip, limit: limit } }, 'assignOrders', (err, assignOrdersObj) => {
                        cb(null, assignOrdersObj);
                    })
                },
                function (cb) {
                    let Obj = {
                        $and: [
                            {
                                $or: [
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.orderId)" },
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.name)" },
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.email)" },
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.mobile)" }
                                ]
                            },
                            { "storeId": request.params.storeId,"status": { $in: [4, 18] }, inDispatch: true, "serviceType": 1 }
                        ]
                    }
                    orders.getAllindispatch({ q: Obj, options: { skip: skip, limit: limit } }, 'unassignOrders', (err, indispatchOrdersObj) => {
                        cb(null, indispatchOrdersObj);
                    })
                },
                function (cb) {
                    let Obj = {
                        $and: [
                            {
                                $or: [
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.orderId)" },
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.name)"},
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.email)" },
                                    { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.mobile)" }
                                ]
                            },
                            { "storeId": request.params.storeId,"status": { $in: [5, 6] }, "serviceType": 2 }
                        ]
                    }
                    orders.getAllPickups({ q: Obj, options: { skip: skip, limit: limit } }, 'pickupOrders', (err, pickupOrdersObj) => {
                        cb(null, pickupOrdersObj);
                    })
                }





            ], (err, result) => {
                if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

               
                var preparing = result[0].concat(result[1]);
               // 234
                preparing = preparing.concat(result[2]);
                preparing = preparing.concat(result[3]);
                preparing = preparing.concat(result[4]);

                function sortNumber(a, b) {
                    return b.orderId - a.orderId;
                }
                preparing.sort(sortNumber);

                return reply({ message: request.i18n.__('ordersList')['200'], data: { searchOrders: preparing } }).code(200);

            })

            break;
        // case 3:
        //     Async.series([
        //         function (cb) {

        //             let Obj = {
        //                 $and: [
        //                     {
        //                         $or: [
        //                             { $where: "/^.*" + request.params.search + ".*/.test(this.orderId)" },
        //                             { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.name)" },
        //                             { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.email)" },
        //                             { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.mobile)" }
        //                         ]
        //                     },
        //                     { "storeId": request.params.storeId,"status": { $in: [8, 10, 11, 12, 13, 14] }, "serviceType": 1 }
        //                 ]
        //             }
        //             orders.getAllassign({ q: Obj, options: { skip: skip, limit: limit } }, 'assignOrders', (err, assignOrdersObj) => {
        //                 cb(null, assignOrdersObj);
        //             })
        //         },
        //         function (cb) {
        //             let Obj = {
        //                 $and: [
        //                     {
        //                         $or: [
        //                             { $where: "/^.*" + request.params.search + ".*/.test(this.orderId)" },
        //                             { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.name)" },
        //                             { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.email)" },
        //                             { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.mobile)" }
        //                         ]
        //                     },
        //                     { "storeId": request.params.storeId,"status": { $in: [4, 18] }, inDispatch: true, "serviceType": 1 }
        //                 ]
        //             }
        //             orders.getAllindispatch({ q: Obj, options: { skip: skip, limit: limit } }, 'unassignOrders', (err, indispatchOrdersObj) => {
        //                 cb(null, indispatchOrdersObj);
        //             })
        //         },
        //         function (cb) {
        //             let Obj = {
        //                 $and: [
        //                     {
        //                         $or: [
        //                             { $where: "/^.*" + request.params.search + ".*/.test(this.orderId)" },
        //                             { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.name)"},
        //                             { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.email)" },
        //                             { $where: "/^.*" + request.params.search + ".*/.test(this.customerDetails.mobile)" }
        //                         ]
        //                     },
        //                     { "storeId": request.params.storeId,"status": { $in: [5, 6] }, "serviceType": 2 }
        //                 ]
        //             }
        //             orders.getAllPickups({ q: Obj, options: { skip: skip, limit: limit } }, 'pickupOrders', (err, pickupOrdersObj) => {
        //                 cb(null, pickupOrdersObj);
        //             })
        //         }
        //     ], (err, result) => {
        //         if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);

        //         var ready = result[0].concat(result[1]);
        //         ready = ready.concat(result[2]);

        //         function sortNumber(a, b) {
        //             return b.orderId - a.orderId;
        //         }
        //         ready.sort(sortNumber);


        //         return reply({ message: error['ordersList']['200'], data: { searchOrders: ready } }).code(200);

        //     })

        //     break;
        default:
            return reply({ message: request.i18n.__('ordersList')['200'], data: { searchOrders: [] } }).code(200);
    }
}


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    storeId: Joi.string().required().description('storeId'),
    index: Joi.number().integer().required().description('pageIndex'),
    search: Joi.string().required().description('search orderid,customer email, customer phone number, customer name,'),
    flag: Joi.number().required().description('searchType  1- new , 2 - preparing & ready')
}


/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { searchhandler, validator }