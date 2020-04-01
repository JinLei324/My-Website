"use strict";

const campaignAndreferral = require("../../routes/campaignAndreferral/promoCode/post");
const orders = require("../../../models/order");
const ordersModel = require("../../../models/orders");
const stores = require("../../../models/stores");
const customer = require("../../../models/customer");
const appConfig = require("../../../models/appConfig");
const storeManagers = require("../../../models/storeManagers");
const childProducts = require("../../../models/childProducts");
const savedAddress = require("../../../models/savedAddress");
const cities = require("../../../models/cities");
const zones = require("../../../models/zones");
const cartModel = require("../../../models/cart");
const error = require("../../../statusMessages/responseMessage"); // response messages based on language
const config = process.env;
const Joi = require("joi");
const logger = require("winston");
const moment = require("moment-timezone");
let tableName = "";
const slack = require('../../../library/slack');
const webSocket = require("../../../library/websocket/websocket");
const managerTopics = require("../managerTopics");
const ObjectID = require("mongodb").ObjectID;
const request = require("request");
const notifications = require("../../../library/fcm");
const async = require("async");
const mqttModule = require("../../../library/mqttModule/mqtt.js");
// const promoCodeHandler = require('../../routes/promoCode/post');
const email = require("../email/email");
// Reverse Geocoding
let geocodder = require("node-geocoder");
const superagent = require("superagent");
const notifyi = require("../../../library/mqttModule");
const googleDistance = require("../../commonModels/googleApi");
var inventoryMethod = require("../../commonModels/inventory");
const stripeTransaction = require("../../commonModels/stripe/stripeTransaction");

var options = {
    provider: "google",
    // Optionnal depending of the providers
    httpAdapter: "https", // Default
    apiKey: config.GoogleMapsApiKEy, // for Mapquest, OpenCage, Google Premier
    formatter: null // 'gpx', 'string', ...
};
/** salesforce
 * @library
 * @author Umesh Beti
 */
//const superagent = require('superagent');
const salesforce = require("../../../library/salesforce");

let SalesforceDATA;
/*salesforce*/
let geo = geocodder(options);
/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */
const handlerNew = (req, reply) => {
    // req.headers.language = "en";
    let condition = {};
    let createdBy = "";
    let extraNoteStore = req.payload.extraNote ? req.payload.extraNote : {};

    switch (req.payload.customerPOSId == null ? req.auth.credentials.sub : req.payload.customerPOSId) {
        case "customer":
            createdBy = req.auth.credentials.sub;
            condition = { _id: new ObjectID(req.auth.credentials._id.toString()) };
            break;
        case "manager":
            createdBy = req.auth.credentials.sub;
            condition = { _id: new ObjectID(req.payload.customerId) };
            break;
        case "dispatcher":
            createdBy = req.auth.credentials.sub;
            condition = { _id: new ObjectID(req.payload.customerId) };
            break;
        default:
            createdBy = "pos";
            condition = { customerPOSId: parseInt(req.payload.customerPOSId) };
    }
    // logger.error('req.payload.cart.length ' + cartData.length);
    req.payload.coordinates = {
        longitude: req.payload.longitude,
        latitude: req.payload.latitude
    };
    let cart = [];
    let cityData = {};
    let zoneData = {};
    let customerData = {};
    let payload = req.payload;
    // cart = cartData.length > 0 ? cartData : [];
    let appConfigData = {};
    let dataToInsert = {};
    let cartData = [];
    let claimData = {};
    let discount = 0;

    let addressData = {};
    const getCustomerData = () => {
        return new Promise((resolve, reject) => {

            customer.isExistsWithIdPos(condition, (err, customerDataDB) => {
                if (err) {
                    logger.error("Error occurred place order (isExistsWithId): " + JSON.stringify(err));
                    // return reply({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
                    reject({ message: req.i18n.__("genericErrMsg")["500"], code: 500 });
                }

                if (customerDataDB) {
                    customerData = customerDataDB;
                    for (let g = 0; g < cartData.length; g++) {
                        if (cartData[g].storeId.length != 24) {
                            return reply({ message: "StoreId must be an mongoId" }).code(400);
                        }
                        if (cartData[g].storeType == 4) {
                            if (req.payload.customerPOSId == null && req.auth.credentials.sub != "manager") {
                                // 4 for marijuana
                                if (customerData.status == 0) reject({ message: req.i18n.__("genericErrMsg")["401"], code: 401 });
                                if (
                                    (customerData.identityCard.verified == false && customerData.status != 2) ||
                                    (customerData.identityCard.verified == true && customerData.status != 2)
                                )
                                    reject({ message: req.i18n.__("verifyId")["401"], code: 401 });
                                if (
                                    (customerData.mmjCard.verified == false && customerData.status != 2) ||
                                    (customerData.mmjCard.verified == true && customerData.status != 2)
                                )
                                    reject({ message: req.i18n.__("verifyId")["402"], code: 402 });
                            }
                        }
                    }
                    resolve(true);
                } else {
                    reject({ message: req.i18n.__("slaveSignIn")["404"], code: 404 });
                }
            });
        });
    };
    const getCustomerAddress = () => {
        return new Promise((resolve, reject) => {

            if (typeof req.payload.addressId != "undefined" && req.payload.addressId != "") {
                req.payload.addressId = req.payload.addressId != "" ? new ObjectID(req.payload.addressId) : "";
                savedAddress.getAddressById({ _id: req.payload.addressId }, (err, addressResult) => {
                    if (err) {
                        logger.error("Error occurred during get Customer Address (inZoneAll): " + JSON.stringify(err));
                        reject({ code: 500 });
                    }
                    addressData = addressResult;
                    resolve(true);
                });
            } else {
                resolve(true);
            }
        });
    };
    const checkCart = () => {
        return new Promise((resolve, reject) => {

            cartModel.getAll({ userId: condition._id.toString() }, (err, data) => {
                if (err) {
                    reject({ code: 500 });
                } else if (data.length > 0) {
                    let totalPrice = 0;
                    let cartId = "";
                    let responseArray = [];

                    let incTax = {};
                    let excTax = {};
                    let inclTax = 0;
                    let exclTax = 0;
                    let cartTotal = 0;
                    let cartDiscount = 0;
                    async.each(
                        data,
                        (item, callback) => {
                            //loop for stores
                            let exclTaxStore = 0;
                            let excTaxStore = {};
                            if (data[0]["orderType"] == 1) {
                                // general  order
                                readStore(item.storeId)
                                    .then(store => {
                                        if (store) {
                                            item.storeDeliveryFee = 0;
                                            item.storeDeliveryFeeNew = 0;
                                            item.estimateId = "";
                                            if (item.estimates && item.estimates.length > 0) {
                                                for (let a = 0; a < item.estimates.length; a++) {
                                                    if (String(item.estimates[a].storeId) == String(item.storeId)) {
                                                        item.storeFreeDelivery = item.estimates[a].storeFreeDelivery;
                                                        item.storeDeliveryFee = item.estimates[a].deliveryPrice;
                                                        item.estimateId = item.estimates[a].estimateId;
                                                        logger.warn("if");
                                                        if (item.estimates[a].storeFreeDelivery == true) {
                                                            item.storeDeliveryFee = 0;
                                                            item.storeDeliveryFeeNew = item.estimates[a].deliveryPrice;
                                                        }
                                                    } else {
                                                        logger.warn("else");
                                                    }
                                                }
                                            }
                                            let sUnitPrice = 0;
                                            let sTotalPrice = 0;
                                            item.productsNew = [];
                                            async.each(
                                                item.products,
                                                (subItem, callbackSub) => {
                                                    //loop for child products

                                                    readProduct(
                                                        subItem.childProductId.toString(),
                                                        subItem.unitId.toString(),
                                                        subItem.quantity,
                                                        data[0]["storeType"]
                                                    )
                                                        .then(productData => {
                                                            if (productData) {
                                                                // for (let k = 0; k < item.products.length; k++) {
                                                                subItem.status = productData.status;
                                                                subItem.itemName = productData.productname[req.headers.language];
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
                                                                    productData.units[s].title = productData.units[s].name[req.headers.language]
                                                                        ? productData.units[s].name[req.headers.language]
                                                                        : "";
                                                                    productData.units[s].value = productData.units[s].price["en"]
                                                                        ? Number(Math.round(productData.units[s].price["en"] + "e2") + "e-2")
                                                                        : 0;
                                                                    productData.units[s].finalPrice = productData.units[s].value
                                                                        ? parseFloat(productData.units[s].value)
                                                                        : 0;
                                                                    if (productData.units[0].addOns && productData.units[0].addOns.length > 0) {
                                                                        subItem.addOnAvailable = 1;

                                                                        /*
                                                                                            Get the add on details from add ons collection and set it
                                                                                        */

                                                                        let addOnData = [];

                                                                        let cartItems = subItem.addOns || [];
                                                                        let allProductAddOns = [];
                                                                        let cartAddOns = [];
                                                                        subItem.selectedAddOns = [];

                                                                        if (productData.units[s].unitId == subItem.unitId) {
                                                                            let allAddOns = productData.units[s].addOns || [];
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
                                                                                            name: allProductAddOn.name[req.headers.language],
                                                                                            price: allProductAddOn.price,
                                                                                            id: allProductAddOn.id
                                                                                        });
                                                                                    }
                                                                                });
                                                                            });

                                                                            for (let n = 0; n < cartItems.length; n++) {
                                                                                for (let o = 0; o < cartItems[n].addOnGroup.length; o++) {
                                                                                    for (let i = 0; i < addOnData.length; i++) {
                                                                                        if (cartItems[n].addOnGroup[o] == addOnData[i].id) {
                                                                                            cartItems[n].addOnGroup[o] = addOnData[i];
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                            if (addOnData.length > 0) {
                                                                                for (var a = 0; a < addOnData.length; a++) {
                                                                                    subItem.addOnsPrice += parseFloat(addOnData[a].price) * subItem.quantity;
                                                                                }
                                                                            }
                                                                            subItem.selectedAddOns = cartAddOns;
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
                                                                            logger.error(moment().unix());

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
                                                                                                unitId: productData.units[l].unitId,
                                                                                                appliedDiscount: logic,
                                                                                                offerId: productData.offer[k].offerId
                                                                                                    ? productData.offer[k].offerId
                                                                                                    : "",
                                                                                                finalPrice: productData.units[l].value - logic
                                                                                            });
                                                                                        } else {
                                                                                            productData.prefUnits.push({
                                                                                                title: productData.units[l].title,
                                                                                                status: productData.units[l].status,
                                                                                                value: productData.units[l].value,
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
                                                                        subItem.unitId = productData.units[i].unitId;
                                                                        subItem.unitName = productData.units[i].title;
                                                                        subItem.offerId = productData.units[i].offerId;
                                                                        subItem.unitPrice = productData.units[i].value;
                                                                        // subItem.finalPrice = productData.units[i].finalPrice;
                                                                        subItem.appliedDiscount = productData.units[i].appliedDiscount
                                                                            ? productData.units[i].appliedDiscount
                                                                            : 0;
                                                                        subItem.finalPrice =
                                                                            subItem.appliedDiscount > subItem.unitPrice ? 0 : productData.units[i].finalPrice;
                                                                    }
                                                                }
                                                                sUnitPrice +=
                                                                    subItem.unitPrice * subItem.quantity +
                                                                    (subItem.addOnsPrice ? subItem.addOnsPrice : 0);
                                                                sTotalPrice +=
                                                                    subItem.finalPrice * subItem.quantity +
                                                                    (subItem.addOnsPrice ? subItem.addOnsPrice : 0);
                                                                ///////////////Taxes///////////////////////////////
                                                                for (let l = 0; l < subItem.taxes.length; l++) {
                                                                    if (subItem.taxes[l].taxFlag == 0) {
                                                                        // inclusive
                                                                        if (typeof incTax[subItem.taxes[l].taxCode.toString()] == "undefined") {
                                                                            incTax[subItem.taxes[l].taxCode.toString()] = {
                                                                                taxId: subItem.taxes[l].taxId,
                                                                                taxtName: subItem.taxes[l].taxname["en"],
                                                                                taxFlagMsg: subItem.taxes[l].taxFlagMsg ? subItem.taxes[l].taxFlagMsg : "",
                                                                                taxValue: subItem.taxes[l].taxValue,
                                                                                taxCode: subItem.taxes[l].taxCode,
                                                                                price:
                                                                                    ((subItem.unitPrice * subItem.taxes[l].taxValue) / 100) * subItem.quantity

                                                                                //  ((req.payload.unitPrice * taxes[i].taxValue) / 100)
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
                                                                                taxFlagMsg: subItem.taxes[l].taxFlagMsg ? subItem.taxes[l].taxFlagMsg : "",
                                                                                taxValue: subItem.taxes[l].taxValue,
                                                                                taxCode: subItem.taxes[l].taxCode,
                                                                                price:
                                                                                    ((subItem.unitPrice * subItem.taxes[l].taxValue) / 100) * subItem.quantity
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
                                                                                taxFlagMsg: subItem.taxes[l].taxFlagMsg ? subItem.taxes[l].taxFlagMsg : "",
                                                                                taxValue: subItem.taxes[l].taxValue,
                                                                                taxCode: subItem.taxes[l].taxCode,
                                                                                price:
                                                                                    ((subItem.unitPrice * subItem.taxes[l].taxValue) / 100) * subItem.quantity
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
                                                                        exclTax +=
                                                                            ((subItem.unitPrice * subItem.taxes[l].taxValue) / 100) * subItem.quantity;
                                                                        item.exclTaxStore = parseFloat(exclTaxStore);
                                                                    }
                                                                }
                                                                // item.products = subItem;
                                                                item.productsNew.push(subItem);
                                                            } else {
                                                                return reply({ message: req.i18n.__("inventoryCheck")["403"] }).code(403);
                                                            }
                                                            callbackSub();
                                                            // }
                                                        })
                                                        .catch(e => {
                                                            logger.error("err during get cart111(catch) " + e);
                                                            return reply({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
                                                        });
                                                },
                                                function (err) {
                                                    /** Assigned new products to products array */
                                                    item.products = item.productsNew.length > 0 ? item.productsNew : item.products;
                                                    delete item.productsNew;
                                                    item.storeUnitPrice = sUnitPrice;
                                                    item.storeTotalPrice = sTotalPrice;
                                                    item.storeTotalPriceWithExcTaxes =
                                                        parseFloat(item.exclTaxStore) + parseFloat(item.storeTotalPrice);
                                                    item.minimumOrderSatisfied = false;

                                                    item.minimumOrder = store.minimumOrder;
                                                    item.freeDeliveryAbove = store.freeDeliveryAbove;
                                                    item.cartDiscount = Number(
                                                        (parseFloat(item.storeUnitPrice) - parseFloat(item.storeTotalPrice)).toFixed(2)
                                                    );
                                                    item.cartTotal = Number(item.storeUnitPrice.toFixed(2));
                                                    cartTotal += item.cartTotal;
                                                    cartDiscount += Number(item.cartDiscount.toFixed(2));
                                                    if (parseFloat(item.storeTotalPrice) > parseFloat(store.minimumOrder)) {
                                                        item.minimumOrderSatisfied = true;
                                                    }
                                                    // else {
                                                    //     return reply({ message: 'Please check the minimum order value of the store.' }).code(500);
                                                    // };
                                                    // item.extraNote = "";
                                                    // for (let k = 0; k < extraNoteStore.length; k++) {
                                                    //     if (extraNoteStore[k].storeId == item.storeId) {
                                                    //         item.extraNote = extraNoteStore[k].extraNote ? extraNoteStore[k].extraNote : "";
                                                    //         break;
                                                    //     } else {
                                                    //         item.extraNote = "";
                                                    //     }
                                                    // }

                                                    item.extraNote = extraNoteStore[item.storeId] ? extraNoteStore[item.storeId] : "";
                                                    // item.timeZone = "Asia/Kolkata";
                                                    item.storeOwnerName = store.ownerName;
                                                    item.storeOwnerEmail = store.orderEmail ? store.orderEmail : store.ownerEmail;
                                                    item.autoDispatch = store.autoDispatch ? store.autoDispatch : 0;
                                                    item.forcedAccept = store.forcedAccept ? store.forcedAccept : 1;
                                                    (item.storeCommission = store.commission ? store.commission : 0),
                                                        (item.storeCommissionType = store.commissionType ? store.commissionType : 0),
                                                        (item.storeType = req.payload.storeType ? req.payload.storeType : store.storeType),
                                                        (item.storeTypeMsg = req.payload.storeTypeMsg
                                                            ? req.payload.storeTypeMsg
                                                            : store.storeTypeMsg),
                                                        (item.storeCommissionTypeMsg = store.commissionTypeMsg ? store.commissionTypeMsg : ""),
                                                        (item.driverType = store.driverType ? store.driverType : 1),
                                                        (item.storeAddress = store.storeAddr ? store.storeAddr : item.storeAddress),
                                                        responseArray.push(item);
                                                    for (let j = 0; j < responseArray.length; j++) {
                                                        totalPrice += responseArray[j].storeTotalPrice;
                                                        cartId = responseArray[j].cartId;
                                                    }
                                                    callback();
                                                }
                                            );
                                        } else {
                                            callback();
                                        }
                                    })
                                    .catch(e => {
                                        logger.error("err during get cart222(catch) ", e);
                                        return reply({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
                                    });
                            } else {


                                if (item.storeId != "" && item.storeId != "0") {

                                    //custom or bulk order
                                    readStore(item.storeId)
                                        .then(store => {
                                            if (store) {
                                                item.storeDeliveryFee = 0;
                                                item.estimateId = "";

                                                if (item.estimates && item.estimates.length > 0) {
                                                    for (let a = 0; a < item.estimates.length; a++) {
                                                        if (String(item.estimates[a].storeId) == String(item.storeId)) {
                                                            item.storeDeliveryFee = item.estimates[a].deliveryPrice;
                                                            item.estimateId = item.estimates[a].estimateId;
                                                            logger.warn("if");
                                                        } else {
                                                            item.storeDeliveryFee = item.estimates[a].deliveryPrice;
                                                            item.estimateId = item.estimates[a].estimateId;
                                                            logger.warn("else");
                                                        }
                                                    }
                                                }
                                                item.minimumOrder = 0;
                                                item.freeDeliveryAbove = 0;
                                                item.cartDiscount = Number(
                                                    (parseFloat(item.storeUnitPrice) - parseFloat(item.storeTotalPrice)).toFixed(2)
                                                );
                                                item.cartTotal = Number(item.storeUnitPrice.toFixed(2));
                                                cartTotal += item.cartTotal;
                                                cartDiscount += Number(item.cartDiscount.toFixed(2));

                                                for (let k = 0; k < item.products.length; k++) {
                                                    item.products[k].productName = item.products[k].itemName;
                                                    item.products[k].taxes = item.products[k].taxes ? item.products[k].taxes : [];
                                                    item.storeTotalPriceWithExcTaxes = parseFloat(item.storeTotalPrice);

                                                    for (let l = 0; l < item.products[k].taxes.length; l++) {
                                                        if (item.products[k].taxes[l].taxFlag == 0) {
                                                            // inclusive
                                                            if (typeof incTax[item.products[k].taxes[l].taxCode.toString()] == "undefined") {
                                                                incTax[item.products[k].taxes[l].taxCode.toString()] = {
                                                                    taxId: item.products[k].taxes[l].taxId,
                                                                    taxtName: item.products[k].taxes[l].taxname["en"],
                                                                    taxFlagMsg: item.products[k].taxes[l].taxFlagMsg
                                                                        ? item.products[k].taxes[l].taxFlagMsg
                                                                        : "",
                                                                    taxValue: item.products[k].taxes[l].taxValue,
                                                                    taxCode: item.products[k].taxes[l].taxCode,
                                                                    price: item.products[k].taxes[l].price
                                                                };
                                                            } else {
                                                                incTax[item.products[k].taxes[l].taxCode.toString()]["price"] +=
                                                                    item.products[k].taxes[l].price;
                                                            }
                                                            inclTax += item.products[k].taxes[l].price;
                                                            item.inclTax = inclTax;
                                                        }
                                                        if (item.products[k].taxes[l].taxFlag == 1) {
                                                            if (typeof excTax[item.products[k].taxes[l].taxCode] == "undefined") {
                                                                excTax[item.products[k].taxes[l].taxCode] = {
                                                                    taxId: item.products[k].taxes[l].taxId,
                                                                    taxtName: item.products[k].taxes[l].taxname["en"],
                                                                    taxFlagMsg: item.products[k].taxes[l].taxFlagMsg
                                                                        ? item.products[k].taxes[l].taxFlagMsg
                                                                        : "",
                                                                    taxValue: item.products[k].taxes[l].taxValue,
                                                                    taxCode: item.products[k].taxes[l].taxCode,
                                                                    price: item.products[k].taxes[l].price * item.products[k].quantity
                                                                };
                                                            } else {
                                                                excTax[item.products[k].taxes[l].taxCode]["price"] +=
                                                                    item.products[k].taxes[l].price * item.products[k].quantity;
                                                            }

                                                            /////////////////////////////////////////
                                                            if (typeof excTaxStore[item.products[k].taxes[l].taxCode] == "undefined") {
                                                                excTaxStore[item.products[k].taxes[l].taxCode] = {
                                                                    taxId: item.products[k].taxes[l].taxId,
                                                                    taxtName: item.products[k].taxes[l].taxname["en"],
                                                                    taxFlagMsg: item.products[k].taxes[l].taxFlagMsg
                                                                        ? item.products[k].taxes[l].taxFlagMsg
                                                                        : "",
                                                                    taxValue: item.products[k].taxes[l].taxValue,
                                                                    taxCode: item.products[k].taxes[l].taxCode,
                                                                    price: item.products[k].taxes[l].price * item.products[k].quantity
                                                                };
                                                            } else {
                                                                excTaxStore[item.products[k].taxes[l].taxCode]["price"] +=
                                                                    item.products[k].taxes[l].price * item.products[k].quantity;
                                                            }
                                                            ///////////////////////////////////////////
                                                            let storeExcTaxArr = [];
                                                            for (const key in excTaxStore) {
                                                                storeExcTaxArr.push(excTaxStore[key]);
                                                            }
                                                            item.exclusiveTaxes = storeExcTaxArr;
                                                            // exclTaxStore += item.products[k].taxes[l].price * item.products[k].quantity
                                                            // exclTax += item.products[k].taxes[l].price * item.products[k].quantity
                                                            if (typeof item.products[k].taxes[l].price != "undefined") {
                                                                exclTaxStore += item.products[k].taxes[l].price * item.products[k].quantity;
                                                                exclTax += item.products[k].taxes[l].price * item.products[k].quantity;
                                                            }
                                                            item.exclTaxStore = parseFloat(exclTaxStore);
                                                            item.storeTotalPriceWithExcTaxes =
                                                                parseFloat(item.exclTaxStore) + parseFloat(item.storeTotalPrice);
                                                        }
                                                    }
                                                }
                                                item.minimumOrderSatisfied = false;
                                                // if (parseFloat(item.storeTotalPrice) > parseFloat(store.minimumOrder)) {
                                                //     item.minimumOrderSatisfied = true;
                                                // }
                                                item.extraNote = extraNoteStore[item.storeId] ? extraNoteStore[item.storeId] : "";
                                                // item.timeZone = "Asia/Kolkata";
                                                item.storeOwnerName = store.ownerName;
                                                item.storeOwnerEmail = store.orderEmail ? store.orderEmail : store.ownerEmail;
                                                item.autoDispatch = store.autoDispatch ? store.autoDispatch : 0;
                                                item.forcedAccept = store.forcedAccept ? store.forcedAccept : 1;
                                                (item.storeCommission = store.commission ? store.commission : 0),
                                                    (item.storeCommissionType = store.commissionType ? store.commissionType : 0),
                                                    (item.storeType = req.payload.storeType ? req.payload.storeType : store.storeType),
                                                    (item.storeTypeMsg = req.payload.storeTypeMsg
                                                        ? req.payload.storeTypeMsg
                                                        : store.storeTypeMsg),
                                                    (item.storeCommissionTypeMsg = store.commissionTypeMsg ? store.commissionTypeMsg : ""),
                                                    (item.driverType = store.driverType ? store.driverType : 1),
                                                    (item.storeAddress = store.storeAddr ? store.storeAddr : item.storeAddress);

                                                responseArray.push(item);
                                                for (let j = 0; j < responseArray.length; j++) {
                                                    totalPrice += responseArray[j].storeTotalPrice;
                                                    cartId = responseArray[j].cartId;
                                                }
                                                callback();
                                            } else {
                                                callback();
                                            }
                                        })
                                        .catch(e => {
                                            logger.error("err during get cart222(catch) ", e);
                                            return reply({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
                                        });

                                } else {
                                    //custom or bulk order
                                    item.storeDeliveryFee = 0;
                                    item.estimateId = "";

                                    if (item.estimates && item.estimates.length > 0) {
                                        for (let a = 0; a < item.estimates.length; a++) {
                                            if (String(item.estimates[a].storeId) == String(item.storeId)) {
                                                item.storeDeliveryFee = item.estimates[a].deliveryPrice;
                                                item.estimateId = item.estimates[a].estimateId;
                                                logger.warn("if");
                                            } else {
                                                item.storeDeliveryFee = item.estimates[a].deliveryPrice;
                                                item.estimateId = item.estimates[a].estimateId;
                                                logger.warn("else");
                                            }
                                        }
                                    }
                                    item.minimumOrder = 0;
                                    item.freeDeliveryAbove = 0;
                                    item.cartDiscount = Number(
                                        (parseFloat(item.storeUnitPrice) - parseFloat(item.storeTotalPrice)).toFixed(2)
                                    );
                                    item.cartTotal = Number(item.storeUnitPrice.toFixed(2));
                                    cartTotal += item.cartTotal;
                                    cartDiscount += Number(item.cartDiscount.toFixed(2));

                                    for (let k = 0; k < item.products.length; k++) {
                                        item.products[k].productName = item.products[k].itemName;
                                        item.products[k].taxes = item.products[k].taxes ? item.products[k].taxes : [];
                                        item.storeTotalPriceWithExcTaxes = parseFloat(item.storeTotalPrice);

                                        for (let l = 0; l < item.products[k].taxes.length; l++) {
                                            if (item.products[k].taxes[l].taxFlag == 0) {
                                                // inclusive
                                                if (typeof incTax[item.products[k].taxes[l].taxCode.toString()] == "undefined") {
                                                    incTax[item.products[k].taxes[l].taxCode.toString()] = {
                                                        taxId: item.products[k].taxes[l].taxId,
                                                        taxtName: item.products[k].taxes[l].taxname["en"],
                                                        taxFlagMsg: item.products[k].taxes[l].taxFlagMsg
                                                            ? item.products[k].taxes[l].taxFlagMsg
                                                            : "",
                                                        taxValue: item.products[k].taxes[l].taxValue,
                                                        taxCode: item.products[k].taxes[l].taxCode,
                                                        price: item.products[k].taxes[l].price
                                                    };
                                                } else {
                                                    incTax[item.products[k].taxes[l].taxCode.toString()]["price"] +=
                                                        item.products[k].taxes[l].price;
                                                }
                                                inclTax += item.products[k].taxes[l].price;
                                                item.inclTax = inclTax;
                                            }
                                            if (item.products[k].taxes[l].taxFlag == 1) {
                                                if (typeof excTax[item.products[k].taxes[l].taxCode] == "undefined") {
                                                    excTax[item.products[k].taxes[l].taxCode] = {
                                                        taxId: item.products[k].taxes[l].taxId,
                                                        taxtName: item.products[k].taxes[l].taxname["en"],
                                                        taxFlagMsg: item.products[k].taxes[l].taxFlagMsg
                                                            ? item.products[k].taxes[l].taxFlagMsg
                                                            : "",
                                                        taxValue: item.products[k].taxes[l].taxValue,
                                                        taxCode: item.products[k].taxes[l].taxCode,
                                                        price: item.products[k].taxes[l].price * item.products[k].quantity
                                                    };
                                                } else {
                                                    excTax[item.products[k].taxes[l].taxCode]["price"] +=
                                                        item.products[k].taxes[l].price * item.products[k].quantity;
                                                }

                                                /////////////////////////////////////////
                                                if (typeof excTaxStore[item.products[k].taxes[l].taxCode] == "undefined") {
                                                    excTaxStore[item.products[k].taxes[l].taxCode] = {
                                                        taxId: item.products[k].taxes[l].taxId,
                                                        taxtName: item.products[k].taxes[l].taxname["en"],
                                                        taxFlagMsg: item.products[k].taxes[l].taxFlagMsg
                                                            ? item.products[k].taxes[l].taxFlagMsg
                                                            : "",
                                                        taxValue: item.products[k].taxes[l].taxValue,
                                                        taxCode: item.products[k].taxes[l].taxCode,
                                                        price: item.products[k].taxes[l].price * item.products[k].quantity
                                                    };
                                                } else {
                                                    excTaxStore[item.products[k].taxes[l].taxCode]["price"] +=
                                                        item.products[k].taxes[l].price * item.products[k].quantity;
                                                }
                                                ///////////////////////////////////////////
                                                let storeExcTaxArr = [];
                                                for (const key in excTaxStore) {
                                                    storeExcTaxArr.push(excTaxStore[key]);
                                                }
                                                item.exclusiveTaxes = storeExcTaxArr;
                                                // exclTaxStore += item.products[k].taxes[l].price * item.products[k].quantity
                                                // exclTax += item.products[k].taxes[l].price * item.products[k].quantity
                                                if (typeof item.products[k].taxes[l].price != "undefined") {
                                                    exclTaxStore += item.products[k].taxes[l].price * item.products[k].quantity;
                                                    exclTax += item.products[k].taxes[l].price * item.products[k].quantity;
                                                }
                                                item.exclTaxStore = parseFloat(exclTaxStore);
                                                item.storeTotalPriceWithExcTaxes =
                                                    parseFloat(item.exclTaxStore) + parseFloat(item.storeTotalPrice);
                                            }
                                        }
                                    }
                                    item.minimumOrderSatisfied = false;
                                    // if (parseFloat(item.storeTotalPrice) > parseFloat(store.minimumOrder)) {
                                    //     item.minimumOrderSatisfied = true;
                                    // }

                                    responseArray.push(item);
                                    for (let j = 0; j < responseArray.length; j++) {
                                        totalPrice += responseArray[j].storeTotalPrice;
                                        cartId = responseArray[j].cartId;
                                    }
                                    callback();
                                }


                            }
                        },
                        function (err) {
                            let incTaxArr = [];
                            let excTaxArr = [];
                            for (const key in incTax) {
                                incTaxArr.push(incTax[key]);
                            }
                            for (const key in excTax) {
                                excTaxArr.push(excTax[key]);
                            }
                            // return reply({ message: req.i18n.__('cart')['200'], data: { incNetPrice: parseFloat(totalPrice) - parseFloat(inclTax), totalPrice: parseFloat(totalPrice), inclTax: parseFloat(inclTax), incGrossTotalPrice: parseFloat(totalPrice), exclTax: parseFloat(exclTax), finalTotalIncludingTaxes: parseFloat(totalPrice) + parseFloat(exclTax), cartId: cartId, cart: responseArray, inclusiveTaxes: incTaxArr, exclusiveTaxes: excTaxArr, cartTotal: cartTotal, cartDiscount: cartDiscount } }).code(200);
                            cartData = responseArray;
                            resolve(responseArray);
                        }
                    );
                } else {
                    reject({ code: 404 });
                }
            });
        });
    };
    const readCity = () => {
        return new Promise((resolve, reject) => {
            if (req.payload.pickUpLat && req.payload.pickUpLong) {
                cartData[0].storeLatitude = req.payload.pickUpLat;
                cartData[0].storeLongitude = req.payload.pickUpLong

            }

            cities.inZone({ lat: cartData[0].storeLatitude, long: cartData[0].storeLongitude }, (err, data) => {
                if (err) {
                    logger.error("Error occurred during get fare (inZoneAll): " + JSON.stringify(err));
                    reject({ code: 500 });
                }
                if (data && data.cities) {
                    cityData = data.cities[0];
                    resolve(cityData);
                } else {
                    logger.error("city not found");
                    reject({ code: 404 });
                }
            });
        });
    };

    let readZone = () => {
        return new Promise((resolve, reject) => {
            zones.inZone({
                lat: req.payload.latitude,
                long: req.payload.longitude
            }, (err, data) => {
                if (err) {
                    reject({ code: 500 });
                }
                if (data) {
                    zoneData = data;
                    resolve(true);
                } else {
                    zoneData = {};
                    resolve(true);
                }
            });
        });
    };
    const readConfig = data => {
        return new Promise((resolve, reject) => {

            appConfig.get({}, (err, appConfig) => {
                if (err) {
                    logger.error("Error occurred appConfig (get): " + JSON.stringify(err));
                }
                appConfigData.dispatchSetting = appConfig.dispatch_settings;
                resolve(appConfigData);
            });
        });
    };
    const fetchAddress = () => {
        return new Promise((resolve, reject) => {

            appConfigData.googleData = {
                placeId: "",
                placeName: "",
                flatNumber: "",
                landmark: "",
                addressLine1: req.payload.address1 ? req.payload.address1 : "",
                addressLine2: req.payload.address2 ? req.payload.address2 : "",
                city: "",
                area: "",
                state: "",
                postalCode: "",
                country: "",
                location: {
                    longitude: req.payload.longitude,
                    latitude: req.payload.latitude || 0
                },
                dropZone: zoneData._id ? zoneData._id.toString() : 0,
                dropUpPhoneNumber: ""
            };
            if (req.payload.serviceType == 2) {
                return resolve(appConfigData);
            } else {
                appConfigData.googleData = {
                    placeId: addressData.placeId ? addressData["placeId"] : "",
                    placeName: "",
                    flatNumber: addressData.flatNumber ? addressData["flatNumber"] : "",
                    dropUpPhoneNumber: addressData.phoneNumber ? addressData.countryCode + addressData["phoneNumber"] : "",
                    landmark: addressData.landmark ? addressData["landmark"] : "",
                    addressLine1: addressData.addLine1 ? addressData["addLine1"] : "",
                    addressLine2: addressData.addLine2 ? addressData["addLine2"] : "",
                    city: addressData.city ? addressData["city"] : "",
                    area: addressData.area ? addressData["area"] : "",
                    state: addressData.state ? addressData["state"] : "",
                    postalCode: addressData.pincode ? addressData["pincode"] : "",
                    country: addressData.country ? addressData["country"] : "",
                    location: {
                        longitude: addressData.longitude,
                        latitude: addressData.latitude
                    },
                    dropZone: zoneData._id ? zoneData._id.toString() : 0
                };
                return resolve(appConfigData);
            }
        });
    };
    getCustomerData()
        .then(readZone)
        .then(getCustomerAddress)
        .then(fetchAddress)
        .then(checkCart)
        .then(readCity)
        .then(readConfig)
        .then(data => {
            return new Promise((resolve, reject) => {
                async.mapSeries(
                    cartData,
                    (cartItem, cb) => {
                        zoneData.googlePickupData = {};
                        googleDistance
                            .fetchAddress(cartItem.storeLatitude || 0, cartItem.storeLongitude || 0, [])
                            .then(data => {
                                if (data) {
                                    zoneData.googlePickupData = {
                                        placeId: data.placeId ? data.placeId : "",
                                        placeName: data.placeName ? data.placeName : "",
                                        addressLine1: cartItem.storeAddress ? cartItem.storeAddress : data.address ? data.address : "",
                                        addressLine2: "",
                                        city: data["city"] ? data["city"] : "",
                                        area: data["area"] ? data["area"] : "",
                                        state: data["state"] ? data["state"] : "",
                                        postalCode: data["postalCode"] ? data["postalCode"] : "",
                                        country: data["country"] ? data["country"] : "",
                                        location: {
                                            longitude: cartItem.storeLongitude || 0,
                                            latitude: cartItem.storeLatitude || 0
                                        },
                                        pickUpZone: 0,
                                        pickUpPhoneNumber: req.payload.pickUpPhoneNumber ? req.payload.pickUpPhoneNumber : ""
                                    };
                                } else {
                                    zoneData.googlePickupData = {
                                        placeId: "",
                                        placeName: "",
                                        addressLine1: cartItem.storeAddress ? cartItem.storeAddress : "",
                                        addressLine2: "",
                                        city: "",
                                        area: "",
                                        state: "",
                                        postalCode: "",
                                        country: "",
                                        location: {
                                            longitude: cartItem.storeLongitude,
                                            latitude: cartItem.storeLatitude
                                        },
                                        pickUpZone: 0,
                                        pickUpPhoneNumber: req.payload.pickUpPhoneNumber ? req.payload.pickUpPhoneNumber : ""
                                    };
                                }

                                let excTot = 0;
                                cartItem.exclusiveTaxes = cartItem.exclusiveTaxes ? cartItem.exclusiveTaxes : [];
                                for (let i = 0; i < cartItem.exclusiveTaxes.length; i++) {
                                    excTot += parseFloat(cartItem.exclusiveTaxes[i].price);
                                }
                                let delFee = req.payload.serviceType == 1 ? parseFloat(cartItem.storeDeliveryFee) : 0;

                                let totAmountFee =
                                    cartItem.storeTotalPriceWithExcTaxes && cartItem.storeTotalPriceWithExcTaxes > 0
                                        ? parseFloat(cartItem.storeTotalPriceWithExcTaxes)
                                        : parseFloat(cartItem.storeTotalPrice);
                                let discnt = req.payload.discount ? Number(Math.round(req.payload.discount + "e2") + "e-2") : 0;

                                //timing for expire booking
                                var storeAcceptExpireTime = 0;
                                var storeAcceptExpireTimeStemp = 0;
                                var laterDispatchStartBeforeTime = 1;
                                var AutoDispatchExpriryTime = 0;
                                var CentralDispatchExpriryTime = 0;

                                let dispatchStartTime = moment().unix();

                                let autoDispatchExpriry = 0;
                                let manualDispatchExpriry = 0;

                                if (appConfigData.dispatchSetting.dispatchMode == 1 && cartItem.autoDispatch) {
                                    appConfigData.dispatchSetting.dispatchMode = cartItem.autoDispatch;
                                }
                                if (req.payload.bookingType == 2) {
                                    //Later Booking
                                    req.payload.bookingDate = moment().format("YYYY-MM-DD HH:mm:ss");
                                    let totalCurrentToPickupSecondsDeviceTime =
                                        moment(req.payload.dueDatetime).unix() - moment(req.payload.deviceTime).unix();

                                    //convert booking date to server time
                                    var serverBookingDate = moment().unix() + totalCurrentToPickupSecondsDeviceTime;
                                    req.payload.dueDatetime = moment.unix(serverBookingDate).format("YYYY-MM-DD HH:mm:ss");

                                    if (appConfigData.dispatchSetting.dispatchMode == 1) {
                                        let laterBookingDispatchBeforeSeconds =
                                            parseInt(appConfigData.dispatchSetting.laterBookingDispatchBeforeHours * 3600) +
                                            parseInt(appConfigData.dispatchSetting.laterBookingDispatchBeforeMinutes * 60);


                                        if (totalCurrentToPickupSecondsDeviceTime <= laterBookingDispatchBeforeSeconds) {

                                            storeAcceptExpireTime = parseInt(appConfigData.dispatchSetting.laterBookingStoreExpireTime);
                                            AutoDispatchExpriryTime = parseInt(
                                                (parseInt(
                                                    totalCurrentToPickupSecondsDeviceTime -
                                                    appConfigData.dispatchSetting.laterBookingStoreExpireTime
                                                ) *
                                                    appConfigData.dispatchSetting.laterBookingAutoDispatchRatio) /
                                                100
                                            );
                                            CentralDispatchExpriryTime = parseInt(
                                                (parseInt(
                                                    totalCurrentToPickupSecondsDeviceTime -
                                                    appConfigData.dispatchSetting.laterBookingStoreExpireTime
                                                ) *
                                                    appConfigData.dispatchSetting.laterBookingCentralDispatchRatio) /
                                                100
                                            );



                                        } else {

                                            storeAcceptExpireTime = parseInt(
                                                parseInt(totalCurrentToPickupSecondsDeviceTime - laterBookingDispatchBeforeSeconds) +
                                                parseInt(parseInt(appConfigData.dispatchSetting.laterBookingStoreExpireTime))
                                            );
                                            AutoDispatchExpriryTime = parseInt(
                                                (parseInt(
                                                    laterBookingDispatchBeforeSeconds - appConfigData.dispatchSetting.laterBookingStoreExpireTime
                                                ) *
                                                    appConfigData.dispatchSetting.laterBookingAutoDispatchRatio) /
                                                100
                                            );
                                            CentralDispatchExpriryTime = parseInt(
                                                (parseInt(
                                                    laterBookingDispatchBeforeSeconds - appConfigData.dispatchSetting.laterBookingStoreExpireTime
                                                ) *
                                                    appConfigData.dispatchSetting.laterBookingCentralDispatchRatio) /
                                                100
                                            );



                                        }
                                        laterDispatchStartBeforeTime = parseInt(totalCurrentToPickupSecondsDeviceTime) - parseInt(laterBookingDispatchBeforeSeconds);
                                        if (laterDispatchStartBeforeTime < 0) {
                                            laterDispatchStartBeforeTime = 1;
                                        }
                                    } else {
                                        // only send booking to central dispatcher
                                        let laterBookingDispatchBeforeSeconds =
                                            parseInt(appConfigData.dispatchSetting.laterBookingDispatchBeforeHours * 3600) +
                                            parseInt(appConfigData.dispatchSetting.laterBookingDispatchBeforeMinutes * 60);
                                        if (totalCurrentToPickupSecondsDeviceTime <= laterBookingDispatchBeforeSeconds) {
                                            storeAcceptExpireTime = parseInt(appConfigData.dispatchSetting.laterBookingStoreExpireTime);
                                            AutoDispatchExpriryTime = 0;
                                            CentralDispatchExpriryTime = parseInt(
                                                totalCurrentToPickupSecondsDeviceTime -
                                                appConfigData.dispatchSetting.laterBookingStoreExpireTime
                                            );
                                        } else {
                                            storeAcceptExpireTime = parseInt(
                                                parseInt(totalCurrentToPickupSecondsDeviceTime - laterBookingDispatchBeforeSeconds) +
                                                parseInt(parseInt(appConfigData.dispatchSetting.laterBookingStoreExpireTime))
                                            );
                                            AutoDispatchExpriryTime = 0;
                                            CentralDispatchExpriryTime = parseInt(
                                                laterBookingDispatchBeforeSeconds - appConfigData.dispatchSetting.laterBookingStoreExpireTime
                                            );
                                        }
                                    }
                                    dispatchStartTime = moment(req.payload.dueDatetime).add('-' + laterDispatchStartBeforeTime, 'seconds').unix();
                                } else {

                                    //Now Booking
                                    req.payload.bookingDate = moment().format("YYYY-MM-DD HH:mm:ss");
                                    req.payload.dueDatetime = moment().format("YYYY-MM-DD HH:mm:ss");
                                    storeAcceptExpireTime = appConfigData.dispatchSetting.nowBookingStoreExpireTime || 60;
                                    storeAcceptExpireTimeStemp = moment
                                        .unix()
                                        .add(storeAcceptExpireTime, "seconds")
                                        .unix();
                                    if (appConfigData.dispatchSetting.dispatchMode == 1) {
                                        AutoDispatchExpriryTime = parseInt(
                                            (appConfigData.dispatchSetting.dispatchExpireTime *
                                                appConfigData.dispatchSetting.nowBookingAutoDispatchRatio) /
                                            100
                                        );
                                        CentralDispatchExpriryTime = parseInt(
                                            (appConfigData.dispatchSetting.dispatchExpireTime *
                                                appConfigData.dispatchSetting.nowBookingCentralDispatchRatio) /
                                            100
                                        );
                                    } else {
                                        CentralDispatchExpriryTime = appConfigData.dispatchSetting.dispatchExpireTime;
                                        AutoDispatchExpriryTime = 0;
                                    }
                                }

                                autoDispatchExpriry = moment
                                    .unix(dispatchStartTime)
                                    .add(AutoDispatchExpriryTime, "seconds")
                                    .unix();
                                manualDispatchExpriry = moment
                                    .unix(autoDispatchExpriry)
                                    .add(CentralDispatchExpriryTime, "seconds")
                                    .unix();

                                var forcedAccept = "";
                                var autoDispatch = "";

                                if (cartItem.storeType == 7) {
                                    console.log("Store type message - 7")
                                    forcedAccept = 1;
                                    autoDispatch = cartItem.autoDispatch ? cartItem.autoDispatch : 1;

                                } else {
                                    console.log("Store type message 1 ")
                                    forcedAccept = cartItem.forcedAccept ? cartItem.forcedAccept : 0;
                                    autoDispatch = cartItem.autoDispatch ? cartItem.autoDispatch : 2;

                                }
                                if (forcedAccept == 1 && req.payload.bookingType != 2) {
                                    storeAcceptExpireTime = 1;
                                }

                                let bookingExipry = manualDispatchExpriry;

                                //end timing for expire booking
                                var extraNoteText = ""

                                if (cartItem.storeId == 0 || cartItem.storeId == "0") {
                                    console.log("pass 1 ")
                                    extraNoteText = extraNoteStore['1'] ? extraNoteStore['1'] : "";

                                } else {

                                    extraNoteText = cartItem.extraNote ? cartItem.extraNote : "";

                                }
                                let OrderId = parseInt(moment().valueOf());
                                dataToInsert = {
                                    estimateId: cartItem.estimateId,
                                    storeId: cartItem.storeId,
                                    storeCoordinates: {
                                        longitude: cartItem.storeLongitude,
                                        latitude: cartItem.storeLatitude
                                    },
                                    storeOwnerName: cartItem.storeOwnerName,
                                    storePhone: cartItem.storePhone,
                                    storeOwnerEmail: cartItem.storeOwnerEmail,
                                    cartTotal: Number(Math.round(cartItem.cartTotal + "e2") + "e-2"),
                                    cartDiscount: Number(Math.round(cartItem.cartDiscount + "e2") + "e-2"),
                                    storeLogo: cartItem.storeLogo,
                                    storeName: cartItem.storeName,
                                    // timeZone: cartItem.timeZone,
                                    timeZone: cityData.timeZoneId || "Asia/Kolkata",
                                    extraNote: extraNoteText,
                                    visiableInAccept: true,
                                    forcedAccept: forcedAccept,
                                    autoDispatch: autoDispatch,
                                    storeCommission: cartItem.storeCommission ? cartItem.storeCommission : 0,
                                    storeCommissionType: cartItem.storeCommissionType ? cartItem.storeCommissionType : 0,
                                    cartsAllowed: cartItem.cartsAllowed,
                                    storeType: req.payload.storeType ? req.payload.storeType : cartItem.storeType,
                                    storeTypeMsg: req.payload.storeTypeMsg ? req.payload.storeTypeMsg : cartItem.storeTypeMsg,
                                    storeCommissionTypeMsg: cartItem.storeCommissionTypeMsg ? cartItem.storeCommissionTypeMsg : "",
                                    driverType: cartItem.driverType ? cartItem.driverType : 1,
                                    storeAddress: cartItem.storeAddress ? cartItem.storeAddress : cartItem.storeAddress,
                                    subTotalAmountWithExcTax: Number(Math.round(totAmountFee + "e2") + "e-2"),
                                    orderId: OrderId,
                                    orderIdString: OrderId.toString(),
                                    cartId: req.payload.cartId ? req.payload.cartId : "",
                                    deliveryCharge: delFee,
                                    storeFreeDelivery: cartItem.storeFreeDelivery,
                                    storeDeliveryFee: req.payload.serviceType == 1 ? cartItem.storeDeliveryFeeNew : 0,
                                    // deliveryCharge: 0,
                                    subTotalAmount: Number(Math.round(cartItem.storeTotalPrice + "e2") + "e-2"),
                                    excTax: Number(Math.round(excTot + "e2") + "e-2"),
                                    exclusiveTaxes: cartItem.exclusiveTaxes ? cartItem.exclusiveTaxes : [],
                                    orderType: cartItem.orderType ? cartItem.orderType : 1,
                                    orderTypeMsg: cartItem.orderTypeMsg ? cartItem.orderTypeMsg : "",
                                    discount: discnt,
                                    claimData: claimData,
                                    estimatedPackageValue: req.payload.estimatedPackageValue || 0,
                                    totalAmount: Number(Math.round(totAmountFee + "e2") + "e-2") + delFee - discnt,
                                    // totalAmount: (totAmountFee) - discnt,
                                    Items: cartItem.products,
                                    couponCode: req.payload.couponCode ? req.payload.couponCode : "",
                                    paymentType: req.payload.paymentType ? req.payload.paymentType : 0,
                                    payByWallet: req.payload.payByWallet ? req.payload.payByWallet : 0,
                                    paymentTypeMsg:
                                        (req.payload.paymentType == 1 ? "Card" : req.payload.paymentType == 2 ? "Cash" : "") +
                                        (req.payload.payByWallet == 1 ? " + Wallet" : ""),
                                    coinpayTransaction: {
                                        transactionId: req.payload.transaction ? req.payload.transaction.txnId : "",
                                        transactionStatusMsg: "Processing",
                                        transactionAddress: req.payload.transaction ? req.payload.transaction.address : "",
                                        transactionQrUrl: req.payload.transaction ? req.payload.transaction.qrUrl : "",
                                        transactionStatusUrl: req.payload.transaction ? req.payload.transaction.statusUrl : "",
                                        actions: [
                                            {
                                                transactionStatusMsg: "Processing",
                                                customerId: customerData._id.toString(),
                                                timeStamp: moment().unix(),
                                                isoDate: new Date()
                                            }
                                        ]
                                    },
                                    customerCoordinates: req.payload.coordinates,
                                    bookingDate: req.payload.bookingDate,
                                    bookingDateTimeStamp: moment().unix(),
                                    dueDatetime: req.payload.dueDatetime,
                                    dueDatetimeDate: moment(req.payload.dueDatetime).format("DD-MM-YYYY"),
                                    dueDatetimeTimeStamp: moment(req.payload.dueDatetime).unix(),
                                    dueDatetimeDateFull: moment(req.payload.dueDatetime).format("YYYY-MM-DD HH:mm:ss"),
                                    city: req.payload.city ? req.payload.city : "",
                                    cityId: cityData.cityId ? cityData.cityId.toString() : "",
                                    status: 1,
                                    statusMsg: req.i18n.__(req.i18n.__('bookingStatusTitle')['1']),
                                    statusText: req.i18n.__(req.i18n.__('bookingStatusTitle')['1']),
                                    serviceType: req.payload.serviceType ? req.payload.serviceType : "",
                                    bookingType: req.payload.bookingType ? req.payload.bookingType : 0,
                                    pricingModel: req.payload.pricingModel ? req.payload.pricingModel : 0,
                                    zoneType: req.payload.zoneType ? req.payload.zoneType : "", // short zone ride booking
                                    customerDetails: {
                                        customerId: customerData._id.toString(),
                                        name: customerData.name ? customerData.name : "",
                                        email: customerData.email ? customerData.email : "",
                                        mobile: customerData.phone ? customerData.phone : "",
                                        countryCode: customerData.countryCode ? customerData.countryCode : "",
                                        profilePic: customerData.profilePic ? customerData.profilePic : "",
                                        fcmTopic: customerData.fcmTopic ? customerData.fcmTopic : "", // FCM Push Topic
                                        deviceType: customerData.mobileDevices ? customerData.mobileDevices.deviceType : 1, //device type 1-ios, 2-android
                                        deviceId: customerData.mobileDevices ? customerData.mobileDevices.deviceId : "", // slave device id
                                        mqttTopic: customerData.mqttTopic ? customerData.mqttTopic : "", // MQTT channel
                                        mmjCard: customerData.mmjCard ? customerData.mmjCard.url : "",
                                        identityCard: customerData.identityCard ? customerData.identityCard.url : ""
                                    },
                                    dispatchTime: {
                                        dispatchMode: appConfigData.dispatchSetting.dispatchMode,
                                        dispatchStartTime: dispatchStartTime,
                                        bookingExpiryTime: bookingExipry,
                                        autoDispatchExpriry: autoDispatchExpriry,
                                        manualDispatchExpriry: manualDispatchExpriry
                                    },
                                    storeAcceptExpireTime: storeAcceptExpireTime,
                                    AutoDispatchExpriryTime: AutoDispatchExpriryTime,
                                    CentralDispatchExpriryTime: CentralDispatchExpriryTime,
                                    dispatchSetting: appConfigData.dispatchSetting,
                                    pickup: zoneData.googlePickupData,
                                    drop: appConfigData.googleData,
                                    timeStamp: {
                                        created: {
                                            statusUpdatedBy: createdBy, //dispatcher / driver / customer
                                            userId: customerData._id.toString(),
                                            timeStamp: moment().unix(),
                                            isoDate: new Date(),
                                            location: {
                                                longitude: req.payload.longitude,
                                                latitude: req.payload.latitude
                                            },
                                            message: cartItem.extraNote ? cartItem.extraNote : "",
                                            ip: req.payload.ipAddress
                                        }
                                    },
                                    activityLogs: [
                                        {
                                            state: "created",
                                            statusUpdatedBy: createdBy, //dispatcher / driver / customer
                                            userId: customerData._id.toString(),
                                            timeStamp: moment().unix(),
                                            isoDate: new Date(),
                                            location: {
                                                longitude: req.payload.longitude,
                                                latitude: req.payload.latitude
                                            },
                                            message: cartItem.extraNote ? cartItem.extraNote : "",
                                            ip: req.payload.ipAddress
                                        }
                                    ],
                                    abbrevation: cityData.abbrevation ? cityData.abbrevation : "",
                                    abbrevationText: cityData.abbrevationText ? cityData.abbrevationText : "",
                                    currency: cityData.currency ? cityData.currency : "",
                                    currencySymbol: cityData.currencySymbol ? cityData.currencySymbol : "",
                                    mileageMetric: cityData.mileageMetric ? (cityData.mileageMetric == 1 ? "Miles" : "Km") : "",
                                    paidBy: {
                                        cash: 0,
                                        wallet: 0,
                                        card: 0,
                                        cardChargeId: ""
                                    },
                                    accouting: {
                                        driverType: 0,
                                        driverTypeMsg: "",
                                        taxes: Number(Math.round(excTot + "e2") + "e-2"),
                                        storeCommPer: cartItem.storeCommission,
                                        storeCommissionType: cartItem.storeCommissionType,
                                        storeCommissionTypeMsg: cartItem.storeCommissionTypeMsg,
                                        driverCommPer: 0,
                                        driverCommType: 0,
                                        driverCommTypeMsg: "",
                                        appEarningValue: 0,
                                        driverEarningValue: 0,
                                        driverCommissionToAppValue: 0,
                                        storeEarningValue: 0,
                                        storeCommissionToAppValue: 0,
                                        cashCollected: 0,
                                        pgComm: 0,
                                        pgCommName: req.payload.paymentType == 1 ? "stripe" : "",
                                        tollFee: 0,
                                        driverTip: 0,
                                        driverTotalEarningValue: 0,
                                        handlingFee: 0,
                                        appProfitLoss: 0
                                    },
                                    inDispatch: false
                                };

                                chargeCustomer()
                                    .then(insertBooking)
                                    .then(response => {

                                        cartModel.clearCart(
                                            {
                                                customerName: customerData.name,
                                                createdBy: createdBy,
                                                cartId: req.payload.cartId,
                                                userId: customerData._id.toString(),
                                                orderId: response.ops[0].orderId,
                                                storeId: response.ops[0].storeId
                                            },
                                            (err, isCleared) => {
                                                if (req.payload.customerPOSId == null) {
                                                    let childProductIds = [];
                                                    for (let s = 0; s < cartItem.products.length; s++) {
                                                        childProductIds.push(new ObjectID(cartItem.products[s].childProductId));
                                                    }
                                                    let inventoryData = [];
                                                    if (response.ops[0].storeType == 2) {
                                                        for (let y = 0; y < response.ops[0].Items.length; y++) {
                                                            inventoryData.push({
                                                                orderId: response.ops[0].orderId,
                                                                userId: customerData._id.toString(),
                                                                unitId: response.ops[0].Items[y].unitId,
                                                                productId: response.ops[0].Items[y].childProductId,
                                                                storeId: response.ops[0].storeId.toString(),
                                                                comingFromBulkUpload: 2,
                                                                triggerType: 2,
                                                                quantity: response.ops[0].Items[y].quantity,
                                                                description: "Order placed",
                                                                createdBy: createdBy
                                                            });
                                                        }
                                                        updateInventory(inventoryData);
                                                    }
                                                    childProducts.pushToOrdered(
                                                        {
                                                            orderId: response.ops[0].orderId,
                                                            userId: customerData._id.toString(),
                                                            childProductId: childProductIds,
                                                            createdBy: createdBy
                                                        },
                                                        (err, data) => { }
                                                    );
                                                }

                                                if (req.payload.couponCode && req.payload.couponCode != "") {
                                                    let dataReq = {
                                                        customerName: customerData.name,
                                                        customerEmail: customerData.email,
                                                        customerContactNumber: "",
                                                        couponCode: req.payload.couponCode,
                                                        userId: customerData._id.toString(),
                                                        cityId: cityData.cityId.toString(),
                                                        categoryId: "",
                                                        paymentMethod: req.payload.paymentType == 1 ? 2 : 1,
                                                        cartId: response.ops[0].cartId,
                                                        cartValue: parseFloat(response.ops[0].totalAmount),
                                                        deliveryFee: delFee,
                                                        vehicleType: 0,
                                                        currency: cityData.currency || "USD",
                                                        currencySymbol: cityData.currencySymbol || "$",
                                                        bookingId: response.ops[0].orderId
                                                    };
                                                    campaignAndreferral.lockCouponCodeHandler(dataReq, (err, res) => {
                                                        claimData = res;
                                                        discount = claimData ? (claimData.statusCode == 200 ? claimData.finalAmount : 0) : 0;
                                                        let uData = {
                                                            claimData: claimData,
                                                            discount: discount
                                                        };
                                                        orders.Update({ orderId: parseInt(response.ops[0].orderId) }, uData, tableName, (err, res) => { });
                                                    });
                                                }
                                                orders.setExPresence(
                                                    {
                                                        time: response.ops[0].storeAcceptExpireTime ? response.ops[0].storeAcceptExpireTime : 60,
                                                        key: "storeAcceptExpire_" + response.ops[0].orderId + ""
                                                    },
                                                    (err, data) => { }
                                                );
                                                sendNotification(response.ops[0]);
                                                sendEmail(response.ops[0]);
                                                sendEmailStore(response.ops[0])
                                                cb(null, { code: 200, data: response.ops[0] });
                                            }
                                        );
                                    })
                                    .catch(err => {
                                        logger.error("fdsafsadfadsf : ", err);
                                        reject({ code: 500 });
                                    });
                            })
                            .catch(err => {
                                logger.error("fdsafsadfadsf : ", err);
                                cb({ code: 500 });
                            });
                    },
                    (errOrder, resOrder) => {
                        if (errOrder) {
                            return reply({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
                        }
                        /* Salesforce @Umesh Beti */
                        var addonss = [];
                        //SalesforceDATA

                        salesforce.login(() => { });
                        var authData = salesforce.get();
                        var timedate = moment(SalesforceDATA.ops[0].bookingDate).format("MM/DD/YYYY");
                        var DRopaddress, PICKUPaddresss;
                        if (SalesforceDATA.ops[0].drop.addressLine1 != null && SalesforceDATA.ops[0].drop.addressLine2) {
                            DRopaddress = SalesforceDATA.ops[0].drop.addressLine1 + " , " + SalesforceDATA.ops[0].drop.addressLine2;
                        } else if (SalesforceDATA.ops[0].drop.addressLine2 != null) {
                            DRopaddress = SalesforceDATA.ops[0].drop.addressLine2;
                        } else if (SalesforceDATA.ops[0].drop.addressLine1 != null) {
                            DRopaddress = SalesforceDATA.ops[0].drop.addressLine1;
                        }

                        if (SalesforceDATA.ops[0].pickup.addressLine1 != null && SalesforceDATA.ops[0].pickup.addressLine2) {
                            PICKUPaddresss =
                                SalesforceDATA.ops[0].pickup.addressLine1 + " , " + SalesforceDATA.ops[0].pickup.addressLine2;
                        } else if (SalesforceDATA.ops[0].pickup.addressLine2 != null) {
                            PICKUPaddresss = SalesforceDATA.ops[0].pickup.addressLine2;
                        } else if (SalesforceDATA.ops[0].pickup.addressLine1 != null) {
                            PICKUPaddresss = SalesforceDATA.ops[0].pickup.addressLine1;
                        }
                        var itemsList = [];
                        let obj,
                            obje1 = {};
                        SalesforceDATA.ops[0].Items &&
                            SalesforceDATA.ops[0].Items.map((element, index) => {
                                obje1 = {};
                                obje1.itemName = element.itemName ? element.itemName : "";
                                obje1.unitname = element.unitName ? element.unitName : "";
                                obje1.unitId = element.unitId ? element.unitId : "";
                                obje1.actualPrice = 0; // changes need
                                obje1.offeredPrice = 0; //changes need
                                obje1.itemImage = element.itemImageURL ? element.itemImageURL : "";
                                (obje1.offerId = element.offerId ? element.offerId : ""), (obje1.taxes = "0"); //changes need
                                obje1.itemDiscount = element.appliedDiscount;
                                obje1.addOnPrice = element.addOnsPrice;
                                element.addOns &&
                                    element.addOns.map((val, index) => {
                                        val.addOnGroup &&
                                            val.addOnGroup.map((values, index) => {
                                                obj = {};
                                                obj["name"] = values.name ? values.name : "";
                                                obj["price"] = values.price ? parseFloat(values.price) : 0;
                                                addonss.push(obj);
                                            });
                                    });
                                obje1.addOns = addonss;
                                itemsList.push(obje1);
                            });

                        var DataToSalesforce = {
                            orderId: SalesforceDATA.ops[0].orderId ? SalesforceDATA.ops[0].orderId : "",
                            storeId: SalesforceDATA.ops[0].storeId ? SalesforceDATA.ops[0].storeId : "",
                            customerId: SalesforceDATA.ops[0].customerDetails.customerId
                                ? SalesforceDATA.ops[0].customerDetails.customerId
                                : "",
                            cartTotal: SalesforceDATA.ops[0].cartTotal ? SalesforceDATA.ops[0].cartTotal : "",
                            cartDiscount: SalesforceDATA.ops[0].cartDiscount ? SalesforceDATA.ops[0].cartDiscount : "0",
                            effectiveDate: timedate ? timedate : moment().format("MM/DD/YYYY"),
                            status: SalesforceDATA.ops[0].status == 1 ? SalesforceDATA.ops[0].statusMsg : "New Order",
                            subTotalWithOutTax: SalesforceDATA.ops[0].subTotalAmountWithExcTax
                                ? SalesforceDATA.ops[0].subTotalAmountWithExcTax
                                : 0,
                            storeAppCommission: SalesforceDATA.ops[0].storeCommission ? SalesforceDATA.ops[0].storeCommission : 0,
                            StoreCommissionType: SalesforceDATA.ops[0].storeCommissionTypeMsg
                                ? SalesforceDATA.ops[0].storeCommissionTypeMsg
                                : "Percentage",
                            storeDriverType: SalesforceDATA.ops[0].driverType == 2 ? "Store Drivers " : "Freelance",
                            subTotal: SalesforceDATA.ops[0].subTotalAmount ? SalesforceDATA.ops[0].subTotalAmount : 0,
                            deliveryCharge: SalesforceDATA.ops[0].deliveryCharge ? SalesforceDATA.ops[0].deliveryCharge : 0,
                            storeFreeDelivery: SalesforceDATA.ops[0].storeFreeDelivery
                                ? SalesforceDATA.ops[0].storeFreeDelivery
                                : false,
                            taxAmount: SalesforceDATA.ops[0].excTax ? SalesforceDATA.ops[0].excTax : 0,
                            appliedTax: "8.9%", //needs to change
                            orderTypeMessage: SalesforceDATA.ops[0].orderTypeMsg ? SalesforceDATA.ops[0].orderTypeMsg : "",
                            promoCodeDiscount: 100,
                            totalAmount: SalesforceDATA.ops[0].totalAmount ? SalesforceDATA.ops[0].totalAmount : "",
                            couponCode: SalesforceDATA.ops[0].couponCode ? SalesforceDATA.ops[0].couponCode : "",
                            paymentType: SalesforceDATA.ops[0].paymentTypeMsg ? SalesforceDATA.ops[0].paymentTypeMsg : "",
                            paidByWallet: (SalesforceDATA.ops[0].paymentType = 2 ? false : true),
                            bookingDateNTime: SalesforceDATA.ops[0].bookingDate
                                ? moment(SalesforceDATA.ops[0].bookingDate).format("YYYY-MM-DD HH:mm:ss")
                                : moment().format("YYYY-MM-DD HH:mm:ss"),
                            dueDateNTime: SalesforceDATA.ops[0].dueDatetime
                                ? moment(SalesforceDATA.ops[0].dueDatetime).format("YYYY-MM-DD HH:mm:ss")
                                : moment().format("YYYY-MM-DD HH:mm:ss"),
                            city: SalesforceDATA.ops[0].city ? SalesforceDATA.ops[0].city : "",
                            bookingStatusMessage: SalesforceDATA.ops[0].statusMsg ? SalesforceDATA.ops[0].statusMsg : "",
                            bookingType: SalesforceDATA.ops[0].bookingType ? SalesforceDATA.ops[0].bookingType : "",
                            bookingNote: SalesforceDATA.ops[0].extraNote ? SalesforceDATA.ops[0].extraNote : "",
                            storeDispatcher: "Manager of Store",
                            pickUpPlaceName: SalesforceDATA.ops[0].pickup.placeName ? SalesforceDATA.ops[0].pickup.placeName : "",
                            pickUpAddress: PICKUPaddresss ? PICKUPaddresss : "",
                            pickUpCity: SalesforceDATA.ops[0].pickup.city ? SalesforceDATA.ops[0].pickup.city : "",
                            pickUpArea: SalesforceDATA.ops[0].pickuparea ? SalesforceDATA.ops[0].pickuparea : "",
                            pickUpPostalCode: SalesforceDATA.ops[0].pickup.postalCode ? SalesforceDATA.ops[0].pickup.postalCode : "",
                            pickUpCountry: SalesforceDATA.ops[0].pickup.country ? SalesforceDATA.ops[0].pickup.country : "",
                            dropPlaceName: SalesforceDATA.ops[0].drop.placeName ? SalesforceDATA.ops[0].drop.placeName : "",
                            dropAddress: DRopaddress ? DRopaddress : "",
                            dropCity: SalesforceDATA.ops[0].drop.city ? SalesforceDATA.ops[0].drop.city : "",
                            dropArea: SalesforceDATA.ops[0].drop.area ? SalesforceDATA.ops[0].drop.area : "",
                            dropPostalCode: SalesforceDATA.ops[0].drop.postalCode ? SalesforceDATA.ops[0].drop.postalCode : "",
                            dropCountry: SalesforceDATA.ops[0].drop.country ? SalesforceDATA.ops[0].drop.country : "",
                            driverAccountMessage: SalesforceDATA.ops[0].accouting.driverTypeMsg
                                ? SalesforceDATA.ops[0].accouting.driverTypeMsg
                                : "",
                            taxes: SalesforceDATA.ops[0].taxes ? SalesforceDATA.ops[0].taxes : 0,
                            storeCommissionPercentage: SalesforceDATA.ops[0].accouting.storeCommPer
                                ? SalesforceDATA.ops[0].accouting.storeCommPer
                                : 0,
                            storeCommissionMessage: SalesforceDATA.ops[0].accouting.storeCommPer
                                ? SalesforceDATA.ops[0].accouting.storeCommPer
                                : "",
                            driverCommissionPercentage: SalesforceDATA.ops[0].accouting.driverCommPer
                                ? SalesforceDATA.ops[0].accouting.driverCommPer
                                : 0,
                            driverCommissionMessage: SalesforceDATA.ops[0].accouting.driverCommTypeMsg
                                ? SalesforceDATA.ops[0].accouting.driverCommTypeMsg
                                : "",
                            appEarningValue: SalesforceDATA.ops[0].accouting.appEarningValue
                                ? SalesforceDATA.ops[0].accouting.appEarningValue
                                : 0,
                            driverEarningValue: SalesforceDATA.ops[0].accouting.driverEarningValue
                                ? SalesforceDATA.ops[0].accouting.driverEarningValue
                                : 0,
                            driverCommissionToAppValue: SalesforceDATA.ops[0].accouting.driverCommissionToAppValue
                                ? SalesforceDATA.ops[0].accouting.driverCommissionToAppValue
                                : 0,
                            storeEarningValue: SalesforceDATA.ops[0].accouting.storeEarningValue
                                ? SalesforceDATA.ops[0].accouting.storeEarningValue
                                : 0,
                            storeCommissionToAppValue: SalesforceDATA.ops[0].accouting.storeCommissionToAppValue
                                ? SalesforceDATA.ops[0].accouting.storeCommissionToAppValue
                                : 0,
                            pgCommissionName: SalesforceDATA.ops[0].accouting.pgComm ? SalesforceDATA.ops[0].accouting.pgComm : 0,
                            driverTip: SalesforceDATA.ops[0].accouting.driverTip ? SalesforceDATA.ops[0].accouting.driverTip : 0,
                            driverTotalEarning: SalesforceDATA.ops[0].accouting.driverTotalEarningValue
                                ? SalesforceDATA.ops[0].accouting.driverTotalEarningValue
                                : "0",
                            storeCommissionValue: SalesforceDATA.ops[0].storeCommission ? SalesforceDATA.ops[0].storeCommission : 0,
                            cartCommissionValue: 0,
                            driverCommissionValue: 0,
                            appDiscountValue: SalesforceDATA.ops[0].cartDiscount ? SalesforceDATA.ops[0].cartDiscount : "0",
                            storeDiscountValue: SalesforceDATA.ops[0].discount ? SalesforceDATA.ops[0].discount : 0,
                            storeDeliveryFee: SalesforceDATA.ops[0].storeDeliveryFee ? SalesforceDATA.ops[0].storeDeliveryFee : 0,
                            pgEarningValue: SalesforceDATA.ops[0].accouting.pgComm ? SalesforceDATA.ops[0].accouting.pgComm : 0,
                            orderItems: itemsList ? itemsList : []
                        };
                        if (authData) {
                            superagent
                                .post(authData.instanceUrl + "/services/apexrest/delivx/NewOrder")
                                .send(DataToSalesforce) // sends a JSON post body
                                .set("Accept", "application/json")
                                .set("Authorization", "Bearer " + authData.accessToken)
                                .end((err, res) => {
                                    if (err) logger.error("err ====in second attempt " + err);
                                    if (err) {
                                        salesforce.login(() => {
                                            var authData = salesforce.get();
                                            if (authData) {
                                                superagent
                                                    .post(authData.instanceUrl + "/services/apexrest/delivx/NewOrder")
                                                    .send(DataToSalesforce) // sends a JSON post body
                                                    .set("Accept", "application/json")
                                                    .set("Authorization", "Bearer " + authData.accessToken)
                                                    .end((err, res) => {
                                                        if (err) {
                                                            logger.error("err ====in second attempt " + err);
                                                        } else {
                                                            logger.info("send to salesforece success");
                                                        }
                                                    });
                                            }
                                        });
                                    } else {

                                    }
                                });
                        }

                        /* Salesforce @Umesh Beti */
                        return reply({ message: req.i18n.__("orders")["200"], data: { orderId: resOrder[0].data.orderId } }).code(
                            200
                        );
                    }
                );
            });
        })
        .catch(e => {
            logger.error("Error occurred place order (catch): " + JSON.stringify(e));
            switch (e.code) {
                case 404:
                    return reply({ message: req.i18n.__("cart")["404"] }).code(404);
                default:
                    return reply({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
            }
            // logger.error('Error occurred place order (catch): ' + JSON.stringify(e));
            // return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
        });
    const readStore = itemId => {
        return new Promise((resolve, reject) => {
            stores.isExist({ id: itemId }, (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    };
    const chargeCustomer = itemId => {
        return new Promise((resolve, reject) => {
            let totalAmountToCapture = dataToInsert.totalAmount;
            let currentBal = customerData.wallet ? customerData.wallet.balance : 0;
            let blockedBal = customerData.wallet ? customerData.wallet.blocked : 0;
            currentBal = currentBal - blockedBal;
            //capture from card if card booking
            if (req.payload.payByWallet == 1 && currentBal > 0) {
                let walletCapture = parseFloat(totalAmountToCapture);

                if (currentBal < totalAmountToCapture) {
                    walletCapture = parseFloat(currentBal);
                }
                dataToInsert.paidBy.wallet = walletCapture;
                totalAmountToCapture = totalAmountToCapture - walletCapture;
                customer.blockWalletBalance(
                    {
                        // wallet bal block
                        userId: dataToInsert.customerDetails.customerId,
                        createdBy: createdBy,
                        amount: blockedBal + walletCapture
                    },
                    (err, data) => { }
                );
                customerData.wallet.blocked += walletCapture;
            }
            if (req.payload.paymentType == 1 && totalAmountToCapture > 0) {
                //synchronous stripe code
                //capture remain amount from card
                let cardCapture = totalAmountToCapture;
                dataToInsert.paidBy.card = cardCapture;
                stripeTransaction
                    .createCharge(
                        req,
                        customerData._id.toString(),
                        req.payload.cardId,
                        dataToInsert.paidBy.card,
                        cityData.currency ? cityData.currency : "",
                        "New Order"
                    )
                    .then(data => {
                        dataToInsert.stripeCharge = data.data;
                        resolve(true);
                    })
                    .catch(e => {
                        if (dataToInsert.paidBy.wallet > 0) {
                            customer.releaseBlockWalletBalance(
                                {
                                    // wallet bal block
                                    userId: dataToInsert.customerDetails.customerId,
                                    createdBy: createdBy,
                                    amount: dataToInsert.paidBy.wallet
                                },
                                (err, data) => { }
                            );
                            customerData.wallet.blocked += dataToInsert.paidBy.wallet;
                        }
                        reject({ message: e.message, code: 401 });
                    });
            } else {
                dataToInsert.paidBy.cash = totalAmountToCapture;
                resolve(true);
            }
        });
    };

    const insertBooking = () => {
        return new Promise((resolve, reject) => {
            if (dataToInsert.forcedAccept == 1) {
                if (dataToInsert.forcedAccept == 1 && dataToInsert.autoDispatch == 1 && dataToInsert.serviceType == 1) {
                    dataToInsert.visiableInAccept = false;
                }
                dataToInsert.statusMsg = req.i18n.__(req.i18n.__('bookingStatusTitle')['4']);
                dataToInsert.statusText = req.i18n.__(req.i18n.__('bookingStatusTitle')['4']);
                dataToInsert.status = 4;
                if (dataToInsert.serviceType == 2) {
                    ordersModel.insert(dataToInsert, "pickupOrders", (err, resultObj) => {
                        tableName = "pickupOrders";
                        SalesforceDATA = resultObj;
                        slack.sendSlackMessage(resultObj.ops[0], (err, res) => {
                            if (res) {
                                logger.info("send slack success")
                            } else {
                                logger.info("send slack error")
                            }
                        });
                        resolve(resultObj);
                    });
                } else {
                    ordersModel.insert(dataToInsert, "unassignOrders", (err, resultObj) => {
                        tableName = "unassignOrders";
                        SalesforceDATA = resultObj;
                        slack.sendSlackMessage(resultObj.ops[0], (err, res) => {
                            if (res) {
                                logger.info("send slack success")
                            } else {
                                logger.info("send slack error")
                            }
                        });
                        resolve(resultObj);
                    });
                }
            } else {
                orders.postOrdersNew(dataToInsert, (err, response) => {
                    tableName = "newOrder";
                    SalesforceDATA = response;
                    slack.sendSlackMessage(response.ops[0], (err, res) => {
                        if (res) {
                            logger.info("send slack success")
                        } else {
                            logger.info("send slack error")
                        }
                    });
                    if (err) {
                        logger.error("Error occurred place order (postOrders): " + JSON.stringify(err));
                        cb({ code: 500 });
                    }
                    resolve(response);
                });
            }
            // resolve(true);
        });
    };
    const readProduct = (itemId, unitId, quantity, storeType) => {
        return new Promise((resolve, reject) => {
            if (storeType == 2) {
                childProducts.checkAvailableStock(
                    { _id: new ObjectID(itemId), unitId: unitId, quantity: quantity },
                    (err, data) => {
                        if (err) {
                            reject(err);
                        }
                        resolve(data);
                    }
                );
            } else {
                childProducts.checkStock({ _id: new ObjectID(itemId), unitId: unitId, quantity: quantity }, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(data);
                });
            }
        });
    };
    const updateInventory = data => {
        async.each(
            data,
            (item, callback) => {
                /**
                 * function : inventoryMethod
                 * des:to update inventory
                 */
                inventoryMethod.patchLogs(item, (err, res) => {
                    if (err) {
                        logger.error("err while updaing inventory order place", err);
                    } else {
                        callback();
                    }
                });
            },
            function (err) { }
        );
    };
    function sendNotification(data) {

        if (data.forcedAccept == 1 && data.autoDispatch == 1 && data.serviceType == 1) {

        } else {

            managerTopics.sendToWebsocket(data, 2, (err, res) => { });
            storeManagers.getAll({ storeId: data.storeId.toString(), status: 2 }, (err, storeManager) => {
                if (err) {
                    logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
                }
                if (storeManager.length > 0) {
                    for (let s = 0; s < storeManager.length; s++) {
                        notifications.notifyFcmTopic(
                            {
                                action: 1,
                                usertype: 1,
                                deviceType: storeManager[s].mobileDevices.deviceType ? storeManager[s].mobileDevices.deviceType : 2,
                                notification: "",
                                msg: req.i18n.__(req.i18n.__('bookingStatusMsg')[data.status], data.orderId),
                                fcmTopic: storeManager[s].fcmManagerTopic,
                                title: req.i18n.__(req.i18n.__('bookingStatusTitle')[data.status]),
                                data: { orderId: data.orderId || "" },
                                sound: "OrderSound.wav"
                            },
                            () => { }
                        );
                    }
                }
            });
        }

        storeManagers.getAll({ cityId: data.cityId.toString(), status: 2, userType: 0 }, (err, cityManager) => {
            if (err) {
                logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
            }

            if (cityManager.length > 0) {
                for (let k = 0; k < cityManager.length; k++) {
                    notifications.notifyFcmTopic(
                        {
                            action: 1,
                            usertype: 1,
                            deviceType: cityManager[k].mobileDevices.deviceType ? cityManager[k].mobileDevices.deviceType : 2,
                            notification: "",
                            msg: req.i18n.__(req.i18n.__('bookingStatusMsg')[data.status], data.orderId),
                            fcmTopic: cityManager[k].fcmManagerTopic,
                            title: req.i18n.__(req.i18n.__('bookingStatusTitle')[data.status]),
                            data: { orderId: data.orderId || "" },
                            sound: "OrderSound.wav"
                        },
                        () => { }
                    );
                }
            }
        });
        //send fcm topic push to central

        //send to web socket store dispatch
        // webSocket.publish('stafforderUpdate/' + data.storeId, data, { qos: 2 }, function (mqttErr, mqttRes) {
        // });


        // At most once (0)
        // At least once (1)
        // Exactly once (2).
    }
    function sendEmail(data) {
        // customer.updateOrderCount({ userId: data.customerDetails.customerId, createdBy: createdBy, amount: data.totalAmount }, (err, data) => {
        // });
        let itms = data.Items ? data.Items : [];
        var dynamicItems = [];
        if (config.mailGunService == "true") {
            for (let i = 0; i < itms.length; i++) {
                dynamicItems.push(
                    '<tr style="border-bottom: 2px solid grey;"><td style="width:20%;padding-top: 15px;text-align:center"><img src=' +
                    itms[i].itemImageURL +
                    ' style="max-width: 100px;max-height: 100px;"></td><td style="width:60%;    padding-top: 15px;"><p style="margin:0;font-size: 14px;    font-weight: 600;">' +
                    itms[i].itemName +
                    '</p><p style="margin:0;font-size: 12px;    color: #666;    line-height: 1.6;">' +
                    itms[i].catName +
                    "  <br> " +
                    itms[i].subCatName +
                    "  <br> Sold by: " +
                    data.storeName +
                    '  </p></td><td style="width:20%;font-size: 13px;text-align: center;padding-top: 15px;">' +
                    itms[i].quantity +
                    '</td><td style="width:20%;text-align: right;font-size: 13px;padding-top: 15px;">' +
                    data.currencySymbol +
                    "" +
                    itms[i].unitPrice +
                    "</td></tr>"
                );
            }
            email.getTemplateAndSendEmail(
                {
                    templateName: "orderPlaced.html",
                    toEmail: data.customerDetails.email,
                    trigger: "Order placed",
                    subject: "Order placed successfully.",
                    keysToReplace: {
                        userName: data.customerDetails.name || "",
                        appName: config.appName,
                        orderPlacedDate: moment(moment.unix(data.bookingDateTimeStamp)).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                        addressLine1: (data.drop.flatNumber != "" ? data.drop.flatNumber + "," : "") + (data.drop.landmark != "" ? data.drop.landmark + "," : "") + (data.drop.addressLine1 != "" ? data.drop.addressLine1 + "," : "") + (data.drop.addressLine2 != "" ? data.drop.addressLine2 : ""),
                        addressLine2: (data.drop.city != "" ? data.drop.city + "," : "") + (data.drop.state != "" ? data.drop.state : "") + (data.drop.postalCode != "" ? "-" + data.drop.postalCode : ""),
                        country: data.drop.country,
                        paymentTypeMsg: data.paymentTypeMsg,
                        orderCreationDate: moment(moment.unix(data.bookingDateTimeStamp)).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                        itemsCount: String(data.Items.length),
                        subTotalAmount: data.currencySymbol + "" + data.subTotalAmount,
                        deliveryCharge: data.currencySymbol + "" + data.deliveryCharge,
                        discount: data.currencySymbol + "" + data.discount,
                        tax: data.currencySymbol + "" + data.excTax ? data.excTax : 0,
                        totalAmount: data.currencySymbol + "" + data.totalAmount,
                        pendingAmount:
                            data.paymentType === 2 ? data.currencySymbol + "" + data.totalAmount : data.currencySymbol + "" + 0,
                        orderId: String(data.orderId),
                        storeName: data.storeName,
                        webUrl: data.webUrl,
                        dynamicItems: dynamicItems
                    }
                },
                () => { }
            );
        }

        let customerData = {
            status: parseInt(data.status),
            statusMessage: data.statusMsg,
            statusMsg: data.statusMsg,
            bid: data.orderId
        };

        notifyi.notifyRealTime({ listner: data.customerDetails.mqttTopic, message: customerData });

        notifications.notifyFcmTopic(
            {
                action: 11,
                usertype: 1,
                deviceType: data.customerDetails.deviceType,
                notification: "",
                msg: req.i18n.__(req.i18n.__('bookingStatusMsg')['newOrdercustomer']),
                fcmTopic: data.customerDetails.fcmTopic,
                title: req.i18n.__(req.i18n.__('bookingStatusTitle')['newOrdercustomer']),
                data: customerData
            },
            () => { }
        );
    }
    function sendEmailStore(data) {
        // customer.updateOrderCount({ userId: data.customerDetails.customerId, createdBy: createdBy, amount: data.totalAmount }, (err, data) => {
        // });
        let itms = data.Items ? data.Items : [];
        var dynamicItems = [];
        if (config.mailGunService == "true") {
            for (let i = 0; i < itms.length; i++) {
                dynamicItems.push(
                    '<tr style="border-bottom: 2px solid grey;"><td style="width:20%;padding-top: 15px;text-align:center"><img src=' +
                    itms[i].itemImageURL +
                    ' style="max-width: 100px;max-height: 100px;"></td><td style="width:60%;    padding-top: 15px;"><p style="margin:0;font-size: 14px;    font-weight: 600;">' +
                    itms[i].itemName +
                    '</p><p style="margin:0;font-size: 12px;    color: #666;    line-height: 1.6;">' +
                    itms[i].catName +
                    "  <br> " +
                    itms[i].subCatName +
                    "  <br> Sold by: " +
                    data.storeName +
                    '  </p></td><td style="width:20%;font-size: 13px;text-align: center;padding-top: 15px;">' +
                    itms[i].quantity +
                    '</td><td style="width:20%;text-align: right;font-size: 13px;padding-top: 15px;">' +
                    data.currencySymbol +
                    "" +
                    itms[i].unitPrice +
                    "</td></tr>"
                );
            }
            email.getTemplateAndSendEmail(
                {
                    templateName: "orderPlacedStore.html",
                    toEmail: data.storeOwnerEmail,
                    trigger: "New Order arrived",
                    subject: "New Order arrived",
                    keysToReplace: {
                        ownerName: data.storeOwnerName || "",
                        userName: data.customerDetails.name || "",
                        appName: config.appName,
                        orderPlacedDate: moment(moment.unix(data.bookingDateTimeStamp)).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                        addressLine1: (data.drop.flatNumber != "" ? data.drop.flatNumber + "," : "") + (data.drop.landmark != "" ? data.drop.landmark + "," : "") + (data.drop.addressLine1 != "" ? data.drop.addressLine1 + "," : "") + (data.drop.addressLine2 != "" ? data.drop.addressLine2 : ""),
                        addressLine2: (data.drop.city != "" ? data.drop.city + "," : "") + (data.drop.state != "" ? data.drop.state : "") + (data.drop.postalCode != "" ? "-" + data.drop.postalCode : ""),
                        country: data.drop.country,
                        paymentTypeMsg: data.paymentTypeMsg,
                        orderCreationDate: moment(moment.unix(data.bookingDateTimeStamp)).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                        itemsCount: String(data.Items.length),
                        subTotalAmount: data.currencySymbol + "" + data.subTotalAmount,
                        deliveryCharge: data.currencySymbol + "" + data.deliveryCharge,
                        discount: data.currencySymbol + "" + data.discount,
                        tax: data.currencySymbol + "" + data.excTax ? data.excTax : 0,
                        totalAmount: data.currencySymbol + "" + data.totalAmount,
                        pendingAmount:
                            data.paymentType === 2 ? data.currencySymbol + "" + data.totalAmount : data.currencySymbol + "" + 0,
                        orderId: String(data.orderId),
                        storeName: data.storeName,
                        webUrl: data.webUrl,
                        dynamicItems: dynamicItems
                    }
                },
                () => { }
            );
        }
    }
};

/**
 * A module that exports customer place order!
 * @exports handlerNew
 */
module.exports = { handlerNew };
