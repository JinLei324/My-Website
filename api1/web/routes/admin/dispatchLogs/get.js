'use strict'

const webSocket = require('../../../../library/websocket/websocket');
const error = require('../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
var dispatchLogs = require('../../../../models/dispatchLogs');
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

    Async.series([

        function (cb) {
            dispatchLogs.getAll({ skip: skip, limit: limit }, (err, result) => {

                cb(null, result);

            });
        },
        function (cb) {
            dispatchLogs.count({}, (err, Count) => {
                cb(null, Count);
            })
        }

    ], (err, result) => {
        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);

        return reply({ message: request.i18n.__('ordersList')['200'], data: { data: result[0], count: result[1] } }).code(200);

    })

    // dispatchLogs.getAll({skip: skip, limit : limit}, (err, result) => {
    //         if (err) return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);

    //         return reply({ message: error['ordersList']['200'][request.headers.language], data : result }).code(200);
    // });

};


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    index: Joi.number().integer().required().description('index')
}

/**
* A module that exports customer get cart handler, get cart validator! 
* @exports handler 
*/
module.exports = { handler, validator }