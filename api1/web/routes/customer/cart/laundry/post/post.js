'use strict'
const cart = require('../../../../../../models/cart/cart');
const products = require('../../../../../../models/products');
const childProducts = require('../../../../../../models/childProducts');
const customer = require('../../../../../../models/customer');
const zones = require('../../../../../../models/zones');
const error = require('../../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Joi = require('joi');
const logger = require('winston');
const webSocket = require('../../../../../../library/websocket/websocket');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/


function sendNotification(proData) {
    webSocket.publish('cartUpdates/', proData, { qos: 2 }, (mqttErr, mqttRes) => {
    });
}



/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    let productData = {};
    let customerData = {};
    let zoneData = {};

    const readProducts = () => {

        return new Promise((resolve, reject) => {
            if (request.payload.productId == 0) {
                request.payload.productId = new ObjectID().toString();
                resolve(productData);

            } else {

                products.getOne({ _id: new ObjectID(request.payload.productId) }, (err, product) => {
                    if (err) {
                        reject({ code: 500 });
                    }
                    if (product) {
                        productData = product;
                    } else {

                        productData = {};
                        reject({ code: 404 });
                    }

                    resolve(productData);
                });
            }

        });
    }


    const readZone = () => {
        return new Promise((resolve, reject) => {
            zones.getCityId({ _id: new ObjectID(request.payload.zoneId) }, (err, zone) => {
                if (err) {
                    reject({ code: 500 });
                }
                if (zone) {
                    zoneData = zone;
                } else {

                    zoneData = {};
                    reject({ code: 404 });
                }
                logger.error(zoneData)
                resolve(zoneData);
            });
        });
    }

    const readCustomer = (itemId) => {
        return new Promise((resolve, reject) => {
            customer.isExistsWithId({ _id: new ObjectID(itemId) }, (err, customer) => {
                if (err) {
                    // reject(err);
                    reject({ code: 500 });
                }
                if (customer) {
                    customerData = customer;
                } else {
                    reject({ code: 404 });
                    customerData = {};
                }
                resolve(customerData);
            });
        });
    }

    readCustomer(request.auth.credentials.sub == 'customer' ? request.auth.credentials._id : request.payload.customerId)
        .then(readProducts)
        .then(readZone)
        .then(zoneData => { // promise to get stores
            logger.error(request.auth.credentials.sub)
            logger.warn(zoneData)
            logger.warn('zoneData')
            if (zoneData) {
                let createdBy = '';
                let customerPhone = '';
                let customerEmail = '';
                switch (request.auth.credentials.sub) {
                    case 'customer':
                        createdBy = request.auth.credentials.sub;
                        request.auth.credentials._id = request.auth.credentials._id
                        break;
                    case 'manager':
                        createdBy = request.auth.credentials.sub;
                        request.auth.credentials._id = request.payload.customerId;
                        break;
                    case 'guest':
                        createdBy = request.auth.credentials.sub;
                        request.auth.credentials._id = request.auth.credentials._id;
                        break;
                    default:
                        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                }

                cart.isExists({ userId: request.auth.credentials._id.toString() }, (err, data) => {
                    if (err) {
                        logger.error('Error occurred while checking cart : ' + err);
                        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                    }

                    if (data) {
                        cart.isExistsWithItemLaundry({ userId: request.auth.credentials._id.toString(), productId: request.payload.productId }, (err, isItem) => {
                            if (err) {
                                logger.error('Error occurred while checking cart : ' + err);
                                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                            }
                            if (isItem)
                                return reply({ message: request.i18n.__('cart')['412'] }).code(412);
                            else {
                                cart.pushItemToCartLaundry({
                                    catName: productData.catName ? productData.catName[request.headers.language] : "",
                                    mileageMetric: zoneData.mileageMetric,
                                    currencySymbol: zoneData.currencySymbol ? zoneData.currencySymbol : zoneData.currencySymbol,
                                    currency: zoneData.currency ? zoneData.currency : zoneData.currency,
                                    userId: request.auth.credentials._id.toString(), customerName: customerData.name,
                                    city: zoneData.city, cityId: zoneData.city_ID, productId: request.payload.productId,
                                    itemName: request.payload.productName,
                                    storeType: request.payload.storeType,
                                    cartsAllowed: 1,
                                    itemImageURL: productData.images && productData.images.length > 0 ? productData.images[0]['image'] : '',
                                    quantity: request.payload.quantity, createdBy: request.auth.credentials.sub,
                                    customerEmail: customerData.email,
                                    customerPhone: customerData.phone
                                }, (err, res) => {

                                    if (err) {
                                        logger.error('Error occurred while adding to cart : ' + err);
                                        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                                    } else {
                                        sendNotification({ userId: request.auth.credentials._id.toString(), productId: request.payload.productId, message: "added to cart" });
                                        return reply({ message: request.i18n.__('cart')['201'], data: { cartId: data._id ? data._id : "", productId: request.payload.productId } }).code(201);
                                    }
                                });
                            }
                        });
                    }
                    else {
                        cart.postSaveLaundry({
                            catName: productData.catName ? productData.catName[request.headers.language] : "",
                            orderType: 1,
                            orderTypeMsg: 'Default order',
                            mileageMetric: zoneData.mileageMetric,
                            currencySymbol: zoneData.currencySymbol ? zoneData.currencySymbol : zoneData.currencySymbol,
                            currency: zoneData.currency ? zoneData.currency : zoneData.currency,
                            userId: request.auth.credentials._id.toString(),
                            customerName: customerData.name, city: zoneData.city, cityId: zoneData.city_ID,
                            productId: request.payload.productId,
                            itemName: request.payload.productName,
                            storeType: request.payload.storeType,
                            cartsAllowed: 1,
                            itemImageURL: productData.images && productData.images.length > 0 ? productData.images[0]['image'] : '',
                            quantity: request.payload.quantity,
                            createdBy: request.auth.credentials.sub,
                            customerEmail: customerData.email,
                            customerPhone: customerData.phone
                        }, (err, res) => {

                            if (err) {
                                logger.error('Error occurred while adding to cart : ' + err);
                                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                            }
                            else {
                                sendNotification({ userId: request.auth.credentials._id.toString(), productId: request.payload.productId, message: "added to cart" });
                                return reply({ message: request.i18n.__('cart')['201'], data: { cartId: res.ops ? res.ops[0]._id.toString() : "", productId: request.payload.productId } }).code(201);
                            }
                        });
                    }
                });
            } else {
                return reply({ message: request.i18n.__('getData')['404'] }).code(404);
            }
        }).catch(e => {
            logger.error('err during get fare(catch) ' + JSON.stringify(e));
            if (e.code == 404) {
                return reply({ message: request.i18n.__('getData')['404'] }).code(404);
            } else {
                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            }
        });
}

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handlerCustomCart = (request, reply) => {
    let storeData = {};
    // let productData = {};
    let customerData = {};
    let zoneData = {};

    const readZone = (itemId) => {
        return new Promise((resolve, reject) => {
            zones.getCityId({ city_ID: storeData.cityId }, (err, zone) => {
                if (err) {
                    reject({ code: 500 });
                }
                if (zone) {
                    zoneData = zone;
                } else {
                    reject({ code: 404 });
                    zoneData = {};
                }
                logger.error(zoneData)
                resolve(zoneData);
            });
        });
    }

    const readCustomer = (itemId) => {
        return new Promise((resolve, reject) => {
            customer.isExistsWithId({ _id: new ObjectID(itemId) }, (err, customer) => {
                if (err) {
                    // reject(err);
                    reject({ code: 500 });
                }
                if (customer) {
                    customerData = customer;
                } else {
                    reject({ code: 404 });
                    customerData = {};
                }
                // customerData = customer;
                resolve(customerData);
            });
        });
    }

    readCustomer(request.auth.credentials.sub == 'customer' ? request.auth.credentials._id : request.payload.customerId).then(readStore).then(readZone).then(store => { // promise to get stores
        logger.error(request.auth.credentials.sub)
        logger.error(store)
        if (store) {
            let createdBy = '';
            let customerPhone = '';
            let customerEmail = '';
            switch (request.auth.credentials.sub) {
                case 'customer':
                    createdBy = request.auth.credentials.sub;
                    request.auth.credentials._id = request.auth.credentials._id
                    break;
                case 'manager':
                    createdBy = request.auth.credentials.sub;
                    request.auth.credentials._id = request.payload.customerId;
                    break;
                case 'guest':
                    createdBy = request.auth.credentials.sub;
                    request.auth.credentials._id = request.auth.credentials._id;
                    break;
                default:
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            }

            request.payload.unitId = new ObjectID().toString();
            request.payload.unitName = request.payload.unitName ? request.payload.unitName : ""
            request.payload.offerId = "";
            request.payload.unitPrice = request.payload.unitPrice ? request.payload.unitPrice : 0;
            request.payload.finalPrice = request.payload.unitPrice ? request.payload.unitPrice : 0;
            request.payload.appliedDiscount = 0;
            request.payload.itemName = request.payload.itemName ? request.payload.itemName : "";
            request.payload.childProductId = new ObjectID().toString();
            cart.isExists({ userId: request.auth.credentials._id.toString() }, (err, data) => {

                if (err) {
                    logger.error('Error occurred while checking cart : ' + err);
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                if (data) {
                    cart.isExistsWithItem({ userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId, unitId: request.payload.unitId }, (err, isItem) => {
                        if (err) {
                            logger.error('Error occurred while checking cart : ' + err);
                            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                        }
                        if (isItem)
                            return reply({ message: request.i18n.__('cart')['412'] }).code(412);
                        else {
                            cart.pushItemToCartLaundry({
                                mileageMetric: zoneData.mileageMetric,
                                currencySymbol: storeData.currencySymbol ? storeData.currencySymbol : zoneData.currencySymbol, currency: storeData.currency ? storeData.currency : zoneData.currency, userId: request.auth.credentials._id.toString(), customerName: customerData.name, city: zoneData.city, cityId: storeData.cityId, childProductId: request.payload.childProductId, unitId: request.payload.unitId, unitName: request.payload.unitName, parentProductId: "", storeId: storeData._id.toString(), storeName: storeData.sName[request.headers.language], storeAddress: storeData.storeAddr ? storeData.storeAddr : "", storeLogo: storeData.profileLogos ? storeData.profileLogos.logoImage : "", storePhone: storeData.bcountryCode ? storeData.bcountryCode + storeData.businessNumber : "", sku: "", itemName: request.payload.itemName, upc: "", itemImageURL: '', quantity: request.payload.quantity, unitPrice: request.payload.unitPrice, coordinates: { longitude: parseFloat(storeData.coordinates.longitude || 0.0), latitude: parseFloat(storeData.coordinates.latitude || 0.0) }, createdBy: request.auth.credentials.sub,
                                finalPrice: request.payload.finalPrice, appliedDiscount: request.payload.appliedDiscount,
                                offerId: request.payload.offerId ? request.payload.offerId : 0,
                                taxes: [],
                                customerEmail: customerData.email,
                                customerPhone: customerData.phone
                            }, (err, res) => {
                                if (err) {
                                    logger.error('Error occurred while adding to cart : ' + err);
                                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                                } else {
                                    childProducts.pushToCart({ userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId, unitId: request.payload.unitId, createdBy: request.auth.credentials.sub }, (err, data) => {
                                    });
                                    // sendNotification({ storeId: productData.storeId.toString(), userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId, unitId: request.payload.unitId, message: "added to cart" });
                                    return reply({ message: request.i18n.__('cart')['201'], data: { cartId: data ? data._id.toString() : "", productId: request.payload.productId } }).code(201);
                                }
                            });
                        }
                    });
                }
                else {
                    cart.postSave({
                        orderType: request.payload.orderType,//3,
                        orderTypeMsg: 'Bulk Order',
                        billNumber: request.payload.billNumber ? request.payload.billNumber : "N/A",
                        mileageMetric: zoneData.mileageMetric,
                        currencySymbol: storeData.currencySymbol ? storeData.currencySymbol : zoneData.currencySymbol, currency: storeData.currency ? storeData.currency : zoneData.currency, userId: request.auth.credentials._id.toString(), customerName: customerData.name, city: zoneData.city, cityId: storeData.cityId, childProductId: request.payload.childProductId, unitId: request.payload.unitId, unitName: request.payload.unitName, parentProductId: "", storeId: storeData._id.toString(), storeName: storeData.sName[request.headers.language], storeAddress: storeData.storeAddr ? storeData.storeAddr : "", storeLogo: storeData.profileLogos ? storeData.profileLogos.logoImage : "", storePhone: storeData.bcountryCode ? storeData.bcountryCode + storeData.businessNumber : "", sku: "", itemName: request.payload.itemName, upc: "", itemImageURL: '', quantity: request.payload.quantity, unitPrice: request.payload.unitPrice, coordinates: { longitude: parseFloat(storeData.coordinates.longitude || 0.0), latitude: parseFloat(storeData.coordinates.latitude || 0.0) }, createdBy: request.auth.credentials.sub,
                        finalPrice: request.payload.finalPrice, appliedDiscount: request.payload.appliedDiscount,
                        offerId: request.payload.offerId ? request.payload.offerId : 0,
                        taxes: [],
                        customerEmail: customerData.email,
                        customerPhone: customerData.phone
                    }, (err, res) => {
                        if (err) {
                            logger.error('Error occurred while adding to cart : ' + err);
                            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                        }
                        else {

                            //  sendNotification({ storeId: productData.storeId.toString(), userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId, unitId: request.payload.unitId, message: "added to cart" });
                            return reply({ message: request.i18n.__('cart')['201'], data: { cartId: res.ops ? res.ops[0]._id.toString() : "", childProductId: request.payload.childProductId, unitId: request.payload.unitId } }).code(201);
                        }
                    });
                }
            });
        } else {
            return reply({ message: request.i18n.__('getData')['404'] }).code(404);
        }
    }).catch(e => {
        logger.error('err during get fare(catch) ' + JSON.stringify(e));
        if (e.code == 404) {
            return reply({ message: request.i18n.__('getData')['404'] }).code(404);
        } else {
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
    });
}

const handlerClearCart = (request, reply) => {

    cart.clearCartZoneChange({
        createdBy: request.auth.credentials.sub,
        customerName: '', userId: request.payload.customerId
    }, (err, isCleared) => {

        if (err) {
            logger.error('while clearing cart');
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }

        return reply({ message: request.i18n.__('cart')['200'] }).code(200);

    });



}
/**
* A module that exports add cart handler, add cart validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, handlerCustomCart, handlerClearCart }