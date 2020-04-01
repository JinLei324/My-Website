'use strict'
const cart = require('../../../../models/cart');
const childProducts = require('../../../../models/childProducts');
const stores = require('../../../../models/stores');
const customer = require('../../../../models/customer');
const valiDateAddOns = require('../../../commonModels/addOns');
const zones = require('../../../../models/zones');
const error = require('../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const async = require("async");
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Joi = require('joi');
const logger = require('winston');
const webSocket = require('../../../../library/websocket/websocket');
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
const handlerNew = (request, reply) => {
    let storeData = {};
    let productData = {};
    let customerData = {};
    let zoneData = {};

    let storeType = 1;
    let addOnsData = request.payload.addOns;
    let addOnFlag = ""
    let addedToCartOn = moment().unix();
    let addOnsDataToCart = [];
    if (addOnsData && addOnsData.length > 1) {
        addOnFlag = 1

        async.each(addOnsData, (addOnsDataSAdded, callBack) => {
            addOnsDataToCart.push({
                "addOnGroup": addOnsDataSAdded.addOnGroup,
                "id": addOnsDataSAdded.id,
                "packId": new ObjectID().toString()
            })
        })

    } else {
        addOnFlag = 0;
    }
    if (addOnsData.length == 0) {
        addOnsData = [];
    }

    const readChildProducts = (itemId) => {
        return new Promise((resolve, reject) => {
            childProducts.getProductDetailsUnitId({ _id: new ObjectID(request.payload.childProductId), unitId: request.payload.unitId }, (err, product) => {
                if (err) {
                    reject({ code: 500 });
                }
                if (product) {
                    productData = product;
                } else {
                    reject({ code: 404 });
                    productData = {};
                }
                resolve(productData);
            });
        });
    }
    const readStore = (itemId) => {
        return new Promise((resolve, reject) => {
            stores.isExistsWithId({ _id: new ObjectID(productData.storeId.toString()) }, (err, store) => {
                if (err) {
                    // reject(err);
                    reject({ code: 500 });
                }
                if (store) {
                    storeData = store;

                } else {
                    reject({ code: 404 });
                    storeData = {};
                }
                // logger.warn('storeData ' + JSON.stringify(storeData))
                resolve(store);
            });
        });
    }
    // const readCity = () => {
    //     return new Promise((resolve, reject) => {
    //         cities.inZone({ lat: request.payload.latitude, long: request.payload.longitude }, (err, data) => {
    //             if (err) {
    //                 logger.error('Error occurred during get fare (inZoneAll): ' + JSON.stringify(err));
    //                 reject({ code: 500 });
    //             }
    //             if (data && data.cities) {
    //                 data = data.cities[0];
    //                 cityData = data;
    //                 resolve(cityData);
    //             } else {
    //                 reject({ code: 400 });
    //             }
    //         });
    //     });
    // }
    const readZone = (itemId) => {
        return new Promise((resolve, reject) => {
            zones.getCityId({ city_ID: storeData.cityId }, (err, zone) => {
                if (err) {
                    // reject(err);
                    reject({ code: 500 });
                }
                if (zone) {
                    zoneData = zone;
                } else {
                    reject({ code: 404 });
                    zoneData = {};
                }
                // zoneData = zone;
                // logger.error(zoneData)
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

    readCustomer(request.auth.credentials.sub == 'customer' ? request.auth.credentials._id : request.payload.customerId).then(readChildProducts).then(readStore).then(readZone).then(store => { // promise to get stores

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
                case 'dispatcher':
                    createdBy = request.auth.credentials.sub;
                    request.auth.credentials._id = request.payload.customerId;
                    break;
                default:
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            }

            // logger.error(productData)

            for (let s = 0; s < productData.units.length; s++) {
                productData.units[s].appliedDiscount = 0;
                productData.units[s].offerId = "";
                productData.units[s].title = productData.units[s].name[request.headers.language] ? productData.units[s].name[request.headers.language] : "";
                productData.units[s].value = productData.units[s].price["en"] ? parseFloat(productData.units[s].price["en"]) : 0;
                productData.units[s].finalPrice = productData.units[s].value ? parseFloat(productData.units[s].value) : 0;
                delete productData.units[s].name;
                delete productData.units[s].price;
                delete productData.units[s].sizeAttributes;
            }
            if (productData.offer && productData.offer.length > 0) { // offers
                for (let k = 0; k < productData.offer.length; k++) {
                    if (productData.offer[k].status == 1 && productData.offer[k].endDateTime > moment().unix() && moment().unix() > productData.offer[k].startDateTime) { //check status and expiry.
                        // if (productData.offer[k].status == 1) { //check status and expiry
                        productData.prefUnits = [];
                        // logger.error(moment().unix());

                        for (let l = 0; l < productData.units.length; l++) {
                            let logic = 0;
                            if (productData.offer[k].discountType == 0) {// flat price
                                logic = parseFloat(productData.offer[k].discountValue)
                            } else {
                                logic = (productData.units[l].value / 100) * parseFloat(productData.offer[k].discountValue)
                            }
                            if (productData.offer[k].applicableOn == 1) { // if productData
                                for (let m = 0; m < productData.offer[k].unitid.length; m++) {
                                    if (productData.units[l].unitId == productData.offer[k].unitid[m]) {
                                        productData.prefUnits.push({
                                            title: productData.units[l].title,
                                            status: productData.units[l].status,
                                            value: productData.units[l].value,
                                            unitId: productData.units[l].unitId,
                                            appliedDiscount: logic,
                                            offerId: productData.offer[k].offerId ? productData.offer[k].offerId : "",
                                            finalPrice: productData.units[l].value - (logic)
                                        })
                                    } else {
                                        productData.prefUnits.push({
                                            title: productData.units[l].title,
                                            status: productData.units[l].status,
                                            value: productData.units[l].value,
                                            unitId: productData.units[l].unitId,
                                            appliedDiscount: 0,
                                            offerId: "",
                                            finalPrice: productData.units[l].value - 0
                                        })
                                    }
                                }
                            } else {
                                productData.prefUnits.push({
                                    title: productData.units[l].title,
                                    status: productData.units[l].status,
                                    value: productData.units[l].value,
                                    unitId: productData.units[l].unitId,
                                    appliedDiscount: logic,
                                    offerId: productData.offer[k].offerId ? productData.offer[k].offerId : "",
                                    finalPrice: productData.units[l].value - logic
                                })
                            }
                        }
                    }
                }
            }
            if (productData.prefUnits && productData.prefUnits.length > 0) {
                productData.units = productData.prefUnits;
            }
            if (productData.addOns && productData.addOns.length > 0) {
                var addOnsAvailableForProduct = 1
            } else {
                var addOnsAvailableForProduct = 0
            }
            // logger.warn(productData.parentProductId)
            for (let i = 0; i < productData.units.length; i++) {
                if (String(productData.units[i].unitId) == String(request.payload.unitId)) {
                    request.payload.unitId = productData.units[i].unitId;
                    request.payload.unitName = productData.units[i].title;
                    request.payload.offerId = productData.units[i].offerId;
                    request.payload.unitPrice = productData.units[i].value ? productData.units[i].value : 0;
                    request.payload.finalPrice = productData.units[i].finalPrice ? productData.units[i].finalPrice : 0;
                    request.payload.appliedDiscount = productData.units[i].appliedDiscount ? productData.units[i].appliedDiscount : 0;
                }
            }
            // if (product) {
            let taxes = productData.taxes ? productData.taxes.length > 0 ? productData.taxes : [] : [];
            //Formula for GST calculation:
            // Add GST:
            // GST Amount = (Original Cost x GST%)/100
            // Net Price = Original Cost + GST Amount
            for (let i = 0; i < taxes.length; i++) {
                taxes[i].price = ((request.payload.unitPrice * taxes[i].taxValue) / 100);
            }
            cart.isExists({ userId: request.auth.credentials._id.toString() }, (err, data) => {
                // logger.error(request.payload);
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
                        if (isItem) {
                            if (storeType = 1) {

                                /*
                                    @ If store type is 1 (resturant)
                                    @ Check if cart has same addons 
                                    @ If same addOns then increase the count else make a new entry
                                */

                                let addedItems = isItem.items;
                                let matchedItems = [];
                                let addOnsMatched = 0;
                                async.each(addedItems, (addedItem, callback) => {
                                    if ("removedFromCartOn" in addedItem) {
                                        // Do nothing
                                    } else {
                                        if (addedItem.addOns) {
                                            let checkAddOnsStatus = valiDateAddOns.compareAddOns(addedItem.addOns, addOnsData);
                                            if (valiDateAddOns.compareAddOns(addedItem.addOns, addOnsData)) {

                                                addOnsMatched = 1;
                                                /*
                                                Increase the count
                                                */
                                                cart.updateQuantity({
                                                    cartId: isItem._id,
                                                    childProductId: request.payload.childProductId,
                                                    unitId: request.payload.unitId,
                                                    quantity: 1,
                                                    userId: request.auth.credentials._id.toString(),
                                                    customerName: "",
                                                    createdBy: request.auth.credentials.sub,
                                                    addedToCartOn: addedItem.addedToCartOn,
                                                }, (err, res) => {

                                                    if (err) {
                                                        return reply({
                                                            message: request.i18n.__('genericErrMsg')['500']
                                                        }).code(500);


                                                    } else {

                                                        return reply({
                                                            message: request.i18n.__('cart')['201'],
                                                            data: {
                                                                cartId: isItem._id.toString()
                                                            }
                                                        }).code(201);
                                                    }

                                                });
                                                // break;
                                                // next('unique!');

                                            }
                                        }

                                    }
                                })
                                if (addOnsMatched == 0) {
                                    /*
                                     add new product 
                                    */
                                    cart.pushItemToCart({
                                        catName: productData.catName ? productData.catName[request.headers.language] : "",
                                        subCatName: productData.subCatName ? productData.subCatName[request.headers.language] : "",
                                        subSubCatName: productData.subSubCatName ? productData.subSubCatName[request.headers.language] : "",
                                        mileageMetric: zoneData.mileageMetric,
                                        currencySymbol: storeData.currencySymbol ? storeData.currencySymbol : zoneData.currencySymbol, currency: storeData.currency ? storeData.currency : zoneData.currency, userId: request.auth.credentials._id.toString(), customerName: customerData.name, city: zoneData.city, cityId: storeData.cityId, childProductId: request.payload.childProductId, unitId: request.payload.unitId, unitName: request.payload.unitName, parentProductId: productData.parentProductId, storeId: storeData._id.toString(), franchiseId: storeData.franchiseId, storeName: storeData.sName[request.headers.language], storeAddress: storeData.storeAddr ? storeData.storeAddr : "", storeLogo: storeData.profileLogos ? storeData.profileLogos.logoImage : "", storePhone: storeData.bcountryCode ? storeData.bcountryCode + storeData.businessNumber : "", sku: productData.sku, itemName: productData.productname[request.headers.language], upc: productData.upc, itemImageURL: productData.images && productData.images.length > 0 ? productData.images[0]['image'] : '', quantity: request.payload.quantity, unitPrice: request.payload.unitPrice, coordinates: { longitude: parseFloat(storeData.coordinates.longitude || 0.0), latitude: parseFloat(storeData.coordinates.latitude || 0.0) }, createdBy: request.auth.credentials.sub,
                                        finalPrice: request.payload.finalPrice, appliedDiscount: request.payload.appliedDiscount,
                                        offerId: request.payload.offerId ? request.payload.offerId : 0,
                                        taxes: taxes,
                                        customerEmail: customerData.email,
                                        customerPhone: customerData.phone,
                                        addedToCartOn: addedToCartOn,
                                        addOns: addOnsData || [],
                                        addOnsAdded: addOnFlag || 0,
                                        addOnsAvailableForProduct: addOnsAvailableForProduct || []
                                    }, (err, res) => {

                                        if (err) {
                                            logger.error('Error occurred while adding to cart : ' + err);
                                            return reply({
                                                message: request.i18n.__('genericErrMsg')['500']
                                            }).code(500);
                                        } else {
                                            childProducts.pushToCart({
                                                userId: request.auth.credentials._id.toString(),
                                                childProductId: request.payload.childProductId,
                                                unitId: request.payload.unitId,
                                                createdBy: request.auth.credentials.sub
                                            }, (err, data) => {
                                            });

                                            sendNotification({
                                                storeId: productData.storeId.toString(),
                                                userId: request.auth.credentials._id.toString(),
                                                childProductId: request.payload.childProductId,
                                                unitId: request.payload.unitId,
                                                message: "added to cart"
                                            });
                                            return reply({
                                                message: request.i18n.__('cart')['201'],
                                                data: {
                                                    cartId: data ? data._id.toString() : "",
                                                    packId: addedToCartOn
                                                }
                                            }).code(201);


                                        }
                                    });
                                }
                            } else {
                                return reply({
                                    message: request.i18n.__('cart')['412']
                                }).code(412);
                            }
                            // return reply({ message: request.i18n.__('cart')['412'] }).code(412);
                        } else {
                            cart.pushItemToCart({
                                catName: productData.catName ? productData.catName[request.headers.language] : "",
                                subCatName: productData.subCatName ? productData.subCatName[request.headers.language] : "",
                                subSubCatName: productData.subSubCatName ? productData.subSubCatName[request.headers.language] : "",
                                mileageMetric: zoneData.mileageMetric,
                                currencySymbol: storeData.currencySymbol ? storeData.currencySymbol : zoneData.currencySymbol, currency: storeData.currency ? storeData.currency : zoneData.currency, userId: request.auth.credentials._id.toString(), customerName: customerData.name, city: zoneData.city, cityId: storeData.cityId, childProductId: request.payload.childProductId, unitId: request.payload.unitId, unitName: request.payload.unitName, parentProductId: productData.parentProductId, storeId: storeData._id.toString(), franchiseId: storeData.franchiseId, storeName: storeData.sName[request.headers.language], storeAddress: storeData.storeAddr ? storeData.storeAddr : "", storeLogo: storeData.profileLogos ? storeData.profileLogos.logoImage : "", storePhone: storeData.bcountryCode ? storeData.bcountryCode + storeData.businessNumber : "", sku: productData.sku, itemName: productData.productname[request.headers.language], upc: productData.upc, itemImageURL: productData.images && productData.images.length > 0 ? productData.images[0]['image'] : '', quantity: request.payload.quantity, unitPrice: request.payload.unitPrice, coordinates: { longitude: parseFloat(storeData.coordinates.longitude || 0.0), latitude: parseFloat(storeData.coordinates.latitude || 0.0) }, createdBy: request.auth.credentials.sub,
                                finalPrice: request.payload.finalPrice, appliedDiscount: request.payload.appliedDiscount,
                                offerId: request.payload.offerId ? request.payload.offerId : 0,
                                taxes: taxes,
                                customerEmail: customerData.email,
                                customerPhone: customerData.phone,
                                addedToCartOn: addedToCartOn,
                                addOns: addOnsData || [],
                                addOnsAdded: addOnFlag || 0,
                                addOnsAvailableForProduct: addOnsAvailableForProduct || []
                            }, (err, res) => {
                                if (err) {
                                    logger.error('Error occurred while adding to cart : ' + err);
                                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                                } else {
                                    childProducts.pushToCart({ userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId, unitId: request.payload.unitId, createdBy: request.auth.credentials.sub }, (err, data) => {
                                    });
                                    sendNotification({ storeId: productData.storeId.toString(), userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId, unitId: request.payload.unitId, message: "added to cart" });
                                    return reply({ message: request.i18n.__('cart')['201'], data: { cartId: data ? data._id.toString() : "", packId: addedToCartOn } }).code(201);
                                }
                            });
                        }
                    });
                }
                else {
                    
                    cart.postSave({
                        catName: productData.catName ? productData.catName[request.headers.language] : "",
                        subCatName: productData.subCatName ? productData.subCatName[request.headers.language] : "",
                        subSubCatName: productData.subSubCatName ? productData.subSubCatName[request.headers.language] : "",
                        orderType: 1,
                        orderTypeMsg: 'Default order',
                        mileageMetric: zoneData.mileageMetric,
                        currencySymbol: storeData.currencySymbol ? storeData.currencySymbol : zoneData.currencySymbol, currency: storeData.currency ? storeData.currency : zoneData.currency, userId: request.auth.credentials._id.toString(), unitId: request.payload.unitId, unitName: request.payload.unitName, customerName: customerData.name, city: zoneData.city, cityId: storeData.cityId, childProductId: request.payload.childProductId, parentProductId: productData.parentProductId, storeId: storeData._id.toString(), franchiseId: storeData.franchiseId, storeName: storeData.sName[request.headers.language], storeAddress: storeData.storeAddr ? storeData.storeAddr : "", storeLogo: storeData.profileLogos ? storeData.profileLogos.logoImage : "", storePhone: storeData.bcountryCode ? storeData.bcountryCode + storeData.businessNumber : "", sku: productData.sku, itemName: productData.productname[request.headers.language], upc: productData.upc, itemImageURL: productData.images && productData.images.length > 0 ? productData.images[0]['image'] : '', quantity: request.payload.quantity,
                        unitPrice: request.payload.unitPrice,
                        coordinates: { longitude: parseFloat(storeData.coordinates.longitude || 0.0), latitude: parseFloat(storeData.coordinates.latitude || 0.0) }, createdBy: request.auth.credentials.sub, finalPrice: request.payload.finalPrice, appliedDiscount: request.payload.appliedDiscount, taxes: taxes, offerId: request.payload.offerId ? request.payload.offerId : 0,
                        customerEmail: customerData.email,
                        customerPhone: customerData.phone,
                        addedToCartOn: addedToCartOn,
                        addOns: addOnsData || [],
                        addOnsAdded: addOnFlag || 0,
                        addOnsAvailableForProduct: addOnsAvailableForProduct || []
                    }, (err, res) => {
                        if (err) {
                            logger.error('Error occurred while adding to cart : ' + err);
                            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                        }
                        else {
                            childProducts.pushToCart({ userId: request.auth.credentials._id.toString(), unitId: request.payload.unitId, childProductId: request.payload.childProductId, createdBy: request.auth.credentials.sub }, (err, data) => {
                            });
                            sendNotification({ storeId: productData.storeId.toString(), userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId, unitId: request.payload.unitId, message: "added to cart" });
                            return reply({ message: request.i18n.__('cart')['201'], data: { cartId: res.ops ? res.ops[0]._id.toString() : "", packId: addedToCartOn } }).code(201);
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

// const handlerNew = (request, reply) => {
//     let storeData = {};
//     let productData = {};
//     let customerData = {};
//     let zoneData = {};


//     const readChildProducts = (itemId) => {
//         return new Promise((resolve, reject) => {
//             childProducts.getProductDetailsUnitId({ _id: new ObjectID(request.payload.childProductId), unitId: request.payload.unitId }, (err, product) => {
//                 if (err) {
//                     reject({ code: 500 });
//                 }
//                 if (product) {
//                     productData = product;
//                 } else {
//                     reject({ code: 404 });
//                     productData = {};
//                 }
//                 resolve(productData);
//             });
//         });
//     }
//     const readStore = (itemId) => {
//         return new Promise((resolve, reject) => {
//             stores.isExistsWithId({ _id: new ObjectID(productData.storeId.toString()) }, (err, store) => {
//                 if (err) {
//                     // reject(err);
//                     reject({ code: 500 });
//                 }
//                 if (store) {
//                     storeData = store;

//                 } else {
//                     reject({ code: 404 });
//                     storeData = {};
//                 }
//                 // logger.warn('storeData ' + JSON.stringify(storeData))
//                 resolve(store);
//             });
//         });
//     }
//     // const readCity = () => {
//     //     return new Promise((resolve, reject) => {
//     //         cities.inZone({ lat: request.payload.latitude, long: request.payload.longitude }, (err, data) => {
//     //             if (err) {
//     //                 logger.error('Error occurred during get fare (inZoneAll): ' + JSON.stringify(err));
//     //                 reject({ code: 500 });
//     //             }
//     //             if (data && data.cities) {
//     //                 data = data.cities[0];
//     //                 cityData = data;
//     //                 resolve(cityData);
//     //             } else {
//     //                 reject({ code: 400 });
//     //             }
//     //         });
//     //     });
//     // }
//     const readZone = (itemId) => {
//         return new Promise((resolve, reject) => {
//             zones.getCityId({ city_ID: storeData.cityId }, (err, zone) => {
//                 if (err) {
//                     // reject(err);
//                     reject({ code: 500 });
//                 }
//                 if (zone) {
//                     zoneData = zone;
//                 } else {
//                     reject({ code: 404 });
//                     zoneData = {};
//                 }
//                 // zoneData = zone;
//                 // logger.error(zoneData)
//                 resolve(zoneData);
//             });
//         });
//     }

//     const readCustomer = (itemId) => {
//         return new Promise((resolve, reject) => {
//             customer.isExistsWithId({ _id: new ObjectID(itemId) }, (err, customer) => {
//                 if (err) {
//                     // reject(err);
//                     reject({ code: 500 });
//                 }
//                 if (customer) {
//                     customerData = customer;
//                 } else {
//                     reject({ code: 404 });
//                     customerData = {};
//                 }
//                 // customerData = customer;
//                 resolve(customerData);
//             });
//         });
//     }

//     readCustomer(request.auth.credentials.sub == 'customer' ? request.auth.credentials._id : request.payload.customerId).then(readChildProducts).then(readStore).then(readZone).then(store => { // promise to get stores

//         if (store) {
//             let createdBy = '';
//             let customerPhone = '';
//             let customerEmail = '';
//             switch (request.auth.credentials.sub) {
//                 case 'customer':
//                     createdBy = request.auth.credentials.sub;
//                     request.auth.credentials._id = request.auth.credentials._id
//                     break;
//                 case 'manager':
//                     createdBy = request.auth.credentials.sub;
//                     request.auth.credentials._id = request.payload.customerId;
//                     break;
//                 case 'guest':
//                     createdBy = request.auth.credentials.sub;
//                     request.auth.credentials._id = request.auth.credentials._id;
//                     break;
//                 case 'dispatcher':
//                     createdBy = request.auth.credentials.sub;
//                     request.auth.credentials._id = request.payload.customerId;
//                     break;
//                 default:
//                     return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
//             }

//             // logger.error(productData)

//             for (let s = 0; s < productData.units.length; s++) {
//                 productData.units[s].appliedDiscount = 0;
//                 productData.units[s].offerId = "";
//                 productData.units[s].title = productData.units[s].name[request.headers.language] ? productData.units[s].name[request.headers.language] : "";
//                 productData.units[s].value = productData.units[s].price["en"] ? parseFloat(productData.units[s].price["en"]) : 0;
//                 productData.units[s].finalPrice = productData.units[s].value ? parseFloat(productData.units[s].value) : 0;
//                 delete productData.units[s].name;
//                 delete productData.units[s].price;
//                 delete productData.units[s].sizeAttributes;
//             }
//             if (productData.offer && productData.offer.length > 0) { // offers
//                 for (let k = 0; k < productData.offer.length; k++) {
//                     if (productData.offer[k].status == 1 && productData.offer[k].endDateTime > moment().unix() && moment().unix() > productData.offer[k].startDateTime) { //check status and expiry.
//                         // if (productData.offer[k].status == 1) { //check status and expiry
//                         productData.prefUnits = [];
//                         // logger.error(moment().unix());

//                         for (let l = 0; l < productData.units.length; l++) {
//                             let logic = 0;
//                             if (productData.offer[k].discountType == 0) {// flat price
//                                 logic = parseFloat(productData.offer[k].discountValue)
//                             } else {
//                                 logic = (productData.units[l].value / 100) * parseFloat(productData.offer[k].discountValue)
//                             }
//                             if (productData.offer[k].applicableOn == 1) { // if productData
//                                 for (let m = 0; m < productData.offer[k].unitid.length; m++) {
//                                     if (productData.units[l].unitId == productData.offer[k].unitid[m]) {
//                                         productData.prefUnits.push({
//                                             title: productData.units[l].title, status: productData.units[l].status, value: productData.units[l].value, unitId: productData.units[l].unitId, appliedDiscount: logic,
//                                             offerId: productData.offer[k].offerId ? productData.offer[k].offerId : "",
//                                             finalPrice: productData.units[l].value - (logic)
//                                         })
//                                     } else {
//                                         productData.prefUnits.push({
//                                             title: productData.units[l].title,
//                                             status: productData.units[l].status, value: productData.units[l].value, unitId: productData.units[l].unitId, appliedDiscount: 0,
//                                             offerId: "",
//                                             finalPrice: productData.units[l].value - 0
//                                         })
//                                     }
//                                 }
//                             } else {
//                                 productData.prefUnits.push({
//                                     title: productData.units[l].title,
//                                     status: productData.units[l].status,
//                                     value: productData.units[l].value,
//                                     unitId: productData.units[l].unitId, appliedDiscount: logic,
//                                     offerId: productData.offer[k].offerId ? productData.offer[k].offerId : "",
//                                     finalPrice: productData.units[l].value - logic
//                                 })
//                             }
//                         }
//                     }
//                 }
//             }
//             if (productData.prefUnits && productData.prefUnits.length > 0) {
//                 productData.units = productData.prefUnits;
//             }
//             // logger.warn(productData.parentProductId)
//             for (let i = 0; i < productData.units.length; i++) {
//                 if (String(productData.units[i].unitId) == String(request.payload.unitId)) {
//                     request.payload.unitId = productData.units[i].unitId;
//                     request.payload.unitName = productData.units[i].title;
//                     request.payload.offerId = productData.units[i].offerId;
//                     request.payload.unitPrice = productData.units[i].value ? productData.units[i].value : 0;
//                     request.payload.finalPrice = productData.units[i].finalPrice ? productData.units[i].finalPrice : 0;
//                     request.payload.appliedDiscount = productData.units[i].appliedDiscount ? productData.units[i].appliedDiscount : 0;
//                 }
//             }
//             // if (product) {
//             let taxes = productData.taxes ? productData.taxes.length > 0 ? productData.taxes : [] : [];
//             //Formula for GST calculation:
//             // Add GST:
//             // GST Amount = (Original Cost x GST%)/100
//             // Net Price = Original Cost + GST Amount
//             for (let i = 0; i < taxes.length; i++) {
//                 taxes[i].price = ((request.payload.unitPrice * taxes[i].taxValue) / 100);
//             }
//             cart.isExists({ userId: request.auth.credentials._id.toString() }, (err, data) => {
//                 // logger.error(request.payload);
//                 if (err) {
//                     logger.error('Error occurred while checking cart : ' + err);
//                     return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
//                 }
//                 if (data) {
//                     cart.isExistsWithItem({ userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId, unitId: request.payload.unitId }, (err, isItem) => {
//                         if (err) {
//                             logger.error('Error occurred while checking cart : ' + err);
//                             return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
//                         }
//                         if (isItem)
//                             return reply({ message: request.i18n.__('cart')['412'] }).code(412);
//                         else {
//                             cart.pushItemToCart({
//                                 catName: productData.catName ? productData.catName[request.headers.language] : "",
//                                 subCatName: productData.subCatName ? productData.subCatName[request.headers.language] : "",
//                                 subSubCatName: productData.subSubCatName ? productData.subSubCatName[request.headers.language] : "",
//                                 mileageMetric: zoneData.mileageMetric,
//                                 currencySymbol: storeData.currencySymbol ? storeData.currencySymbol : zoneData.currencySymbol, currency: storeData.currency ? storeData.currency : zoneData.currency, userId: request.auth.credentials._id.toString(), customerName: customerData.name, city: zoneData.city, cityId: storeData.cityId, childProductId: request.payload.childProductId, unitId: request.payload.unitId, unitName: request.payload.unitName, parentProductId: productData.parentProductId, storeId: storeData._id.toString(),franchiseId: storeData.franchiseId, storeName: storeData.sName[request.headers.language], storeAddress: storeData.storeAddr ? storeData.storeAddr : "", storeLogo: storeData.profileLogos ? storeData.profileLogos.logoImage : "", storePhone: storeData.bcountryCode ? storeData.bcountryCode + storeData.businessNumber : "", sku: productData.sku, itemName: productData.productname[request.headers.language], upc: productData.upc, itemImageURL: productData.images && productData.images.length > 0 ? productData.images[0]['image'] : '', quantity: request.payload.quantity, unitPrice: request.payload.unitPrice, coordinates: { longitude: parseFloat(storeData.coordinates.longitude || 0.0), latitude: parseFloat(storeData.coordinates.latitude || 0.0) }, createdBy: request.auth.credentials.sub,
//                                 finalPrice: request.payload.finalPrice, appliedDiscount: request.payload.appliedDiscount,
//                                 offerId: request.payload.offerId ? request.payload.offerId : 0,
//                                 taxes: taxes,
//                                 customerEmail: customerData.email,
//                                 customerPhone: customerData.phone
//                             }, (err, res) => {
//                                 if (err) {
//                                     logger.error('Error occurred while adding to cart : ' + err);
//                                     return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
//                                 } else {
//                                     childProducts.pushToCart({ userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId, unitId: request.payload.unitId, createdBy: request.auth.credentials.sub }, (err, data) => {
//                                     });
//                                     sendNotification({ storeId: productData.storeId.toString(), userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId, unitId: request.payload.unitId, message: "added to cart" });
//                                     return reply({ message: request.i18n.__('cart')['201'], data: { cartId: data ? data._id.toString() : "" } }).code(201);
//                                 }
//                             });
//                         }
//                     });
//                 }
//                 else {
//                     cart.postSave({
//                         catName: productData.catName ? productData.catName[request.headers.language] : "",
//                         subCatName: productData.subCatName ? productData.subCatName[request.headers.language] : "",
//                         subSubCatName: productData.subSubCatName ? productData.subSubCatName[request.headers.language] : "",
//                         orderType: 1,
//                         orderTypeMsg: 'Default order',
//                         mileageMetric: zoneData.mileageMetric,
//                         currencySymbol: storeData.currencySymbol ? storeData.currencySymbol : zoneData.currencySymbol, currency: storeData.currency ? storeData.currency : zoneData.currency, userId: request.auth.credentials._id.toString(), unitId: request.payload.unitId, unitName: request.payload.unitName, customerName: customerData.name, city: zoneData.city, cityId: storeData.cityId, childProductId: request.payload.childProductId, parentProductId: productData.parentProductId, storeId: storeData._id.toString(),franchiseId: storeData.franchiseId, storeName: storeData.sName[request.headers.language], storeAddress: storeData.storeAddr ? storeData.storeAddr : "", storeLogo: storeData.profileLogos ? storeData.profileLogos.logoImage : "", storePhone: storeData.bcountryCode ? storeData.bcountryCode + storeData.businessNumber : "", sku: productData.sku, itemName: productData.productname[request.headers.language], upc: productData.upc, itemImageURL: productData.images && productData.images.length > 0 ? productData.images[0]['image'] : '', quantity: request.payload.quantity,
//                         unitPrice: request.payload.unitPrice,
//                         coordinates: { longitude: parseFloat(storeData.coordinates.longitude || 0.0), latitude: parseFloat(storeData.coordinates.latitude || 0.0) }, createdBy: request.auth.credentials.sub, finalPrice: request.payload.finalPrice, appliedDiscount: request.payload.appliedDiscount, taxes: taxes, offerId: request.payload.offerId ? request.payload.offerId : 0,
//                         customerEmail: customerData.email,
//                         customerPhone: customerData.phone
//                     }, (err, res) => {
//                         if (err) {
//                             logger.error('Error occurred while adding to cart : ' + err);
//                             return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
//                         }
//                         else {
//                             childProducts.pushToCart({ userId: request.auth.credentials._id.toString(), unitId: request.payload.unitId, childProductId: request.payload.childProductId, createdBy: request.auth.credentials.sub }, (err, data) => {
//                             });
//                             sendNotification({ storeId: productData.storeId.toString(), userId: request.auth.credentials._id.toString(), childProductId: request.payload.childProductId, unitId: request.payload.unitId, message: "added to cart" });
//                             return reply({ message: request.i18n.__('cart')['201'], data: { cartId: res.ops ? res.ops[0]._id.toString() : "" } }).code(201);
//                         }
//                     });
//                 }
//             });
//         } else {
//             return reply({ message: request.i18n.__('getData')['404'] }).code(404);
//         }
//     }).catch(e => {
//         logger.error('err during get fare(catch) ' + JSON.stringify(e));
//         if (e.code == 404) {
//             return reply({ message: request.i18n.__('getData')['404'] }).code(404);
//         } else {
//             return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
//         }
//     });
// }
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

    // const readChildProducts = (itemId) => {
    //     return new Promise((resolve, reject) => {
    //         childProducts.getProductDetails({ _id: new ObjectID(request.payload.childProductId) }, (err, product) => {
    //             if (err) {
    //                 reject({ code: 500 });
    //             }
    //             if (product) {
    //                 productData = product;
    //             } else {
    //                 reject({ code: 404 });
    //                 productData = {};
    //             }
    //             resolve(productData);
    //         });
    //     });
    // }
    const readStore = (itemId) => {
        return new Promise((resolve, reject) => {
            stores.isExistsWithId({ _id: new ObjectID(request.payload.storeId.toString()) }, (err, store) => {
                if (err) {
                    // reject(err);
                    reject({ code: 500 });
                }
                if (store) {
                    storeData = store;
                } else {
                    reject({ code: 404 });
                    storeData = {};
                }
                resolve(storeData);
            });
        });
    }

    const readZone = (itemId) => {
        return new Promise((resolve, reject) => {
            zones.getCityId({ city_ID: storeData.cityId }, (err, zone) => {
                if (err) {
                    // reject(err);
                    reject({ code: 500 });
                }
                if (zone) {
                    zoneData = zone;
                } else {
                    reject({ code: 404 });
                    zoneData = {};
                }
                // zoneData = zone;
                // logger.error(zoneData)
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
        // logger.error(request.auth.credentials.sub)
        // logger.error(store)
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
                case 'dispatcher':
                    createdBy = request.auth.credentials.sub;
                    request.auth.credentials._id = request.payload.customerId;
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
                            cart.pushItemToCart({
                                mileageMetric: zoneData.mileageMetric,
                                currencySymbol: storeData.currencySymbol ? storeData.currencySymbol : zoneData.currencySymbol, currency: storeData.currency ? storeData.currency : zoneData.currency, userId: request.auth.credentials._id.toString(), customerName: customerData.name, city: zoneData.city, cityId: storeData.cityId, childProductId: request.payload.childProductId, unitId: request.payload.unitId, unitName: request.payload.unitName, parentProductId: "", storeId: storeData._id.toString(), franchiseId: storeData.franchiseId, storeName: storeData.sName[request.headers.language], storeAddress: storeData.storeAddr ? storeData.storeAddr : "", storeLogo: storeData.profileLogos ? storeData.profileLogos.logoImage : "", storePhone: storeData.bcountryCode ? storeData.bcountryCode + storeData.businessNumber : "", sku: "", itemName: request.payload.itemName, upc: "", itemImageURL: '', quantity: request.payload.quantity, unitPrice: request.payload.unitPrice, coordinates: { longitude: parseFloat(storeData.coordinates.longitude || 0.0), latitude: parseFloat(storeData.coordinates.latitude || 0.0) }, createdBy: request.auth.credentials.sub,
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
                                    return reply({ message: request.i18n.__('cart')['201'], data: { cartId: data ? data._id.toString() : "", childProductId: request.payload.childProductId, unitId: request.payload.unitId } }).code(201);
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
                        currencySymbol: storeData.currencySymbol ? storeData.currencySymbol : zoneData.currencySymbol, currency: storeData.currency ? storeData.currency : zoneData.currency, userId: request.auth.credentials._id.toString(), customerName: customerData.name, city: zoneData.city, cityId: storeData.cityId, childProductId: request.payload.childProductId, unitId: request.payload.unitId, unitName: request.payload.unitName, parentProductId: "", storeId: storeData._id.toString(), franchiseId: storeData.franchiseId, storeName: storeData.sName[request.headers.language], storeAddress: storeData.storeAddr ? storeData.storeAddr : "", storeLogo: storeData.profileLogos ? storeData.profileLogos.logoImage : "", storePhone: storeData.bcountryCode ? storeData.bcountryCode + storeData.businessNumber : "", sku: "", itemName: request.payload.itemName, upc: "", itemImageURL: '', quantity: request.payload.quantity, unitPrice: request.payload.unitPrice, coordinates: { longitude: parseFloat(storeData.coordinates.longitude || 0.0), latitude: parseFloat(storeData.coordinates.latitude || 0.0) }, createdBy: request.auth.credentials.sub,
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
                            childProducts.pushToCart({ userId: request.auth.credentials._id.toString(), unitId: request.payload.unitId, childProductId: request.payload.childProductId, createdBy: request.auth.credentials.sub }, (err, data) => {
                            });
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
        customerName: '',
        userId: request.payload.customerId
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
module.exports = { handlerNew, handlerCustomCart, handlerClearCart }