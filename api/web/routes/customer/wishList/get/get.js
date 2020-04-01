
'use strict'
const wishList = require('../../../../../models/wishList');
const childProducts = require('../../../../../models/childProducts');
const zones = require('../../../../../models/zones');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');//date-time
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    let condition = [];
    let modelName;
    if (request.params.listId == 0) {
        if (request.params.storeId == 0) {
            condition = [
                { $match: { "userId": request.auth.credentials._id.toString(), status: 0, zoneId: request.params.zoneId } },
                { $project: { name: 1, image: 1, storeId: 1, zoneId: 1 } }
            ];
        } else {
            condition = [
                { $match: { "userId": request.auth.credentials._id.toString(), status: 0, storeId: request.params.storeId } },
                { $project: { name: 1, image: 1, storeId: request.params.storeId } }
            ];
        }
        modelName = wishList;
    } else {
        // condition = [
        //     { $match: { "wishList.listId": { $in: [request.params.listId] } } },
        //     { $lookup: { "from": "stores", "localField": "storeId", "foreignField": "_id", "as": "stores" } },
        //     { $unwind: "$stores" },
        //     {
        //         $project: {
        //             THC: 1, CBD: 1, productName: 1, price: 1, storeId: 1, images: 1, parentProductId: 1, upc: 1, sku: 1, currency: 1,
        //             priceValue: 1, storeName: "$stores.name", storeAddress: "$stores.businessAddress", storeLogo: "$stores.images", storeCoordinates: "$stores.coordinates"
        //         }
        //     }
        // ]; // old

        if (request.params.storeId == 0) {
            condition = [
                { $match: { "userId": request.auth.credentials._id.toString(), status: 0, "_id": new ObjectID(request.params.listId) } },
                { $unwind: "$products" },
                { $match: { "products.status": 0 } },
                { $lookup: { "from": "childProducts", "localField": "products.childProductId", "foreignField": "_id", "as": "childProducts" } },
                { $unwind: "$childProducts" },
                { $lookup: { "from": "stores", "localField": "childProducts.storeId", "foreignField": "_id", "as": "stores" } },
                { $unwind: "$stores" },
                {
                    $project: {
                        THC: "$childProducts.THC", CBD: "$childProducts.CBD", productName: "$childProducts.productname", units: "$childProducts.units", storeId: "$childProducts.storeId", images: "$childProducts.images",
                        childProductId: "$childProducts._id",
                        addOns: "$childProducts.addOns",
                        parentProductId: "$childProducts.parentProductId", upc: "$childProducts.upc", sku: "$childProducts.sku",
                        storeName: "$stores.sName", storeAddress: "$stores.storeAddr", storeLogo: "$stores.profileLogos.logoImage", storeBanner: "$stores.bannerLogos.bannerimage", storeCoordinates: "$stores.coordinates", offer: "$childProducts.offer"
                    }
                }

            ];
        } else {

            condition = [
                { $match: { "userId": request.auth.credentials._id.toString(), status: 0, "_id": new ObjectID(request.params.listId), storeId: request.params.storeId } },
                { $unwind: "$products" },
                { $match: { "products.status": 0 } },
                { $lookup: { "from": "childProducts", "localField": "products.childProductId", "foreignField": "_id", "as": "childProducts" } },
                { $unwind: "$childProducts" },
                { $lookup: { "from": "stores", "localField": "childProducts.storeId", "foreignField": "_id", "as": "stores" } },
                { $unwind: "$stores" },
                { $match: { "stores._id": request.params.storeId ? new ObjectID(request.params.storeId) : "" } },
                {
                    $project: {
                        THC: "$childProducts.THC", CBD: "$childProducts.CBD", productName: "$childProducts.productname", units: "$childProducts.units", storeId: "$childProducts.storeId", images: "$childProducts.images",
                        childProductId: "$childProducts._id",
                        addOns: "$childProducts.addOns",
                        parentProductId: "$childProducts.parentProductId", upc: "$childProducts.upc", sku: "$childProducts.sku",
                        storeName: "$stores.sName", storeAddress: "$stores.storeAddr", storeLogo: "$stores.profileLogos.logoImage", storeBanner: "$stores.bannerLogos.bannerimage", storeCoordinates: "$stores.coordinates", offer: "$childProducts.offer"
                    }
                }

            ];
        }
        modelName = wishList;
    }

    // db.getCollection('childProducts').aggregate(
    //     [
    //                 { $match: { "units.wishList.listId": { $in: ["5a631bef8fda607b53ffea7d","5a631bef8fda607b53ffea7d"] }  } },
    //                 { $lookup: { "from": "stores", "localField": "storeId", "foreignField": "_id", "as": "stores" } },
    //                 { $unwind: "$stores" },
    //                 {
    //                     $project: {
    //                         THC: 1, CBD: 1, productName: 1, price: 1, storeId: 1, thumbImage: 1, mobileImage: 1, parentProductId: 1, unitId: 1, upc: 1, sku: 1, currency: 1,
    //                         priceValue: 1, storeName: "$stores.name", storeAddress: "$stores.businessAddress", storeLogo: "$stores.images", storeCoordinates: "$stores.coordinates"
    //                     }
    //                 }
    //             ])

    modelName.getWishItems(condition, (err, list) => {
        if (err) {
            logger.error('Error occurred while getting wishList : ' + err)
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        } else if (list.length > 0) {
            if (request.params.listId == 0)
                for (let j = 0; j < list.length; j++) {
                    list[j].listName = list[j].name ? list[j].name : "";
                    list[j].listId = list[j]._id.toString();
                    list[j].listImage = list[j].image ? list[j].image : "";
                    delete list[j]._id;
                    delete list[j].name;
                    delete list[j].image;
                }
            else
                for (let j = 0; j < list.length; j++) {
                    list[j].productName = list[j].productName ? list[j].productName[request.headers.language] : "";
                    list[j].storeName = list[j].storeName ? list[j].storeName[request.headers.language] : "";
                    list[j].storeAddress = list[j].storeAddress ? list[j].storeAddress : "";
                    list[j].storeLogo = list[j].storeLogo ? list[j].storeLogo : "";
                    list[j].unitId = list[j].units ? list[j].units[0]["unitId"] : "";
                    list[j].availableQuantity = list[j].units ? list[j].units[0]["availableQuantity"] : 0;
                    list[j].unitName = list[j].units ? list[j].units[0]["name"]["en"] : "";
                    list[j].priceValue = list[j].units ? list[j].units[0]["price"]["en"] : 0;
                    list[j].appliedDiscount = 0;
                    list[j].finalPrice = parseFloat(list[j].priceValue);
                    list[j].offerId = "";

                    if (list[j].units[0].addOns && list[j].units[0].addOns.length > 0) {
                        list[j].addOnAvailable = 1;
                    } else {
                        list[j].addOnAvailable = 0;
                    }

                    if (list[j].offer && list[j].offer.length > 0) { // offers
                        for (let k = 0; k < list[j].offer.length; k++) {
                            if (list[j].offer[k].status == 1 && list[j].offer[k].endDateTime > moment().unix() && list[j].offer[k].startDateTime < moment().unix()) { //check status and expiry
                                if (list[j].offer[k].discountType == 1) {//check offertype if percentage
                                    // if (list[j].offer[k].applicableOn == 0) { // if list
                                    list[j].appliedDiscount = (list[j].priceValue / 100) * parseFloat(list[j].offer[k].discountValue);
                                    list[j].offerId = list[j].offer[k].offerId ? list[j].offer[k].offerId : "";
                                    // list[j].finalPrice = list[j].priceValue - list[j].appliedDiscount;
                                    list[j].finalPrice = (list[j].appliedDiscount > list[j].priceValue) ? 0 : list[j].priceValue - list[j].appliedDiscount;
                                    // }
                                }
                                if (list[j].offer[k].discountType == 0) {//check offertype if flat discount
                                    // if (list[j].offer[k].applicableOn == 0) { // if list
                                    list[j].appliedDiscount = parseFloat(list[j].offer[k].discountValue);
                                    list[j].offerId = list[j].offer[k].offerId ? list[j].offer[k].offerId : "";
                                    list[j].finalPrice = (list[j].appliedDiscount > list[j].priceValue) ? 0 : list[j].priceValue - list[j].appliedDiscount;
                                    // childProduct[j].finalPrice = (childProduct[j].appliedDiscount > childProduct[j].priceValue) ? 0 : childProduct[j].priceValue - childProduct[j].appliedDiscount;
                                }
                                // }


                            }
                        }
                    }


                    list[j].mobileImage = list[j].images ? list[j].images : [];
                    list[j].THC = list[j].THC ? list[j].THC : "";
                    list[j].sku = list[j].sku ? list[j].sku : "";
                    list[j].CBD = list[j].CBD ? list[j].CBD : "";
                    list[j].storeLatitude = list[j].storeCoordinates.latitude ? list[j].storeCoordinates.latitude : 0;
                    list[j].storeLongitude = list[j].storeCoordinates.longitude ? list[j].storeCoordinates.longitude : 0;
                    list[j].childProductId = list[j].childProductId ? list[j].childProductId : "";
                    list[j].parentProductId = list[j].parentProductId ? list[j].parentProductId : "";
                    delete list[j]._id;
                    delete list[j].images;
                    delete list[j].units;
                    delete list[j].storeCoordinates;
                }
            // return reply({ message: error['wishList']['200'][request.headers.language], data: list }).code(200);
            return reply({ message: request.i18n.__('wishList')['200'], data: list }).code(200);
        } else
            // return reply({ message: error['wishList']['404'][request.headers.language] }).code(404);
            return reply({ message: request.i18n.__('wishList')['404'] }).code(404);
    });

}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    zoneId: Joi.string().required().description('string'),
    listId: Joi.string().required().description('string if all wishlist 0 else list details(items)'),
    storeId: Joi.string().required().description('string if all stores 0 else storeId wise wish list will show')

}

/**
* A module that exports customer favorites! 
* @exports handler 
*/
module.exports = { validator, handler }