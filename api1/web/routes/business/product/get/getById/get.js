'use strict'
const childProducts = require('../../../../../../models/childProducts');
const addOns = require('../../../../../../models/addOns');
const stores = require('../../../../../../models/stores');
const error = require('../../../../../../statusMessages/responseMessage'); // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment'); //date-time
const distance = require('google-distance');
const async = require('async');
const ObjectId = require('mongodb').ObjectID;
const googleDistance = require('../../../../../commonModels/googleApi');
/** 
 * @function
 * @name handler 
 * @return {object} Reply to the user. 
 */
const handler = (request, reply) => {

    // request.headers.language = "en"; // remove in last
    childProducts.getProductDetails({ _id: new ObjectId(request.params.productId), lat: request.params.latitude, long: request.params.longitude }, (err, product) => {
        if (err) {
            logger.error('Error occurred during business products get by id (getProductDetails): ' + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        } else if (product) {
            const readStore = (itemId) => {
                return new Promise((resolve, reject) => {
                    stores.isExist({ id: itemId }, (err, data) => {
                        if (err) {
                            reject(err);
                        }
                        resolve(data);
                    });
                });
            }
            readStore(product.storeId ? product.storeId.toString() : "").then(store => {
                if (store) {

                    product.businessName = store.sName ? store.sName[request.headers.language] : "";
                    product.businessAddress = store.storeAddr ? store.storeAddr : "";
                    product.businessImage = store.profileLogos ? store.profileLogos.logoImage : "";
                    product.bannerImage = store.bannerLogos ? store.bannerLogos.bannerimage : "";
                    product.businessLatitude = store.coordinates.latitude ? store.coordinates.latitude : 0;
                    product.businessLongitude = store.coordinates.longitude ? store.coordinates.longitude : 0;
                    product.businessId = store._id ? store._id.toString() : "";
                    product.businessRating = store.averageRating ? store.averageRating : 0;
                    product.storeType = store.storeType ? parseInt(store.storeType) : 0;
                    product.storeTypeMsg = store.storeTypeMsg ? store.storeTypeMsg : "";
                    store.cartsAllowed = store.cartsAllowed ? parseInt(store.cartsAllowed) : 0;
                    store.cartsAllowedMsg = store.cartsAllowedMsg;
                    store.currencySymbol = store.currencySymbol;
                    delete store._id;
                    delete store.profileLogos;
                    delete store.bannerLogos;
                    delete store.name;
                    delete store.sName;
                    delete store.storeaddress;
                    delete product.addOns;
                    // if (product.addOns || product.addOns != null ) {
                    // if (product.addOns) {
                    //     product.addOnAvailable = 1;
                    //     async.forEach(product.addOns, (addOnData, callBackLoop) => {
                    //         var addOnGroups = [];
                    //         if (addOnData.status = 1) {
                    //             async.forEach(addOnData.addOns, (addOnGroupsData, addOnGroupsCallBack) => {
                    //                 var addOnGroupd = {
                    //                     id: addOnGroupsData.id,
                    //                     name: addOnGroupsData.name[request.headers.language],
                    //                     price: addOnGroupsData.price
                    //                 }
                    //                 addOnGroups.push(addOnGroupd);
                    //             })

                    //             var addOnData = {
                    //                 id: addOnData.id,
                    //                 name: addOnData.name[request.headers.language],
                    //                 multiple: addOnData.multiple,
                    //                 mandatory: addOnData.mandatory,
                    //                 maximumLimit: addOnData.maximumLimit,
                    //                 minimumLimit: addOnData.minimumLimit,
                    //                 addOnLimit: addOnData.addOnLimit,
                    //                 description: addOnData.description[request.headers.language],
                    //                 addOnGroup: addOnGroups
                    //             }
                    //             // product.addOns.push(addOnData);
                    //             productAddOns.push(addOnData);
                    //         }
                    //         return callBackLoop(null);
                    //     })

                    //     // addOns.getAddOnDetailsWithAddOnIds({ _id: {$in:addOnMongoIds, status:1}, }, (addOnErr, productAddOns) => {
                    //     //     if (addOnErr) {
                    //     //     }else if (productAddOns) {
                    //     //         async.forEach(productAddOns, (addOnDetails, addOnCallBack) => {
                    //     //             product.addOns.push(addOnDetails)
                    //     //         })

                    //     //     }else{
                    //     //     }
                    //     // });

                    // } else {
                    //     product.addOns = [];
                    //     product.addOnAvailable = 0;
                    // }

                    let array = [];
                    let keyN = {}
                    // for (const key in product) {
                    //     if (key == 'strainEffects') {
                    //         keyN[key] = product[key]
                    //         array.push({ name: key, data: product[key] });
                    //         delete keyN[key]
                    //     }
                    //     if (key == 'nutritionFactsInfo') {
                    //         for (const keyy in product[key]) {
                    //             keyN[keyy] = product[key][keyy]['en']
                    //         }
                    //         array.push({ name: key, data: keyN })
                    //     }
                    // }
                    for (const key in product) {

                        if (key == 'strainEffects') {
                            keyN[key] = product[key]
                            array.push({ name: 'Strain Effects', data: product[key] });
                            delete keyN[key]
                        }
                        if (key == 'warningName') {
                            keyN[key] = product[key]
                            array.push({ name: 'Warning', data: product[key] });
                            delete keyN[key]
                        }
                        if (key == 'nutritionFactsInfo') {
                            for (const keyy in product[key]) {
                                if (typeof product[key][keyy]['keyName'] == 'undefined' || typeof product[key][keyy]['keyName'] == undefined) {
                                    keyN[keyy] = product[key][keyy]['en'];
                                } else {
                                    keyN[product[key][keyy]['keyName']['en']] = product[key][keyy]['en'];
                                }
                            }
                            array.push({ name: 'Nutrition Facts', data: keyN })
                        }
                        // if (key == 'ingredients') {
                        //     for (const keyy in product[key]) {
                        //         if (typeof product[key][keyy]['keyName'] == 'undefined' || typeof product[key][keyy]['keyName'] == undefined) {
                        //             keyN[keyy] = product[key][keyy]['en'];
                        //         } else {
                        //             keyN[product[key][keyy]['keyName']['en']] = product[key][keyy]['en'];
                        //         }
                        //     }
                        //     array.push({ name: 'Ingredients', data: keyN })
                        // }
                    }

                    product.additionalEffects = array;
                    product.ingredients = product.ingredients ? product.ingredients[request.headers.language] : ""
                    product.productName = product.productname ? product.productname[request.headers.language] : ""
                    product.mobileImage = product.images ? product.images : [];
                    product.wishList = product.wishList ? product.wishList : [];
                    product.productId = product._id;
                    product.subCategoryName = product.subCatName ? product.subCatName[request.headers.language] : "";
                    product.shortDescription = product.sDescription ? product.sDescription[request.headers.language] : "";
                    product.detailedDescription = product.detailDescription ? product.detailDescription[request.headers.language] : "";
                    product.isFavorite = false;
                    product.favorites = product.favorites ? product.favorites : [];
                    // product.addOns = productAddOns;
                    for (let h = 0; h < product.favorites.length; h++) {
                        if (product.favorites[h].userId == request.auth.credentials._id.toString()) {
                            product.isFavorite = true;
                        }
                    }

                    for (let s = 0; s < product.units.length; s++) {
                        var productAddOns = []
                        product.units[s].appliedDiscount = 0;
                        product.units[s].offerId = "";
                        product.units[s].title = product.units[s].name[request.headers.language] ? product.units[s].name[request.headers.language] : "";
                        product.units[s].value = product.units[s].price["en"] ? parseFloat(product.units[s].price["en"]) : 0;
                        product.units[s].finalPrice = product.units[s].value ? parseFloat(product.units[s].value) : 0;
                        product.units[s].availableQuantity = product.units[s].availableQuantity ? parseFloat(product.units[s].availableQuantity) : 0;

                        if (product.units[s].addOns && product.units[s].addOns.length > 0) {
                            product.units[s].addOnAvailable = 1;
                            async.forEach(product.units[s].addOns, (addOnData, callBackLoop) => {
                                var addOnGroups = [];
                                if (addOnData.status = 1) {
                                    async.forEach(addOnData.addOns, (addOnGroupsData, addOnGroupsCallBack) => {
                                        var addOnGroupd = {
                                            addOnid: addOnData.unitAddOnId,
                                            id: addOnGroupsData.id,
                                            name: addOnGroupsData.name[request.headers.language],
                                            price: addOnGroupsData.price
                                        }
                                        addOnGroups.push(addOnGroupd);
                                    })

                                    var addOnData = {
                                        id: addOnData.unitAddOnId,
                                        name: addOnData.name[request.headers.language],
                                        multiple: addOnData.multiple,
                                        mandatory: addOnData.mandatory,
                                        maximumLimit: addOnData.maximumLimit,
                                        minimumLimit: addOnData.minimumLimit,
                                        addOnLimit: addOnData.addOnLimit,
                                        description: addOnData.description[request.headers.language],
                                        addOnGroup: addOnGroups
                                    }
                                    // product.addOns.push(addOnData);
                                    productAddOns.push(addOnData);
                                }
                                return callBackLoop(null);
                            })

                        } else {
                            product.units[s].addOns = [];
                            product.units[s].addOnAvailable = 0;
                        }
                        delete product.units[s].addOns;

                        product.units[s].addOns = productAddOns;
                        delete product.units[s].name;
                        delete product.units[s].price;
                        delete product.units[s].sizeAttributes;
                        delete product.units[s].subCatName;
                        delete product.units[s].subSubCatName;
                    }


                    if (product.offer && product.offer.length > 0) { // offers
                        for (let k = 0; k < product.offer.length; k++) {
                            if (product.offer[k].status == 1 && product.offer[k].endDateTime > moment().unix() && moment().unix() > product.offer[k].startDateTime) { //check status and expiry.
                                // if (product.offer[k].status == 1) { //check status and expiry
                                product.prefUnits = [];
                                // logger.error(moment().unix());

                                for (let l = 0; l < product.units.length; l++) {
                                    let logic = 0;
                                    if (product.offer[k].discountType == 0) { // flat price
                                        logic = parseFloat(product.offer[k].discountValue)
                                    } else {
                                        logic = (product.units[l].value / 100) * parseFloat(product.offer[k].discountValue)
                                    }
                                    if (product.offer[k].applicableOn == 1) { // if product
                                        for (let m = 0; m < product.offer[k].unitid.length; m++) {
                                            if (product.units[l].unitId == product.offer[k].unitid[m]) {
                                                product.prefUnits.push({
                                                    title: product.units[s].title,
                                                    status: product.units[l].status,
                                                    value: product.units[l].value,
                                                    addOns: product.units[l].addOns,
                                                    addOnAvailable: product.units[l].addOnAvailable,
                                                    unitId: product.units[l].unitId,
                                                    availableQuantity: product.units[l].availableQuantity,
                                                    appliedDiscount: logic,
                                                    offerId: product.offer[k].offerId ? product.offer[k].offerId : "",
                                                    finalPrice: (logic > product.units[l].value) ? 0 : product.units[l].value - (logic)

                                                })
                                            } else {
                                                product.prefUnits.push({
                                                    title: product.units[s].title,
                                                    status: product.units[l].status,
                                                    value: product.units[l].value,
                                                    addOns: product.units[l].addOns,
                                                    addOnAvailable: product.units[l].addOnAvailable,
                                                    unitId: product.units[l].unitId,
                                                    availableQuantity: product.units[l].availableQuantity,
                                                    appliedDiscount: 0,
                                                    offerId: "",
                                                    finalPrice: product.units[l].value - 0
                                                })
                                            }
                                        }
                                    } else {
                                        product.prefUnits.push({
                                            title: product.units[l].title,
                                            status: product.units[l].status,
                                            value: product.units[l].value,
                                            addOns: product.units[l].addOns,
                                            addOnAvailable: product.units[l].addOnAvailable,
                                            unitId: product.units[l].unitId,
                                            availableQuantity: product.units[l].availableQuantity,
                                            appliedDiscount: logic,
                                            offerId: product.offer[k].offerId ? product.offer[k].offerId : "",
                                            finalPrice: (logic > product.units[l].value) ? 0 : product.units[l].value - (logic) // finalPrice: product.units[l].value - logic
                                        })
                                    }
                                }
                            }
                        }
                    }
                    if (product.prefUnits && product.prefUnits.length > 0) {
                        product.units = product.prefUnits;
                    }

                    delete product.offer;
                    delete product.prefUnits;
                    delete product._id;
                    delete product.images;
                    delete product.productname;
                    delete product.secondCategoryName;
                    delete product.favorites;
                    delete product.sDescription;
                    delete product.upcName;
                    delete product.detailDescription;
                    childProducts.patchViews({ userId: request.auth.credentials._id.toString(), childProductId: new ObjectId(request.params.productId), createdBy: request.auth.credentials.sub }, (err, data) => { });

                    product.distanceMiles = 0.0;
                    product.distanceKm = 0.0;
                    product.estimatedTime = '';
                    let origin = store.coordinates.latitude + ',' + store.coordinates.longitude;
                    let dest = request.params.latitude + ',' + request.params.longitude;

                    googleDistance.calculateDistance(origin, dest).then(distanceMeasured => {
                        if (err) logger.error('Error occurred during fare calculate get distance in product details Api: ' + JSON.stringify(err));
                        let distanceMiles = 0.0;
                        let distanceKm = 0.0;
                        let estimatedTime = 0.0;
                        if (distanceMeasured) {
                            let result = distanceMeasured.distance;
                            result *= 0.000621371192;
                            product.distanceMiles = result;
                            product.distanceKm = distanceMeasured.distance / 1000;
                            product.estimatedTime = distanceMeasured.durationMins;
                        }
                        // return reply({ message: error['stores']['200'][request.headers.language], data: product }).code(200);
                        return reply({ message: request.i18n.__('stores')['200'], data: product }).code(200);
                    }).catch((err) => {
                        logger.error("pass 444444444 ------")
                        logger.error('Error occurred during  get product details(calculateDistance): ' + JSON.stringify(err));
                        // return reply({ message: error['stores']['200'][request.headers.language], data: product }).code(200);
                        return reply({ message: request.i18n.__('stores')['200'], data: product }).code(200);
                    });
                } else {
                    logger.error("pass 3333333 ------")
                    // return reply({
                    //     message: error['stores']['404'][request.distanceMiles.language]
                    // }).code(404);
                    return reply({ message: request.i18n.__('stores')['404'] }).code(404);
                }
            }).catch(e => {
                logger.error("pass 2222222------------------")
                logger.error('err during get distance in product details Api (catch) ' + JSON.stringify(e));
                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            });

        } else {
            logger.error("pass 111111 ------")
            // return reply({ message: error['stores']['404'][request.headers.language] }).code(404);
            return reply({ message: request.i18n.__('stores')['404'] }).code(404);
        }
    });
}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    productId: Joi.string().required().description('Product Id').default("5b7c00b7f8016807815556d2"),
    latitude: Joi.number().required().description('Latitude').default("13.0286"),
    longitude: Joi.number().required().description('Longitude').default("77.5895")
}
/**
 * A module that exports customer get categories handler, validator!
 * @exports validator
 * @exports handler 
 */
module.exports = { handler, validator }