'use strict'
const cart = require('../../../../../models/cart');
const zones = require('../../../../../models/zones');
const addOnsModel = require('../../../../../models/addOns');
const error = require('../../../../../statusMessages/responseMessage'); // response messages based on language 
const config = process.env;
const Joi = require('joi');
const stores = require('../../../../../models/stores');
const logger = require('winston');
const async = require('async');
const distance = require('google-distance');
const googleDistance = require('../../../../commonModels/googleApi');
const ObjectID = require('mongodb').ObjectID;
/** 
 * @function
 * @name handler 
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {
    zones.inZone({
        lat: request.params.latitude,
        long: request.params.longitude
    }, (err, zone) => {
        if (err) {
            logger.error('Error occurred duringget stores (inZone): ' + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        }
        cart.getAll({
            userId: request.auth.credentials._id.toString()
        }, (err, data) => {
            if (err) {
                logger.error('Error occurred while getting cart : ' + err)
                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                return reply({
                    message: request.i18n.__('genericErrMsg')['500']
                }).code(500);
            } else if (data.length > 0) {
                // logger.error('data ' + JSON.stringify(data))
                let totalPrice = 0;
                let cartId = '';
                let responseArray = [];

                let incTax = {};
                let excTax = {};
                let inclTax = 0;
                let exclTax = 0;
                let cartTotal = 0;
                let cartDiscount = 0;
                async.each(data, (item, callback) => {
                    let exclTaxStore = 0;
                    let excTaxStore = {};
                    readStore(item.storeId).then(store => {
                        if (store) {
                            item.cartDiscount = Number((parseFloat(item.storeUnitPrice) - parseFloat(item.storeTotalPrice)).toFixed(2));
                            item.cartTotal = Number((item.storeUnitPrice).toFixed(2));
                            cartTotal += item.cartTotal;
                            cartDiscount += Number((item.cartDiscount).toFixed(2));

                            // async.each(item.products, (item, callbackSub) => {
                            for (let k = 0; k < item.products.length; k++) {
                                item.products[k].productName = item.products[k].itemName
                                item.products[k].taxes = item.products[k].taxes ? item.products[k].taxes : []
                                item.storeTotalPriceWithExcTaxes = parseFloat(item.storeTotalPrice);
                                if (item.addOnsAdded == null || item.addOnsAdded == 0) {
                                    item.addOnsAdded = 0
                                } else {
                                    item.addOnsAdded = 1;
                          

                                }


                                for (let l = 0; l < item.products[k].taxes.length; l++) {
                                    if (item.products[k].taxes[l].taxFlag == 0) { // inclusive
                                        if (typeof incTax[item.products[k].taxes[l].taxCode.toString()] == 'undefined') {
                                            incTax[item.products[k].taxes[l].taxCode.toString()] = {
                                                taxId: item.products[k].taxes[l].taxId,
                                                taxtName: item.products[k].taxes[l].taxname["en"],
                                                taxFlagMsg: item.products[k].taxes[l].taxFlagMsg,
                                                taxValue: item.products[k].taxes[l].taxValue,
                                                taxCode: item.products[k].taxes[l].taxCode,
                                                price: item.products[k].taxes[l].price,
                                                // netPrice : item.products[k].unitPrice,
                                                // grossPrice : 0
                                            };
                                        } else {
                                            incTax[item.products[k].taxes[l].taxCode.toString()]['price'] += item.products[k].taxes[l].price
                                            // incTax[item.products[k].taxes[l].taxCode.toString()]['netPrice'] = item.products[k].unitPrice - incTax[item.products[k].taxes[l].taxCode.toString()]['price']
                                            // incTax[item.products[k].taxes[l].taxCode.toString()]['grossPrice'] = item.products[k].unitPrice
                                        }
                                        inclTax += item.products[k].taxes[l].price
                                        item.inclTax = inclTax
                                    }
                                    if (item.products[k].taxes[l].taxFlag == 1) {
                                        if (typeof excTax[item.products[k].taxes[l].taxCode] == 'undefined') {
                                            excTax[item.products[k].taxes[l].taxCode] = {
                                                taxId: item.products[k].taxes[l].taxId,
                                                taxtName: item.products[k].taxes[l].taxname["en"],
                                                taxFlagMsg: item.products[k].taxes[l].taxFlagMsg,
                                                taxValue: item.products[k].taxes[l].taxValue,
                                                taxCode: item.products[k].taxes[l].taxCode,
                                                price: item.products[k].taxes[l].price * item.products[k].quantity
                                            };
                                        } else {
                                            excTax[item.products[k].taxes[l].taxCode]['price'] += item.products[k].taxes[l].price * item.products[k].quantity
                                        }


                                        /////////////////////////////////////////
                                        if (typeof excTaxStore[item.products[k].taxes[l].taxCode] == 'undefined') {
                                            excTaxStore[item.products[k].taxes[l].taxCode] = {
                                                taxId: item.products[k].taxes[l].taxId,
                                                taxtName: item.products[k].taxes[l].taxname["en"],
                                                taxFlagMsg: item.products[k].taxes[l].taxFlagMsg,
                                                taxValue: item.products[k].taxes[l].taxValue,
                                                taxCode: item.products[k].taxes[l].taxCode,
                                                price: item.products[k].taxes[l].price * item.products[k].quantity
                                            };
                                        } else {
                                            excTaxStore[item.products[k].taxes[l].taxCode]['price'] += item.products[k].taxes[l].price * item.products[k].quantity
                                        }
                                        ///////////////////////////////////////////
                                        let storeExcTaxArr = []
                                        for (const key in excTaxStore) {
                                            storeExcTaxArr.push(excTaxStore[key]);
                                        }
                                        item.exclusiveTaxes = storeExcTaxArr;
                                        exclTaxStore += item.products[k].taxes[l].price * item.products[k].quantity
                                        exclTax += item.products[k].taxes[l].price * item.products[k].quantity
                                        item.exclTaxStore = parseFloat(exclTaxStore)
                                        item.storeTotalPriceWithExcTaxes = parseFloat(item.exclTaxStore) + parseFloat(item.storeTotalPrice)
                                    }

                                }
                            }
                            // }, function (err) {
                            //     callbackSub()
                            // });
                            let deliveryPrice = 0;
                            // if (parseFloat(item.storeTotalPrice) < parseFloat(store.freeDeliveryAbove)) {
                            let origin = store.coordinates.latitude + ',' + store.coordinates.longitude;
                            let dest = request.params.latitude + ',' + request.params.longitude;

                            googleDistance.calculateDistance(origin, dest).then(distanceMeasured => {
                                if (err) logger.error('Error occurred during fare calculate get (distance.get): ' + JSON.stringify(err));
                                let distanceMiles = 0
                                let distanceKm = 0
                                let estimatedTime = 0

                                if (distanceMeasured) {
                                    let result = distanceMeasured.distance;
                                    result *= 0.000621371192;
                                    distanceMiles = durationMins;
                                    distanceKm = distanceMeasured.distance;
                                    estimatedTime = distanceMeasured.durationMins;
                                    deliveryPrice = parseFloat(parseFloat(parseFloat(result) * parseFloat(store.mileagePrice)).toFixed(2));
                                    
                                    item.storeDeliveryFee = (zone == null) ? 0 : deliveryPrice;
                                }
                            }).catch((err) => {
                                logger.error('Error occurred during  get cart  (calculateDistance): ' + JSON.stringify(err));
                                item.storeDeliveryFee = (zone == null) ? 0 : deliveryPrice;
                            });
                            // } else {
                            //     item.storeDeliveryFee = (zone == null) ? 0 : deliveryPrice;
                            // }
                            responseArray.push(item);
                            for (let j = 0; j < responseArray.length; j++) {
                                totalPrice += responseArray[j].storeTotalPrice;
                                cartId = responseArray[j].cartId;
                                responseArray[j].storeDeliveryFee = 0;
                                // responseArray[j].storeTotalPriceWithExcTaxes = totalPrice+responseArray[j].exclTax;
                                //  delete responseArray[j].cartId;
                            }
                            callback();
                        } else {
                            callback();
                        }
                    }).catch(e => {
                        logger.error('err during get cart(catch) ' + JSON.stringify(e));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                        return reply({
                            message: request.i18n.__('genericErrMsg')['500']
                        }).code(500);
                    });
                }, function(err) {
                    let incTaxArr = [];
                    let excTaxArr = [];
                    for (const key in incTax) {
                        incTaxArr.push(incTax[key]);
                    }
                    for (const key in excTax) {
                        excTaxArr.push(excTax[key]);
                    }
                    //  totalPrice = parseFloat(totalPrice).toFixed(2);
                    return reply({
                        message: request.i18n.__('cart')['200'],
                        data: {
                            incNetPrice: parseFloat(totalPrice) - parseFloat(inclTax),
                            totalPrice: parseFloat(totalPrice),
                            inclTax: parseFloat(inclTax),
                            incGrossTotalPrice: parseFloat(totalPrice),
                            exclTax: parseFloat(exclTax),
                            finalTotalIncludingTaxes: parseFloat(totalPrice) + parseFloat(exclTax),
                            cartId: cartId,
                            cart: responseArray,
                            inclusiveTaxes: incTaxArr,
                            exclusiveTaxes: excTaxArr,
                            cartTotal: cartTotal,
                            cartDiscount: cartDiscount
                        }
                    }).code(200);
                    // return reply({ message: error['cart']['200'][request.headers.language], data: { incNetPrice: totalPrice - inclTax, totalPrice: totalPrice, inclTax: inclTax, incGrossTotalPrice: totalPrice,exclTax:exclTax, finalTotalIncludingTaxes: totalPrice + exclTax, cartId: cartId, cart: responseArray, inclusiveTaxes: incTaxArr, exclusiveTaxes: excTaxArr } }).code(200);
                });

            } else
                // return reply({ message: error['cart']['404'][request.headers.language] }).code(404);
                return reply({
                    message: request.i18n.__('cart')['404']
                }).code(404);
        });
    });


}



const readStore = (itemId) => {
    return new Promise((resolve, reject) => {
        stores.isExist({
            id: itemId
        }, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}


/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    latitude: Joi.number().required().description('Latitude'),
    longitude: Joi.number().required().description('Longitude'),
}

/**
 * A module that exports customer get cart handler, get cart validator! 
 * @exports handler 
 */
module.exports = {
    handler,
    validator
}