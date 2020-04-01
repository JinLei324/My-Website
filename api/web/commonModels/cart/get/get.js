"use strict";
const cart = require("../../../../models/cart");
const zones = require("../../../../models/zones");
const addOnsModel = require("../../../../models/addOns");
const error = require("../../../../statusMessages/responseMessage"); // response messages based on language
const config = process.env;
const Joi = require("joi");
const stores = require("../../../../models/stores");
const childProducts = require("../../../../models/childProducts");
const logger = require("winston");
const async = require("async");
const distance = require("google-distance");
const googleDistance = require("../../../commonModels/googleApi");
const ObjectID = require("mongodb").ObjectID;
const moment = require("moment");
/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {


    let createdBy = "";
    switch (request.auth.credentials.sub) {
        case "customer":
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.auth.credentials._id;
            break;
        case "manager":
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.params.customerId;
            break;
        case "guest":
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.auth.credentials._id;
            break;
        case "dispatcher":
            createdBy = request.auth.credentials.sub;
            request.auth.credentials._id = request.params.customerId;
            break;
        default:
            return reply({
                message: request.i18n.__("genericErrMsg")["500"]
            }).code(500);
    }

    cart.getAll({
        userId: request.auth.credentials._id
    },
        (err, data) => {
            if (err) {
                logger.error("Error occurred while getting cart : " + err);
                return reply({
                    message: request.i18n.__("genericErrMsg")["500"]
                }).code(500);
            } else if (data.length > 0) {
                let totalPrice = 0;
                let cartId = "";
                let responseArray = [];
                let laundryCartExists = false;
                let incTax = {};
                let excTax = {};
                let inclTax = 0;
                let exclTax = 0;
                let cartTotal = 0;
                let cartDiscount = 0;
                async.eachSeries(
                    data,
                    (item, callback) => {
                        if (item.storeType == 5) {
                            laundryCartExists = true;
                            cartId = item.cartId;
                        }
                        let exclTaxStore = 0;
                        let excTaxStore = {};
                        if (data[0].orderType == 1) {
                            // general  order
                            readStore(item.storeId)
                                .then(store => {
                                    if (store) {
                                        let sUnitPrice = 0;
                                        let sTotalPrice = 0;
                                        item.streetName = store.streetName ? store.streetName : "";
                                        item.localityName = store.localityName ? store.localityName : "";
                                        item.areaName = store.areaName ? store.areaName : "";
                                        item.storeIsOpen = store.storeIsOpen || false;
                                        item.serviceAccepted = store.orderType ? parseInt(store.orderType) : 3;
                                        item.pickupCash = parseInt(store.pickupCash);
                                        item.pickupCard = parseInt(store.pickupCard);
                                        item.deliveryCard = parseInt(store.deliveryCard);
                                        item.deliveryCash = parseInt(store.deliveryCash);
                                        item.productsNew = [];
                                        async.eachSeries(
                                            item.products,
                                            (subItem, callbackSub) => {
                                                readProduct(
                                                    subItem.childProductId.toString(),
                                                    subItem.unitId.toString(),
                                                    subItem.quantity,
                                                    data[0]["storeType"]
                                                )
                                                    .then(productData => {
                                                        // for (let k = 0; k < item.products.length; k++) {

                                                        if (productData) {

                                                            subItem.status = productData.status;
                                                            subItem.itemName = productData.productname
                                                                ? productData.productname[request.headers.language]
                                                                : "";
                                                            subItem.itemImageURL =
                                                                productData.images && productData.images.length > 0
                                                                    ? productData.images[0]["image"]
                                                                    : "";
                                                            subItem.taxes = productData.taxes ? productData.taxes : [];
                                                            subItem.packId = subItem.addedToCartOn ? subItem.addedToCartOn.toString() : 0;
                                                            subItem.addOnsPrice = 0;

                                                            for (let s = 0; s < productData.units.length; s++) {
                                                                productData.units[s].appliedDiscount = 0;
                                                                productData.units[s].offerId = "";
                                                                productData.units[s].title = productData.units[s].name[request.headers.language]
                                                                    ? productData.units[s].name[request.headers.language]
                                                                    : "";
                                                                productData.units[s].value = productData.units[s].price["en"]
                                                                    ? parseFloat(productData.units[s].price["en"])
                                                                    : 0;
                                                                productData.units[s].finalPrice = productData.units[s].value
                                                                    ? parseFloat(productData.units[s].value)
                                                                    : 0;

                                                                if (productData.units[s].addOns && productData.units[s].addOns.length > 0) {


                                                                    /*
                                                                                      Get the add on details from add ons collection and set it
                                                                                  */
                                                                    let allAddOns = productData.units[s].addOns || [];
                                                                    let addOnData = [];

                                                                    let cartItems = subItem.addOns || [];
                                                                    let allProductAddOns = [];
                                                                    let cartAddOns = [];
                                                                    if (productData.units[s].unitId == subItem.unitId) {
                                                                        subItem.allAddOnsData = productData.units[s].addOns || [];
                                                                        subItem.addOnAvailable = 1;
                                                                        for (let l = 0; l < allAddOns.length; l++) {
                                                                            for (let m = 0; m < allAddOns[l].addOns.length; m++) {
                                                                                allProductAddOns.push(allAddOns[l].addOns[m]);
                                                                            }
                                                                        }
                                                                        for (let n = 0; n < cartItems.length; n++) {
                                                                            for (let o = 0; o < cartItems[n].addOnGroup.length; o++) {
                                                                                cartAddOns.push(cartItems[n].addOnGroup[o]);
                                                                            }
                                                                        }
                                                                        async.each(cartAddOns, (cartAddOnsData, callbackSub2) => {
                                                                            async.each(allProductAddOns, (allProductAddOn, callbackSub2) => {
                                                                                if (allProductAddOn.id == cartAddOnsData) {
                                                                                    addOnData.push({
                                                                                        name: allProductAddOn.name[request.headers.language],
                                                                                        price: allProductAddOn.price,
                                                                                        id: allProductAddOn.id
                                                                                    });
                                                                                }
                                                                            });
                                                                        });

                                                                        if (addOnData.length > 0) {
                                                                            for (var a = 0; a < addOnData.length; a++) {
                                                                                subItem.addOnsPrice += parseFloat(addOnData[a].price) * subItem.quantity;
                                                                            }
                                                                        }
                                                                        var productAddOns = [];
                                                                        async.forEach(productData.units[s].addOns, (addOnData, callBackLoop) => {
                                                                            var addOnGroups = [];

                                                                            if ((addOnData.status = 1)) {
                                                                                async.forEach(addOnData.addOns, (addOnGroupsData, addOnGroupsCallBack) => {
                                                                                    var addOnGroupd = {
                                                                                        addOnid: addOnData.unitAddOnId,
                                                                                        id: addOnGroupsData.id,
                                                                                        name: addOnGroupsData.name[request.headers.language],
                                                                                        price: addOnGroupsData.price
                                                                                    };
                                                                                    addOnGroups.push(addOnGroupd);
                                                                                });

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
                                                                                };
                                                                                // product.addOns.push(addOnData);
                                                                                productAddOns.push(addOnData);
                                                                            }
                                                                            return callBackLoop(null);
                                                                        });
                                                                        subItem.allAddOnsData = productAddOns;

                                                                        subItem.selectedAddOns = addOnData;
                                                                    }
                                                                } else {
                                                                    subItem.addOnAvailable = 0;
                                                                }

                                                                delete productData.units[s].name;
                                                                delete productData.units[s].price;
                                                                delete productData.units[s].sizeAttributes;
                                                            }
                                                            if (productData.offer && productData.offer.length > 0) {
                                                                // offers
                                                                for (let k = 0; k < productData.offer.length; k++) {
                                                                    if (
                                                                        productData.offer[k].status == 1 &&
                                                                        productData.offer[k].endDateTime > moment().unix() &&
                                                                        moment().unix() > productData.offer[k].startDateTime
                                                                    ) {
                                                                        //check status and expiry.
                                                                        // if (productData.offer[k].status == 1) { //check status and expiry
                                                                        productData.prefUnits = [];

                                                                        for (let l = 0; l < productData.units.length; l++) {
                                                                            let logic = 0;
                                                                            if (productData.offer[k].discountType == 0) {
                                                                                // flat price
                                                                                logic = parseFloat(productData.offer[k].discountValue);
                                                                            } else {
                                                                                logic =
                                                                                    (productData.units[l].value / 100) *
                                                                                    parseFloat(productData.offer[k].discountValue);
                                                                            }
                                                                            if (productData.offer[k].applicableOn == 1) {
                                                                                // if productData
                                                                                for (let m = 0; m < productData.offer[k].unitid.length; m++) {
                                                                                    if (productData.units[l].unitId == productData.offer[k].unitid[m]) {
                                                                                        productData.prefUnits.push({
                                                                                            title: productData.units[l].title,
                                                                                            status: productData.units[l].status,
                                                                                            value: productData.units[l].value,
                                                                                            availableQuantity: productData.units[l].availableQuantity,
                                                                                            unitId: productData.units[l].unitId,
                                                                                            appliedDiscount: logic,
                                                                                            offerId: productData.offer[k].offerId ? productData.offer[k].offerId : "",
                                                                                            finalPrice: productData.units[l].value - logic
                                                                                        });
                                                                                    } else {
                                                                                        productData.prefUnits.push({
                                                                                            title: productData.units[l].title,
                                                                                            status: productData.units[l].status,
                                                                                            value: productData.units[l].value,
                                                                                            availableQuantity: productData.units[l].availableQuantity,
                                                                                            unitId: productData.units[l].unitId,
                                                                                            appliedDiscount: 0,
                                                                                            offerId: "",
                                                                                            finalPrice: productData.units[l].value - 0
                                                                                        });
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                productData.prefUnits.push({
                                                                                    title: productData.units[l].title,
                                                                                    status: productData.units[l].status,
                                                                                    value: productData.units[l].value,
                                                                                    availableQuantity: productData.units[l].availableQuantity || 1,
                                                                                    unitId: productData.units[l].unitId,
                                                                                    appliedDiscount: logic,
                                                                                    offerId: productData.offer[k].offerId ? productData.offer[k].offerId : "",
                                                                                    finalPrice: productData.units[l].value - logic
                                                                                });
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            if (productData.prefUnits && productData.prefUnits.length > 0) {
                                                                productData.units = productData.prefUnits;
                                                            }

                                                            for (let i = 0; i < productData.units.length; i++) {
                                                                if (String(productData.units[i].unitId) == String(subItem.unitId)) {
                                                                    if (data[0]["storeType"] == 2) {
                                                                        if (productData.units[i].availableQuantity >= subItem.quantity) {
                                                                            subItem.unitId = productData.units[i].unitId;
                                                                            subItem.unitName = productData.units[i].title;
                                                                            subItem.offerId = productData.units[i].offerId;
                                                                            subItem.unitPrice = productData.units[i].value;
                                                                            subItem.appliedDiscount = productData.units[i].appliedDiscount
                                                                                ? productData.units[i].appliedDiscount
                                                                                : 0;
                                                                            subItem.finalPrice =
                                                                                subItem.appliedDiscount > subItem.unitPrice ? 0 : productData.units[i].finalPrice;
                                                                            subItem.outOfStock = false;
                                                                            subItem.availableQuantity = productData.units[i].availableQuantity;
                                                                        } else {
                                                                            subItem.unitId = productData.units[i].unitId;
                                                                            subItem.unitName = productData.units[i].title;
                                                                            subItem.offerId = productData.units[i].offerId;
                                                                            subItem.unitPrice = productData.units[i].value;
                                                                            subItem.appliedDiscount = productData.units[i].appliedDiscount
                                                                                ? productData.units[i].appliedDiscount
                                                                                : 0;
                                                                            subItem.finalPrice =
                                                                                subItem.appliedDiscount > subItem.unitPrice ? 0 : productData.units[i].finalPrice;
                                                                            subItem.status = 6; // outofstock
                                                                            subItem.outOfStock = true;
                                                                            subItem.availableQuantity = 0;
                                                                        }
                                                                    } else {
                                                                        subItem.unitId = productData.units[i].unitId;
                                                                        subItem.unitName = productData.units[i].title;
                                                                        subItem.offerId = productData.units[i].offerId;
                                                                        subItem.unitPrice = productData.units[i].value;
                                                                        subItem.appliedDiscount = productData.units[i].appliedDiscount
                                                                            ? productData.units[i].appliedDiscount
                                                                            : 0;
                                                                        subItem.finalPrice =
                                                                            subItem.appliedDiscount > subItem.unitPrice ? 0 : productData.units[i].finalPrice;
                                                                        subItem.outOfStock = false;
                                                                        subItem.availableQuantity = productData.units[i].availableQuantity;

                                                                    }

                                                                    // product[j].finalPrice = (product[j].appliedDiscount > product[j].priceValue) ? 0 : product[j].priceValue - product[j].appliedDiscount;
                                                                }
                                                            }
                                                            sUnitPrice += subItem.unitPrice * subItem.quantity + subItem.addOnsPrice;
                                                            sTotalPrice += subItem.finalPrice * subItem.quantity + subItem.addOnsPrice;
                                                            ///////////////Taxes///////////////////////////////
                                                            for (let l = 0; l < subItem.taxes.length; l++) {
                                                                if (subItem.taxes[l].taxFlag == 0) {
                                                                    // inclusive
                                                                    if (typeof incTax[subItem.taxes[l].taxCode.toString()] == "undefined") {
                                                                        incTax[subItem.taxes[l].taxCode.toString()] = {
                                                                            taxId: subItem.taxes[l].taxId,
                                                                            taxtName: subItem.taxes[l].taxname["en"],
                                                                            taxFlagMsg: subItem.taxes[l].taxFlagMsg,
                                                                            taxValue: subItem.taxes[l].taxValue,
                                                                            taxCode: subItem.taxes[l].taxCode,
                                                                            price: ((subItem.unitPrice * subItem.taxes[l].taxValue) / 100) * subItem.quantity

                                                                            //  ((request.payload.unitPrice * taxes[i].taxValue) / 100)
                                                                        };
                                                                    } else {
                                                                        incTax[subItem.taxes[l].taxCode.toString()]["price"] +=
                                                                            (subItem.unitPrice * subItem.taxes[l].taxValue) / 100;
                                                                    }
                                                                    inclTax += (subItem.unitPrice * subItem.taxes[l].taxValue) / 100;
                                                                    item.inclTax = inclTax;
                                                                }

                                                                if (subItem.taxes[l].taxFlag == 1) {
                                                                    if (typeof excTax[subItem.taxes[l].taxCode] == "undefined") {
                                                                        excTax[subItem.taxes[l].taxCode] = {
                                                                            taxId: subItem.taxes[l].taxId,
                                                                            taxtName: subItem.taxes[l].taxname["en"],
                                                                            taxFlagMsg: subItem.taxes[l].taxFlagMsg,
                                                                            taxValue: subItem.taxes[l].taxValue,
                                                                            taxCode: subItem.taxes[l].taxCode,
                                                                            price: ((subItem.unitPrice * subItem.taxes[l].taxValue) / 100) * subItem.quantity
                                                                        };
                                                                    } else {
                                                                        excTax[subItem.taxes[l].taxCode]["price"] +=
                                                                            (subItem.unitPrice * subItem.taxes[l].taxValue) / 100;
                                                                    }

                                                                    /////////////////////////////////////////
                                                                    if (typeof excTaxStore[subItem.taxes[l].taxCode] == "undefined") {
                                                                        excTaxStore[subItem.taxes[l].taxCode] = {
                                                                            taxId: subItem.taxes[l].taxId,
                                                                            taxtName: subItem.taxes[l].taxname["en"],
                                                                            taxFlagMsg: subItem.taxes[l].taxFlagMsg,
                                                                            taxValue: subItem.taxes[l].taxValue,
                                                                            taxCode: subItem.taxes[l].taxCode,
                                                                            price: ((subItem.unitPrice * subItem.taxes[l].taxValue) / 100) * subItem.quantity
                                                                        };
                                                                    } else {
                                                                        excTaxStore[subItem.taxes[l].taxCode]["price"] +=
                                                                            (subItem.unitPrice * subItem.taxes[l].taxValue) / 100;
                                                                    }
                                                                    ///////////////////////////////////////////
                                                                    let storeExcTaxArr = [];
                                                                    for (const key in excTaxStore) {
                                                                        storeExcTaxArr.push(excTaxStore[key]);
                                                                    }
                                                                    item.exclusiveTaxes = storeExcTaxArr;
                                                                    exclTaxStore +=
                                                                        ((subItem.unitPrice * subItem.taxes[l].taxValue) / 100) * subItem.quantity;
                                                                    exclTax += ((subItem.unitPrice * subItem.taxes[l].taxValue) / 100) * subItem.quantity;
                                                                    item.exclTaxStore = parseFloat(exclTaxStore);
                                                                }
                                                            }
                                                            item.productsNew.push(subItem);
                                                            callbackSub();
                                                        } else {
                                                            logger.error("products clearing from cart beacuse of not found(deleted)");
                                                            // clearProduct({
                                                            //     userId: request.auth.credentials._id,
                                                            //     cartId: data[0].cartId.toString(),
                                                            //     childProductId: subItem.childProductId.toString(),
                                                            //     unitId: subItem.unitId.toString(),
                                                            //     createdBy: createdBy
                                                            // });
                                                            logger.warn("product not exists");
                                                            subItem.status = 6; // outofstock
                                                            subItem.outOfStock = true;
                                                            subItem.availableQuantity = 0;
                                                            item.productsNew.push(subItem);
                                                            callbackSub();
                                                        }

                                                        // }
                                                    })
                                                    .catch(e => {
                                                        logger.error("err during get cart111(catch) " + e);
                                                        return callbackSub("err");
                                                        // return reply({
                                                        //     message: request.i18n.__('genericErrMsg')['500']
                                                        // }).code(500);
                                                    });
                                            },
                                            function (err) {
                                                if (err) {
                                                    callback("err");
                                                } else {
                                                    /** Assigned new products to products array */
                                                    item.products = item.productsNew.length > 0 ? item.productsNew : item.products;
                                                    delete item.productsNew;
                                                    let deliveryPrice = 0;
                                                    item.storeDeliveryFee = deliveryPrice;
                                                    item.storeUnitPrice = sUnitPrice;

                                                    item.storeTotalPrice = sTotalPrice;
                                                    item.storeTotalPriceWithExcTaxes =
                                                        parseFloat(item.exclTaxStore) + parseFloat(item.storeTotalPrice);
                                                    item.minimumOrderSatisfied = false;

                                                    item.minimumOrder = store.minimumOrder;
                                                    item.storeType = store.storeType;
                                                    item.freeDeliveryAbove = store.freeDeliveryAbove;
                                                    item.cartDiscount = parseFloat(
                                                        (parseFloat(item.storeUnitPrice) - parseFloat(item.storeTotalPrice)).toFixed(2)
                                                    );
                                                    item.cartTotal = parseFloat(parseFloat(item.storeUnitPrice).toFixed(2));
                                                    cartTotal += item.cartTotal;

                                                    cartDiscount += parseFloat(parseFloat(item.cartDiscount).toFixed(2));

                                                    if (parseFloat(item.storeTotalPrice) > parseFloat(store.minimumOrder)) {
                                                        item.minimumOrderSatisfied = true;
                                                    }

                                                    responseArray.push(item);
                                                    callback();
                                                }
                                            }
                                        );
                                    } else {
                                        logger.error("came: no store found");
                                        callback();
                                    }
                                })
                                .catch(e => {
                                    logger.error("err during get cart222(catch) " + JSON.stringify(e));
                                    return callback("err");
                                });
                        } else {
                            // if(data[0].storeType == 7){
                            for (let k = 0; k < item.products.length; k++) {
                                item.products[k].packId = item.products[k].addedToCartOn ? item.products[k].addedToCartOn.toString() : 0
                            }
                            item.minimumOrder = 0;
                            item.streetName = "";
                            item.estimates = "";
                            item.storeLatitude = 0;
                            item.storeLongitude = 0;
                            item.cartsAllowed = 1;
                            item.localityName = "";
                            item.areaName = "";
                            item.freeDeliveryAbove = "";
                            item.cartDiscount = 0;
                            item.cartTotal = 0;
                            item.serviceAccepted = 3;
                            item.pickupCash = 1;
                            item.pickupCard = 1;
                            item.deliveryCard = 1;
                            item.deliveryCash = 1;

                            cartTotal += 0;
                            cartDiscount += 0;
                            responseArray.push(item);
                            callback();
                            // }else{

                            // }
                        }
                    },
                    function (err) {
                        if (err) {
                            return reply({
                                message: request.i18n.__("genericErrMsg")["500"]
                            }).code(500);
                        }
                        for (let j = 0; j < responseArray.length; j++) {
                            totalPrice += responseArray[j].storeTotalPrice;
                            cartId = responseArray[j].cartId ? responseArray[j].cartId : cartId;
                            responseArray[j].storeDeliveryFee = 0;
                        }
                        let incTaxArr = [];
                        let excTaxArr = [];
                        for (const key in incTax) {
                            incTaxArr.push(incTax[key]);
                        }
                        for (const key in excTax) {
                            excTaxArr.push(excTax[key]);
                        }
                        return reply({
                            message: request.i18n.__("cart")["200"],
                            data: {
                                incNetPrice: parseFloat(totalPrice) - parseFloat(inclTax),
                                totalPrice: parseFloat(totalPrice),
                                inclTax: parseFloat(inclTax),
                                incGrossTotalPrice: parseFloat(totalPrice),
                                exclTax: parseFloat(exclTax),
                                finalTotalIncludingTaxes: parseFloat(totalPrice) + parseFloat(exclTax),
                                cartId: cartId,
                                laundryCartExists: laundryCartExists,
                                cart: responseArray,
                                inclusiveTaxes: incTaxArr,
                                exclusiveTaxes: excTaxArr,
                                cartTotal: parseFloat(parseFloat(cartTotal).toFixed(2)),
                                cartDiscount: parseFloat(parseFloat(cartDiscount).toFixed(2))
                            }
                        }).code(200);
                    }
                );
            } else
                return reply({
                    message: request.i18n.__("cart")["404"]
                }).code(404);
        }
    );
};

function clearProduct(data) {
    cart.removeCartDetail(data, (err, data) => { });
}

// function productss() {

//     childProducts.getProductsSubCatwise({}, (err, allProducts) => {
//         let i =0;
//         async.each(allProducts, (item, callback) => {

//             childProducts.patchProducts({childProductId:item._id.toString(),brand:item.brand}, (err, allProducts) => {
// i++;
// callback();
//             });
//         });
//     });
// }

const readStore = itemId => {
    return new Promise((resolve, reject) => {
        stores.isExist(
            {
                id: itemId
            },
            (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            }
        );
    });
};
const readProduct = (itemId, unitId, quantity, storeType) => {
    return new Promise((resolve, reject) => {
        // if (storeType == 2) {
        //   childProducts.checkAvailableStock(
        //     { _id: new ObjectID(itemId), unitId: unitId, quantity: quantity },
        //     (err, data) => {
        //       if (err) {
        //         reject(err);
        //       }
        //       resolve(data);
        //     }
        //   );
        // } else {
        childProducts.checkStock({ _id: new ObjectID(itemId), unitId: unitId, quantity: quantity }, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
        // }
        // childProducts.checkStock({
        //     _id: new ObjectID(itemId),
        //     unitId: unitId
        // }, (err, data) => {
        //     if (err) {
        //         reject(err);
        //     }
        //     resolve(data);
        // });
    });
};

/**
 * A module that exports customer get cart handler, get cart validator!
 * @exports handler
 */
module.exports = {
    handler
};
