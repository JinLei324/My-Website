'use strict'
const childProducts = require('../../../../../models/childProducts');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const async = require('async');
const ObjectId = require('mongodb').ObjectID;
const moment = require('moment');
const googleDistance = require('../../../../commonModels/googleApi');

/** 
* @function
* @name handler 
* @return {object} Reply to the user.
* @param {integer} 1 - preferred store with categories, sub categories; 2 - all stores belonging to that zone  
*/
const handler = (request, reply) => {
    //  request.headers.language = "en"; // remove in last
    let pageIndex = request.params.index;
    let skip = pageIndex * 10;
    let limit = 10;
    let storeIdHome = request.params.storeId;
    if (storeIdHome != "0") {
        storeIdHome = new ObjectId(request.params.storeId)
    }
    childProducts.getFavoriteHome({ type: request.params.type, zoneId: request.params.zoneId, limit: limit, skip: skip, storeId: storeIdHome, userId: request.auth.credentials._id.toString(), offerId: request.params.offerId }, (err, childProduct) => {
        if (err) {
            logger.error('Error occurred while getting getFavoriteHome homepage : ' + err)
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        } else if (childProduct.length > 0) {
            for (var j = 0; j < childProduct.length; j++) {
                childProduct[j].productName = childProduct[j].productname ? childProduct[j].productname[request.headers.language] : "";
                childProduct[j].storeName = childProduct[j].storeName ? childProduct[j].storeName[request.headers.language] : "";
                childProduct[j].storeAddress = childProduct[j].storeAddress ? childProduct[j].storeAddress : "";
                childProduct[j].storeLogo = childProduct[j].profileLogos ? childProduct[j].profileLogos.logoImage : "";
                childProduct[j].bannerImage = childProduct[j].bannerLogos ? childProduct[j].bannerLogos.bannerimage : "";

                childProduct[j].mobileImage = childProduct[j].images ? childProduct[j].images : [];
                childProduct[j].THC = childProduct[j].THC ? childProduct[j].THC : "";
                childProduct[j].sku = childProduct[j].sku ? childProduct[j].sku : "";
                childProduct[j].CBD = childProduct[j].CBD ? childProduct[j].CBD : "";
                childProduct[j].storeLatitude = childProduct[j].storeCoordinates ? childProduct[j].storeCoordinates.latitude : 0;
                childProduct[j].storeLongitude = childProduct[j].storeCoordinates ? childProduct[j].storeCoordinates.longitude : 0;
                childProduct[j].childProductId = childProduct[j]._id ? childProduct[j]._id : "";
                childProduct[j].parentProductId = childProduct[j].parentProductId ? childProduct[j].parentProductId : "";

                childProduct[j].unitId = childProduct[j].units ? childProduct[j].units[0]["unitId"] : "";
                childProduct[j].availableQuantity = childProduct[j].units ? childProduct[j].units[0]["availableQuantity"] : "";
                childProduct[j].unitName = childProduct[j].units ? childProduct[j].units[0]["name"][request.headers.language] : "";
                childProduct[j].priceValue = childProduct[j].units ? parseFloat(childProduct[j].units[0]["price"]["en"]) : 0;

                childProduct[j].appliedDiscount = 0;
                childProduct[j].finalPrice = parseFloat(childProduct[j].priceValue);
                childProduct[j].addOns = childProduct[j].units[0].addOns;


                if (childProduct[j].addOns) {
                    childProduct[j].addOnAvailable = 1;
                } else {
                    childProduct[j].addOnAvailable = 0;
                }

                if (childProduct[j].offer && childProduct[j].offer.length > 0) { // offers
                    logger.error(moment().unix());
                    for (let k = 0; k < childProduct[j].offer.length; k++) {
                        if (childProduct[j].offer[k].status == 1 && childProduct[j].offer[k].endDateTime > moment().unix() && childProduct[j].offer[k].startDateTime < moment().unix()) { //check status and expiry
                            if (childProduct[j].offer[k].discountType == 1) {//check offertype if percentage
                                if (childProduct[j].offer[k].applicableOn == 0) { // if childProduct
                                    childProduct[j].appliedDiscount = (childProduct[j].priceValue / 100) * parseFloat(childProduct[j].offer[k].discountValue);
                                    childProduct[j].finalPrice = (childProduct[j].appliedDiscount > childProduct[j].priceValue) ? 0 : childProduct[j].priceValue - childProduct[j].appliedDiscount;
                                }
                            }
                            if (childProduct[j].offer[k].discountType == 0) {//check offertype if flat discount
                                if (childProduct[j].offer[k].applicableOn == 0) { // if childProduct
                                    childProduct[j].appliedDiscount = parseFloat(childProduct[j].offer[k].discountValue);
                                    // childProduct[j].finalPrice = childProduct[j].priceValue - childProduct[j].appliedDiscount;
                                    childProduct[j].finalPrice = (childProduct[j].appliedDiscount > childProduct[j].priceValue) ? 0 : childProduct[j].priceValue - childProduct[j].appliedDiscount;

                                }
                            }
                        }
                    }
                }

                childProduct[j].units = childProduct[j].units ? childProduct[j].units : [];
                delete childProduct[j].profileLogos;
                delete childProduct[j].images;
                delete childProduct[j].units;
                delete childProduct[j]._id;
                delete childProduct[j].storeCoordinates;
            }
            return reply({ message: request.i18n.__('shoppingList')['200'], data: childProduct }).code(200);
        } else
            return reply({ message: request.i18n.__('shoppingList')['404'] }).code(404);
    });

}
const validator = {
    storeId: Joi.string().required().description('storeId').default("5a704f24e0dc3f34c350b22d"),
    zoneId: Joi.string().required().description('zoneId').default("5a704f24e0dc3f34c350b22d"),
    index: Joi.number().integer().required().description('index'),
    type: Joi.number().integer().max(3).required().description('0-favorites, 1- trending,2 offers, 3-brand'),
    offerId: Joi.string().required().description('offerId').default("5a704f24e0dc3f34c350b22d")
}
/**
* A module that exports business get store handler, validator!
* @exports validator
* @exports handler 
*/

