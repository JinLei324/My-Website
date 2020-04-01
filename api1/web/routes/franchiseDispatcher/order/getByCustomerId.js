'use strict'
const config = process.env;

const Joi = require('joi');
const Async = require('async');
const logger = require('winston');
const orders = require('../../../../models/orders');


const validator = {
    customerId: Joi.string().required().description('customerId'),
    index: Joi.number().integer().required().description('pageIndex'),
}

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
    let pageIndex = req.params.index;
    let skip = pageIndex * 20;
    let limit = 20;
    let newBooking = {
        "customerDetails.customerId": req.params.customerId
    }

    switch (req.auth.credentials.userType) {
        case 0://city
            newBooking.cityId = req.auth.credentials.cityId;
            break;
        case 1://franchies
            newBooking.franchiseId = req.auth.credentials.franchiseId;
            break;
        case 2://store
            newBooking.storeId = req.auth.credentials.storeId;
            break;
        default:
    }
    Async.series([
        function (cb) {
            orders.getAllCompleted({ q: newBooking, options: { skip: skip, limit: limit } }, 'completedOrders', (err, completedOrdersObj) => {
                cb(null, completedOrdersObj);
            })
        },
        function (cb) {
            orders.count(newBooking, 'completedOrders', (err, newOrderCount) => {
                cb(null, newOrderCount);
            })
        },

    ], (err, result) => {
        if (err) return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
 
        return reply({
            message: req.i18n.__('ordersList')['200'],
            data: {
                orders: result[0],
                count: result[1],
            }
        }).code(200);
    });


}

const responseCode = {

}//swagger response code
module.exports = {
    handler,
    validator,
    responseCode
}