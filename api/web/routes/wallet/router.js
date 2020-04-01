
'use strict';

const Joi = require('joi');

const entity = "/wallet";

const async = require("async");

const walletModule = require('../../../worker/wallet');

module.exports = [
    {
        method: 'POST', // Methods Type
        path: entity + '/transction', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'Transction'],
            description: 'wallet Transction for all entity',
            notes: "wallet Transction for all entity", // We use Joi plugin to validate request 
            auth: false,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                },
                responses: {
                    '200': {
                        'description': 'Success',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    },
                    '400': {
                        'description': 'Bad Request',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    }
                }
            },
            validate: {
                payload: {
                    userId: Joi.string().required().description('user id separated by ,'),
                    amount: Joi.any().required().description('amount'),
                    userType: Joi.string().required().description('1-MASTER, 2-SLAVE, 3-OPERATOR , 4-APP, 5-PG'),
                    trigger: Joi.string().description('ADMIN/PROMO/REFREL/TRIP/WALLET_RECHARGE'),
                    currency: Joi.string().description('Currency'),
                    txnType: Joi.string().description('Transaction Type(1-CREDIT, 2-DEBIT)'),
                    comment: Joi.string().description('add your Comment'),
                    paymentType: Joi.string().description('CASH/CARD/WALLET'),
                    initiatedBy: Joi.string().description('ADMIN_USERNAME/CUSTOMER'),
                    bookingType: Joi.string().description('RIDE-1, DELIVERY-2, SERVICE-3')
                }
            }
        },
        handler: function (req, reply) { // request handler method
            var userId_arr = req.payload.userId.split(",");
            var trx_res = [];
            async.forEach(userId_arr, function (item, callback) {
                req.payload.userId = item;
                walletModule.walletTransction(req.payload, function (err, data) {
                    if (err)
                        trx_res.push({ "id": item, "data": "", "err": err });
                    else
                        trx_res.push({ "id": item, "data": data, "err": "" });
                    callback();
                });
            }, function (err) {
                reply({ 'flag': 0, 'data': trx_res });
            });
        }
    },
    {
        method: 'POST', // Methods Type
        path: entity + '/chargeWithPg', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'charge'],
            description: 'charge wallet with payment gateway',
            notes: "charge wallet with pg", // We use Joi plugin to validate request 
            auth: false,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                },
                responses: {
                    '200': {
                        'description': 'Success',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    },
                    '400': {
                        'description': 'Bad Request',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    }
                }
            },
            validate: {
                payload: {
                    userId: Joi.string().required().description('user id'),
                    amount: Joi.any().required().description('amount'),
                    userType: Joi.string().required().description('1-MASTER, 2-SLAVE, 3-OPERATOR , 4-APP, 5-PG'),
                    currency: Joi.string().description('Currency'),
                    comment: Joi.string().description('add your Comment'),
                    paymentTxtId: Joi.string().description('Payment Gateway Id'),
                }
            }
        },
        handler: function (req, reply) { // request handler method
            var trx_res = [];

            req.payload.trigger = "WALLET_RECHARGE";
            req.payload.txnType = 1;
            req.payload.paymentType = "WALLET";
            req.payload.initiatedBy = "CUSTOMER";

            walletModule.walletTransction(req.payload, function (err, data) {
                if (err)
                    trx_res.push({ "id": req.payload.userId, "data": "", "err": err });
                else
                    trx_res.push({ "id": req.payload.userId, "data": data, "err": "" });
                reply({ 'flag': 0, 'data': trx_res });
            });
        }
    },
    {
        method: 'Post', // Methods Type
        path: entity + '/User', // Url
        config: {// "tags" enable swagger to document API
            tags: ['api', 'User'],
            description: 'wallet user signup',
            notes: " ", // We use Joi plugin to validate request
            auth: false,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                },
                responses: {
                    '200': {
                        'description': 'Success',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    },
                    '400': {
                        'description': 'Bad Request',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    }
                }
            },
            validate: {
                payload:
                    {
                        userId: Joi.string().required().description('user id'),
                        userType: Joi.string().required().description('1-Diver, 2-Customer, 3-OPERATOR')
                    }
            }
        },
        handler: function (req, reply) { // request handler method
            walletModule.userCreate(req.payload, function (err, data) {
                reply({ 'flag': 0, 'data': data, err: err });
            });
        }
    },
    {
        method: 'PUT', // Methods Type
        path: entity + '/softLimit', // Url
        config: {// "tags" enable swagger to document API
            tags: ['api', 'Limit'],
            description: 'soft limit status',
            notes: " ", // We use Joi plugin to validate request
            auth: false,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                },
                responses: {
                    '200': {
                        'description': 'Success',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    },
                    '400': {
                        'description': 'Bad Request',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    }
                }
            },
            validate: {
                payload:
                    {
                        userId: Joi.string().required().description('user id'),
                        userType: Joi.string().required().description('1-MASTER, 2-SLAVE, 3-OPERATOR'),
                        status: Joi.string().required().description('1-SET SOFT LIMIT, 0-UNSET SOFT LIMIT')
                    }
            }
        },
        handler: function (req, reply) { // request handler method
            walletModule.softLimit(req.payload, function (err, data) {
                reply({ 'flag': 0, 'data': data, err: err });
            });
        }
    },
    {
        method: 'PUT', // Methods Type
        path: entity + '/hardLimit', // Url
        config: {// "tags" enable swagger to document API
            tags: ['api', 'Limit'],
            description: 'hard limit status',
            notes: " ", // We use Joi plugin to validate request
            auth: false,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                },
                responses: {
                    '200': {
                        'description': 'Success',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    },
                    '400': {
                        'description': 'Bad Request',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    }
                }
            },
            validate: {
                payload:
                    {
                        userId: Joi.string().required().description('user id'),
                        userType: Joi.string().required().description('1-MASTER, 2-SLAVE, 3-OPERATOR'),
                        status: Joi.string().required().description('1-SET HARD LIMIT, 0-UNSET HARD LIMIT')
                    }
            }
        },
        handler: function (req, reply) { // request handler method
            walletModule.hardLimit(req.payload, function (err, data) {
                reply({ 'flag': 0, 'data': data, err: err });
            });
        }
    },
    {
        method: 'DELETE',
        path: entity + '/user',
        config: {
            tags: ['api', 'User'],
            description: 'wallet account delete',
            notes: 'Delete wallet account',
            auth: false,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                },
                responses: {
                    '200': {
                        'description': 'Success',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    },
                    '400': {
                        'description': 'Bad Request',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    }
                }
            },
            validate: {
                payload:
                    {
                        userId: Joi.string().required().description('user id'),
                        userType: Joi.string().required().description('1-MASTER, 2-SLAVE, 3-OPERATOR')
                    }
            }
        },
        handler: function (req, reply) { // request handler method
            walletModule.userDelete(req.payload, function (err, data) {
                reply({ 'flag': 0, 'data': data, err: err });
            });
        }
    },
    {
        method: 'GET',
        path: entity + '/accountBalance/{userId}/{userType}',
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'Balance'],
            description: 'get account balance for users',
            notes: "get account balance for users", // We use Joi plugin to validate request 
            auth: false,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                },
                responses: {
                    '200': {
                        'description': 'Success',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    },
                    '400': {
                        'description': 'Bad Request',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    }
                }
            },
            validate: {
                params:
                    {
                        userId: Joi.string().required().description('user id separated by -'),
                        userType: Joi.string().required().description('1-MASTER, 2-SLAVE, 3-OPERATOR')
                    }
            }
        },
        handler: function (req, reply) { // request handler method
            var userId_arr = req.params.userId.split("-");
            var trx_res = [];
            async.forEach(userId_arr, function (item, callback) {
                req.params.userId = item;
                walletModule.accountBalance(req.params, function (err, data) {
                    if (err)
                        trx_res.push({ "id": item, "data": "", "err": err });
                    else
                        trx_res.push({ "id": item, "data": data, "err": "" });
                    callback();
                });
            }, function (err) {
                reply({ 'flag': 0, 'data': trx_res });
            });
        }
    },
    {
        method: 'GET',
        path: entity + '/transction/{userId}/{userType}/{pageIndex}',
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'Transction'],
            description: 'get all transction for users',
            notes: "get all transction for users", // We use Joi plugin to validate request 
            auth: false,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                },
                responses: {
                    '200': {
                        'description': 'Success',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    },
                    '400': {
                        'description': 'Bad Request',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    }
                }
            },
            validate: {
                params:
                    {
                        userId: Joi.string().required().description('user id'),
                        userType: Joi.string().required().description('1-MASTER, 2-SLAVE, 3-OPERATOR'),
                        pageIndex: Joi.number().required().description('0-ddefault')
                    }
            }
        },
        handler: function (req, reply) { // request handler method
            walletModule.transction(req.params, function (err, data) {
                if (err)
                    reply({ errNum: 500, errMsg: "Internal server.", errFlag: 1, data: [] });
                else
                    reply({ errNum: 200, errMsg: 'success', errFlag: 0, data: data });
            });
        }
    }
    // {
    //     method: 'POST',
    //     path: entity + '/walletTransactions',
    //     config: {
    //         auth: false,
    //         handler: walletModule.walletUpdateHandler,
    //         validate: {
    //             payload: {
    //                 adminLiability: Joi.number().required().description('Mandatory Field.'),
    //                 storeLiability: Joi.number().required().description('Mandatory Field'),
    //                 amount: Joi.number().required().description('Mandatory Field'),
    //                 orderId: Joi.string().required().description('Mandatory Field'),
    //                 userId: Joi.string().required().description('Mandatory Field'),
    //                 paymentType: Joi.string().required().description('Mandatory Field')
    //             }
    //         },
    //         tags: ['api', 'Campaigns'],
    //         description: 'This api debits from admin and store and credits to customer wallet',
    //         notes: 'Booking details needed for wallet transaction',
    //         plugins: {
    //             'hapi-swagger': {
    //                 payloadType: 'json'
    //             }
    //         },
    //         response: {
    //             status: {
    //                 200: {
    //                     message: Joi.any().default("success")
    //                 },
    //                 500: {
    //                     message: Joi.any().default("Error while updating")
    //                 }
    //             }
    //         }
    //     }
    // }

];