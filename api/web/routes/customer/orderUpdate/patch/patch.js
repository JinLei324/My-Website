const newOrders = require('../../../../../models/order');
const unassignOrders = require('../../../../../models/unassignOrders');
const assignOrders = require('../../../../../models/assignOrders');
const completedOrders = require('../../../../../models/completedOrders');
const stores = require('../../../../../models/stores');
const pickupOrders = require('../../../../../models/pickupOrders');
const mobileDevices = require('../../../../../models/mobileDevices');
const cartModel = require('../../../../../models/cart');
const Auth = require('../../../../middleware/authentication');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language
const status = require('../../../../../statusMessages/statusMessages');
const moment = require('moment');
const async = require('async');
const config = process.env;
var Joi = require('joi');

const ObjectID = require('mongodb').ObjectID;
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
    const readCompletedOrder = () => {
        return new Promise((resolve, reject) => {
            completedOrders.isExistsWithCustomerId({ customerId: req.auth.credentials._id.toString(), orderId: req.payload.orderId }, (err, res) => {
                orderDetails = res ? res : orderDetails;
                return err ? reject(err) : resolve(orderDetails);
            });
        });

    }
    // readNewOrder().then(readUnassignOrder).then(readAssignOrder).then(readCompletedOrder).then(readPickedupOrder).then(data => {
    readCompletedOrder().then(data => {
        if (Object.keys(data).length > 0) {

            stores.getOne({ // store
                "_id": new ObjectID(data.storeId),
            }, (err, result) => {
                if (result.storeIsOpen) {
                    let action = [];

                    for (let i = 0; i < data.Items.length; i++) {
                        data.Items[i].storeId = data.storeId;
                        data.Items[i].currency = data.currency;
                        data.Items[i].mileageMetric = data.mileageMetric;
                        data.Items[i].currencySymbol = data.currencySymbol;
                        data.Items[i].storeName = data.storeName;
                        data.Items[i].storeAddress = data.storeAddress;
                        data.Items[i].storeLogo = data.storeLogo;
                        data.Items[i].storePhone = data.storePhone;
                        data.Items[i].storeCoordinates = data.storeCoordinates;
                        let addOns = [];
                        for (let j = 0; j < data.Items[i].addOns.length; j++) {
                            let addOnGroup = [];
                            for (let k = 0; k < data.Items[i].addOns[j].addOnGroup.length; k++) {
                                addOnGroup.push(data.Items[i].addOns[j].addOnGroup[k]['id'])
                            }
                            addOnsData = {
                                "addOnGroup": addOnGroup,
                                "id": data.Items[i].addOns[j]['id'],
                                "packId": data.Items[i].addOns[j]['packId']
                            }
                            addOns.push(addOnsData)
                        }

                        data.Items[i].addOns = addOns;

                        let taxes = data.Items[i].taxes ? data.Items[i].taxes.length > 0 ? data.Items[i].taxes : [] : [];

                        for (let j = 0; j < taxes.length; j++) {
                            taxes[j].price = ((data.Items[i].unitPrice * taxes[j].taxValue) / 100);
                        }
                        data.Items[i].taxes = taxes;
                        data.Items[i].estimates = data.estimates ? data.estimates : [];

                        data.Items[i].actions = [{
                            "type": "Added (re-ordered)",
                            "unitId": data.Items[i].unitId,
                            "quantity": data.Items[i].quantity,
                            "childProductId": data.Items[i].childProductId,
                            "timeStamp": moment().unix(),
                            "isoDate": new Date(),
                            "actorId": req.auth.credentials._id.toString(),
                            "actorName": data.customerDetails ? data.customerDetails.name : "",
                            "actionBy": req.auth.credentials.sub
                        }];
                        actions = [{
                            "type": "Added (re-ordered)",
                            "unitId": data.Items[i].unitId,
                            "quantity": data.Items[i].quantity,
                            "childProductId": data.Items[i].childProductId,
                            "timeStamp": moment().unix(),
                            "isoDate": new Date(),
                            "actorId": req.auth.credentials._id.toString(),
                            "actorName": data.customerDetails ? data.customerDetails.name : "",
                            "actionBy": req.auth.credentials.sub
                        }]
                    }
                    let booking = {
                        userId: data.customerDetails ? data.customerDetails.customerId : '',
                        createdTimeStamp: moment().unix(),
                        createdBy: req.auth.credentials.sub,
                        status: 0,
                        orderType: data.orderType ? data.orderType : 1,
                        orderTypeMsg: data.orderTypeMsg ? data.orderTypeMsg : "",
                        cartsAllowed: data.cartsAllowed,
                        storeType: data.storeType,
                        cityName: data.drop ? data.drop.city : "",
                        cityId: data.cityId ? data.cityId : "",
                        userName: data.customerDetails ? data.customerDetails.name : '',
                        statusMsg: 'Active',
                        items: data.Items,
                        action: actions
                    }

                    cartModel.reCart(booking, (err, result) => {
                        if (err) {
                            logger.error('Error occurred re order (reCart): ' + e);
                            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                            return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                        }

                        return reply({ message: req.i18n.__('cart')['201'] }).code(201);
                    });
                } else {
                    return reply({ message: req.i18n.__(req.i18n.__('cart')['401'], result.sName['en']) }).code(401);
                }
            })



        } else
            // return reply({
            //     message: error['cart']['404'][req.headers.language]
            // }).code(404)
            return reply({ message: req.i18n.__('cart')['404'] }).code(404);
    }).catch(e => {
        logger.error('Error occurred place order (catch): ' + e);
        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
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