const arrayWiseProducts = {
    storeId: Joi.string().min(24).max(24).required().description('storeId').default("5a704f24e0dc3f34c350b22d"),
    zoneId: Joi.string().required().description('zoneId').default("5a704f24e0dc3f34c350b22d"),
    index: Joi.number().integer().required().description('index'),
    type: Joi.number().integer().max(3).required().description('0-brand, 1- offers')
}

const arrayWiseProdHandler = (request, reply) => {
    //  request.headers.language = "en"; // remove in last
    let pageIndex = request.params.index || 0;
    let skip = pageIndex * 30;
    let limit = 30;
    childProducts.getWishItems([
        { $match: { "storeId": new ObjectId(request.params.storeId), status: 1 } },
        { $lookup: { "from": "stores", "localField": "storeId", "foreignField": "_id", "as": "stores" } },
        { $unwind: "$stores" },
        {
            $project: {
                brand: 1, units: 1, profileLogos: "$stores.profileLogos", bannerImage: "$stores.bannerLogos",
                THC: 1, CBD: 1, _id: 1, productName: 1, productname: 1, offer: 1, price: 1, storeId: 1, images: 1, parentProductId: 1, upc: 1, sku: 1, currency: 1, currencySymbol: 1,
                priceValue: 1, storeName: "$stores.sName", storeAddress: "$stores.storeAddr", storeLogo: "$stores.images", storeCoordinates: "$stores.coordinates"
            }
        },
        {
            $group:
            {
                _id: "$brand",
                brand: { "$first": "$brand" },
                childProduct: {
                    $push:
                    {
                        units: "$units", _id: "$_id", profileLogos: "$profileLogos", bannerImage: "$bannerImage",
                        THC: "$THC", CBD: "$CBD", productName: "$productName", productname: "$productname", offer: "$offer", price: "$price", storeId: "$storeId", images: "$images", parentProductId: "$parentProductId", upc: "$upc", sku: "$sku", currency: "$currency", currencySymbol: "$currencySymbol",
                        priceValue: "$priceValue", storeName: "$storeName", storeAddress: "$storeAddress", storeLogo: "$storeLogo", storeCoordinates: "$storeCoordinates"

                    }
                }
            }
        },
        { $lookup: { "from": "brands", "localField": "brand", "foreignField": "_id", "as": "brands" } },
        { $unwind: "$brands" },
        { $match: { "brands.status": 1 } },
        {
            $project: {
                brandName: "$brands.name",
                description: "$brands.description",
                images: "$brands.images",
                bannerImage: "$brands.bannerImage",
                logoImage: "$brands.logoImage",
                units: 1, profileLogos: 1, bannerImage: 1,
                THC: 1, CBD: 1, productName: 1, productname: 1, offer: 1, price: 1, storeId: 1, images: 1, parentProductId: 1, upc: 1, sku: 1, currency: 1, currencySymbol: 1,
                priceValue: 1, storeName: 1, storeAddress: 1, storeLogo: 1, storeCoordinates: 1,
                childProduct: 1, _id: 1

            }
        },
        { $skip: skip },
        { $limit: limit }
    ], (err, brand) => {
        if (err) {
            logger.error('Error occurred while getting getFavoriteHome homepage : ' + err)
            // return reply({ message: error['genericErrMsg']['500'][request.headers.language] }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        } else if (brand.length > 0) {
            let finalProducts = [];
            for (var i = 0; i < brand.length; i++) {
                brand[i].brandName = brand[i].brandName ? brand[i].brandName[request.headers.language] : "";
                brand[i].description = brand[i].description ? brand[i].description[request.headers.language] : "";
                for (var j = 0; j < brand[i].childProduct.length; j++) {


                    brand[i].childProduct[j].outOfStock = true;
                    /**removing out of stock items */
                    let unitsToPush = [];
                    for (var k = 0; k < brand[i].childProduct[j].units.length; k++) {
                        if (brand[i].childProduct[j].units[k].availableQuantity > 0) {

                            unitsToPush.push(brand[i].childProduct[j].units[k]);
                        }
                    }
                    brand[i].childProduct[j].newUnits = unitsToPush;
                    if (unitsToPush.length > 0) {
                        brand[i].childProduct[j].outOfStock = false;
                        // finalProducts.push(brand[i].childProduct[j]); // seful to remove outofstock items
                    }
                    brand[i].childProduct[j].productName = brand[i].childProduct[j].productname ? brand[i].childProduct[j].productname[request.headers.language] : "";
                    brand[i].childProduct[j].storeName = brand[i].childProduct[j].storeName ? brand[i].childProduct[j].storeName[request.headers.language] : "";
                    brand[i].childProduct[j].storeAddress = brand[i].childProduct[j].storeAddress ? brand[i].childProduct[j].storeAddress : "";
                    brand[i].childProduct[j].storeLogo = brand[i].childProduct[j].profileLogos ? brand[i].childProduct[j].profileLogos.logoImage : "";
                    brand[i].childProduct[j].bannerImage = brand[i].childProduct[j].bannerLogos ? brand[i].childProduct[j].bannerLogos.bannerimage : "";

                    brand[i].childProduct[j].mobileImage = brand[i].childProduct[j].images ? brand[i].childProduct[j].images : [];
                    brand[i].childProduct[j].currency = brand[i].childProduct[j].currency ? brand[i].childProduct[j].currency : "";
                    brand[i].childProduct[j].currencySymbol = brand[i].childProduct[j].currencySymbol ? brand[i].childProduct[j].currencySymbol : "";
                    brand[i].childProduct[j].THC = brand[i].childProduct[j].THC ? brand[i].childProduct[j].THC : "";
                    brand[i].childProduct[j].sku = brand[i].childProduct[j].sku ? brand[i].childProduct[j].sku : "";
                    brand[i].childProduct[j].CBD = brand[i].childProduct[j].CBD ? brand[i].childProduct[j].CBD : "";
                    brand[i].childProduct[j].storeLatitude = brand[i].childProduct[j].storeCoordinates ? brand[i].childProduct[j].storeCoordinates.latitude : 0;
                    brand[i].childProduct[j].storeLongitude = brand[i].childProduct[j].storeCoordinates ? brand[i].childProduct[j].storeCoordinates.longitude : 0;
                    brand[i].childProduct[j].productId = brand[i].childProduct[j]._id ? brand[i].childProduct[j]._id.toString() : "";
                    brand[i].childProduct[j].childProductId = brand[i].childProduct[j]._id ? brand[i].childProduct[j]._id.toString() : "";
                    brand[i].childProduct[j].parentProductId = brand[i].childProduct[j].parentProductId ? brand[i].childProduct[j].parentProductId : "";

                    brand[i].childProduct[j].unitId = brand[i].childProduct[j].newUnits.length > 0 ? brand[i].childProduct[j].newUnits[0]["unitId"] : brand[i].childProduct[j].units[0]["unitId"];
                    brand[i].childProduct[j].unitName = brand[i].childProduct[j].newUnits.length > 0 ? brand[i].childProduct[j].newUnits[0]["name"][request.headers.language] : brand[i].childProduct[j].units[0]["name"][request.headers.language];
                    brand[i].childProduct[j].mrp = brand[i].childProduct[j].newUnits.length > 0 ? brand[i].childProduct[j].newUnits[0]["mrp"] : brand[i].childProduct[j].units[0]["mrp"];
                    brand[i].childProduct[j].priceValue = brand[i].childProduct[j].newUnits.length > 0 ? parseFloat(brand[i].childProduct[j].newUnits[0]["price"]["en"]) : parseFloat(brand[i].childProduct[j].units[0]["price"]["en"]);
                    brand[i].childProduct[j].appliedDiscount = 0;
                    brand[i].childProduct[j].finalPrice = parseFloat(brand[i].childProduct[j].priceValue);
                    if (brand[i].childProduct[j].offer && brand[i].childProduct[j].offer.length > 0) { // offers
                        logger.error(moment().unix());
                        for (let k = 0; k < brand[i].childProduct[j].offer.length; k++) {
                            if (brand[i].childProduct[j].offer[k].status == 1 && brand[i].childProduct[j].offer[k].endDateTime > moment().unix() && brand[i].childProduct[j].offer[k].startDateTime < moment().unix()) { //check status and expiry
                                if (brand[i].childProduct[j].offer[k].discountType == 1) {//check offertype if percentage
                                    if (brand[i].childProduct[j].offer[k].applicableOn == 0) { // if brand[i].childProduct
                                        brand[i].childProduct[j].appliedDiscount = (brand[i].childProduct[j].priceValue / 100) * parseFloat(brand[i].childProduct[j].offer[k].discountValue);
                                        brand[i].childProduct[j].finalPrice = (brand[i].childProduct[j].appliedDiscount > brand[i].childProduct[j].priceValue) ? 0 : brand[i].childProduct[j].priceValue - brand[i].childProduct[j].appliedDiscount;
                                    }
                                }
                                if (brand[i].childProduct[j].offer[k].discountType == 0) {//check offertype if flat discount
                                    if (brand[i].childProduct[j].offer[k].applicableOn == 0) { // if brand[i].childProduct
                                        brand[i].childProduct[j].appliedDiscount = parseFloat(brand[i].childProduct[j].offer[k].discountValue);
                                        // brand[i].childProduct[j].finalPrice = brand[i].childProduct[j].priceValue - brand[i].childProduct[j].appliedDiscount;
                                        brand[i].childProduct[j].finalPrice = (brand[i].childProduct[j].appliedDiscount > brand[i].childProduct[j].priceValue) ? 0 : brand[i].childProduct[j].priceValue - brand[i].childProduct[j].appliedDiscount;

                                    }
                                }
                            }
                        }
                    }

                    brand[i].childProduct[j].units = brand[i].childProduct[j].units ? brand[i].childProduct[j].units : [];
                    delete brand[i].childProduct[j].profileLogos;
                    delete brand[i].childProduct[j].images;
                    // delete brand[i].childProduct[j].units;
                    delete brand[i].childProduct[j]._id;
                    delete brand[i].childProduct[j].storeCoordinates;


                    delete brand[i].childProduct[j].units;
                    delete brand[i].childProduct[j].productname;
                    delete brand[i].childProduct[j].productname;
                    delete brand[i].childProduct[j].newUnits;



                }
            }
            return reply({ message: request.i18n.__('shoppingList')['200'], data: brand }).code(200);
        } else
            return reply({ message: request.i18n.__('shoppingList')['404'] }).code(404);
    });

}

module.exports = { handler, validator, arrayWiseProducts, arrayWiseProdHandler }
