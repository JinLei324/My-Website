const newOrders = require('../../../../../../models/order');
const unassignOrders = require('../../../../../../models/unassignOrders');
const assignOrders = require('../../../../../../models/assignOrders');
const completedOrders = require('../../../../../../models/completedOrders');
const pickupOrders = require('../../../../../../models/pickupOrders');
const mobileDevices = require('../../../../../../models/mobileDevices');
const Auth = require('../../../../../middleware/authentication');
const error = require('../../../../../../statusMessages/responseMessage');  // response messages based on language 
const status = require('../../../../../../statusMessages/statusMessages');
const moment = require('moment');//date-time
const config = process.env;
var Joi = require('joi');
const logger = require('winston');
/** 
* @function
* @name handler
* @param {string} status -  0 - Active , 1 - Banned , 2 - Unverfied.
* @return {object} Reply to the user.
*/

const handler = (req, reply) => {
    //  req.headers.language = 'en';
    let orderDetails = {};
    const readNewOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            newOrders.isExistsWithOrderId({ orderId: req.params.orderId, orderType: 3 }, (err, res) => {
                orderDetails = res ? res : orderDetails;
                return err ? reject(err) : resolve(orderDetails);
            });
        });
    }
    const readPickedupOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            pickupOrders.isExistsWithOrderId({ orderId: req.params.orderId, orderType: 3 }, (err, res) => {
                orderDetails = res ? res : orderDetails;
                return err ? reject(err) : resolve(orderDetails);
            });
        });
    }
    const readUnassignOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            unassignOrders.isExistsWithOrderId({ orderId: req.params.orderId, orderType: 3 }, (err, res) => {
                orderDetails = res ? res : orderDetails;
                return err ? reject(err) : resolve(orderDetails);
            });
        });
    }
    const readAssignOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            assignOrders.isExistsWithOrderId({ orderId: req.params.orderId, orderType: 3 }, (err, res) => {
                orderDetails = res ? res : orderDetails;
                return err ? reject(err) : resolve(orderDetails);
            });
        });
    }
    const readCompletedOrder = (newOrder) => {
        return new Promise((resolve, reject) => {
            completedOrders.isExistsWithOrderId({ orderId: req.params.orderId, orderType: 3 }, (err, res) => {
                orderDetails = res ? res : orderDetails;
                return err ? reject(err) : resolve(orderDetails);
            });
        });

    }
    readNewOrder().then(readUnassignOrder).then(readAssignOrder).then(readCompletedOrder).then(readPickedupOrder).then(data => {
        
        if (Object.keys(data).length > 0) {
            ///////////////////////////////////
            let dateToSend = {

                activityLogs: data.activityLogs,

            }
            return reply({ message: req.i18n.__('getProfile')['200'], data: dateToSend }).code(200);
        }
        return reply({ message: req.i18n.__('getProfile')['404'] }).code(404);
    }).catch(e => {
        logger.error('Error occurred place order (catch): ' + JSON.stringify(e));
        return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
    });


}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    orderId: Joi.number().required().description('order Id')
}
/**
* A module that exports guest logins handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator };