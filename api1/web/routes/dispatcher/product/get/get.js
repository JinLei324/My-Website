'use strict'
const stores = require('../../../../../models/stores');
const cart = require('../../../../../models/cart');
const childProducts = require('../../../../../models/childProducts');
const thirdCategory = require('../../../../../models/thirdCategory');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');//date-time
const distance = require('google-distance');
const async = require('async');
const googleDistance = require('../../../../commonModels/googleApi');
const ObjectId = require('mongodb').ObjectID;
/** 
* @function
* @name handler 
* @return {object} Reply to the user. 
*/
const handler = (request, reply) => {
    // request.headers.language = "en"; // remove in last
    let condition = {};
    condition.storeId = new ObjectId(request.params.storeId);
    if (request.params.productName != "0") {
        // var regexValue = '.*' + request.params.productName + '.*';
        // condition.productName = { $regex: regexValue, $options: "i" }
        condition.productName = new RegExp("^" + request.params.productName, "gi");

    }
    if (request.params.categoryId != 0) {
        condition.firstCategoryId = request.params.categoryId;
    }
    if (request.params.subCategoryId != 0) {
        condition.secondCategoryId = request.params.subCategoryId;
    }
    if (request.params.subSubCategoryId != 0) {
        condition.thirdCategoryId = request.params.subSubCategoryId;
    }
    let limit = 10;
    condition.limit = limit
    condition.skip = limit * request.params.pageIndex;
    condition.language = request.headers.language;

    const readCartProducts = () => {
        return new Promise((resolve, reject) => {
            cart.get({ userId: request.params.customerId }, (err, cartProducts) => {
                if (err) {
                    logger.error('Error occurred place order (get): ' + JSON.stringify(err));
                }
                resolve(cartProducts);
            });
        });
    };
    readCartProducts()
        .then(products => {
            childProducts.getProductsSubCatwise(condition, (err, product) => {
                if (err) {
                    logger.error('Error occurred during business products get (getProductsSubCatwise): ' + JSON.stringify(err));
                    // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                for (var j = 0; j < product.length; j++) {


                    // if (product[j].addOns) {
                    //     if (product[j].addOns.length > 0) {
                    //         product[j].addOnAvailable = 1;
                    //     } else {
                    //         product[j].addOnAvailable = 0;
                    //     }
                    // } else {
                    //     product[j].addOnAvailable = 0;
                    // }
                    product[j].inCart = false;
                    product[j].cartId = '';
                    product[j].currencySymbol = product[j].currencySymbol ? product[j].currencySymbol : "";

                    for (var o = 0; o < products.length; o++) {
                        product[j].cartId = products[o].cartId ? products[o].cartId : "";
                        if (String(products[o].childProductId) == String(product[j]._id)) {
                            product[j].inCart = true;
                            product[j].currencySymbol = products[o].currencySymbol ? products[o].currencySymbol : "";
                        }
                    }
                    product[j].productName = product[j].productname ? product[j].productname[request.headers.language] : "";
                    product[j].childProductId = product[j]._id;
                    product[j].parentProductId = product[j].parentProductId ? product[j].parentProductId : "";

                    for (let s = 0; s < product[j].units.length; s++) {
                        var productAddOns = []
                        product[j].units[s].appliedDiscount = 0;
                        product[j].units[s].offerId = "";
                        product[j].units[s].title = product[j].units[s].name[request.headers.language] ? product[j].units[s].name[request.headers.language] : "";

                        product[j].units[s].value = product[j].units[s].price["en"] ? parseFloat(product[j].units[s].price["en"]) : 0;
                        product[j].units[s].finalPrice = product[j].units[s].value ? parseFloat(product[j].units[s].value) : 0;

                        if (product[j].units[s].addOns && product[j].units[s].addOns.length > 0) {
                            product[j].units[s].addOnAvailable = 1;
                            async.forEach(product[j].units[s].addOns, (addOnData, callBackLoop) => {
                                var addOnGroups = [];
                                if (addOnData.status = 1) {
                                    async.forEach(addOnData.addOns, (addOnGroupsData, addOnGroupsCallBack) => {
                                        var addOnGroupd = {
                                            addOnid: addOnData.unitAddOnId,
                                            id: addOnGroupsData.id,
                                            name: addOnGroupsData.name[request.headers.language],
                                            price: addOnGroupsData.price,
                                            checked: false
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
                            product[j].units[s].addOns = [];
                            product[j].units[s].addOnAvailable = 0;
                        }
                        product[j].units[s].addOns = productAddOns;
                        delete product[j].units[s].name;
                        delete product[j].units[s].price;
                        delete product[j].units[s].sizeAttributes;
                    }
                    if (product[j].offer && product[j].offer.length > 0) { // offers

                        for (let k = 0; k < product[j].offer.length; k++) {
                            if (product[j].offer[k].status == 1 && product[j].offer[k].endDateTime > moment().unix() && moment().unix() > product[j].offer[k].startDateTime) { //check status and expiry.
                                // if (product.offer[k].status == 1) { //check status and expiry
                                product[j].prefUnits = [];
                                logger.error(moment().unix());

                                for (let l = 0; l < product[j].units.length; l++) {
                                    let logic = 0;
                                    if (product[j].offer[k].discountType == 0) {// flat price
                                        logic = parseFloat(product[j].offer[k].discountValue)
                                    } else {
                                        logic = (product[j].units[l].value / 100) * parseFloat(product[j].offer[k].discountValue)
                                    }
                                    if (product[j].offer[k].applicableOn == 1) { // if product
                                        for (let m = 0; m < product[j].offer[k].unitid.length; m++) {
                                            if (product[j].units[l].unitId == product[j].offer[k].unitid[m]) {
                                                product[j].prefUnits.push({
                                                    title: product[j].units[s].title, status: product[j].units[l].status, value: product[j].units[l].value, unitId: product[j].units[l].unitId, appliedDiscount: logic,
                                                    offerId: product[j].offer[k].offerId ? product[j].offer[k].offerId : "",
                                                    finalPrice: product[j].units[l].value - (logic),
                                                    addOns: product[j].units[l].addOns,
                                                    addOnAvailable: product[j].units[l].addOnAvailable,
                                                })
                                            } else {
                                                product[j].prefUnits.push({
                                                    title: product[j].units[s].title,
                                                    status: product[j].units[l].status, value: product[j].units[l].value, unitId: product[j].units[l].unitId, appliedDiscount: 0,
                                                    offerId: "",
                                                    finalPrice: product[j].units[l].value - 0,
                                                    addOns: product[j].units[l].addOns,
                                                    addOnAvailable: product[j].units[l].addOnAvailable,
                                                })
                                            }
                                        }
                                    } else {
                                        product[j].prefUnits.push({
                                            title: product[j].units[l].title,
                                            status: product[j].units[l].status,
                                            value: product[j].units[l].value,
                                            unitId: product[j].units[l].unitId, appliedDiscount: logic,
                                            offerId: product[j].offer[k].offerId ? product[j].offer[k].offerId : "",
                                            finalPrice: product[j].units[l].value - logic,
                                            addOns: product[j].units[l].addOns,
                                            addOnAvailable: product[j].units[l].addOnAvailable,
                                        })
                                    }
                                }
                            }
                        }
                    }
                    if (product[j].prefUnits && product[j].prefUnits.length > 0) {
                        product[j].units = product[j].prefUnits;
                    }
                    for (let s = 0; s < product[j].units.length; s++) {
                        product[j].units[s].inCart = false;
                        product[j].units[s].quantity = 1;
                        for (var o = 0; o < products.length; o++) {
                            if (String(products[o].unitId) == String(product[j].units[s].unitId)) {
                                product[j].units[s].inCart = true;
                                product[j].units[s].quantity = products[o].quantity;
                            }
                        }
                    }
                    product[j].mobileImage = product[j].images ? product[j].images : [];
                    delete product[j]._id;
                    delete product[j].images;
                    delete product[j].offer;
                    delete product[j].productname;
                    delete product[j].addOns;
                }
                return reply({ message: request.i18n.__('stores')['200'], data: product }).code(200);
            });
        }).catch(e => {
            logger.error('Error occurred place order (catch): ' + JSON.stringify(e));
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        });











}



/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    customerId: Joi.string().min(24).max(24).required().description('customerId 5ac3621be360ea4c1e3afc31'),
    storeId: Joi.string().min(24).max(24).required().description('store Id - if 0 pick nearest store else storeId 5ac3621be360ea4c1e3afc31'),
    categoryId: Joi.string().required().description('Category Id').default("5ac36553e0dc3f58464ddffc"),
    subCategoryId: Joi.string().required().description('sub Category Id').default("59d34bf6e0dc3f256f5848ab"),
    subSubCategoryId: Joi.string().required().description('subCategoryId 5ac357cbe0dc3f58464ddff8'),
    pageIndex: Joi.number().required().description('0'),
    productName: Joi.string().required().description('productName')
}
/**
* A module that exports customer get categories handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }