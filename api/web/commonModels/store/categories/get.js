'use strict'
const stores = require('../../../../models/stores');
const storeElastic = require('../../../../models/storeElastic');
const storeCategory = require('../../../../models/storeCategory');
const customer = require('../../../../models/customer');
const offers = require('../../../../models/offers');
const zones = require('../../../../models/zones');
const storeList = require('../../../../models/storeList');
const error = require('../../../../statusMessages/responseMessage'); // response messages based on language 
const config = process.env;
const googleDistance = require('../../../commonModels/googleApi');
const workingHour = require('../../../commonModels/workingHour');
const Joi = require('joi');
const logger = require('winston');
const async = require('async');
const ObjectId = require('mongodb').ObjectID;
const moment = require('moment');

/** 
 * @function
 * @name handler 
 * @return {object} Reply to the user.
 * @param {data} 0 - name, 1 - email, 2 - mobile
 */
const handler = (request, reply) => {
    stores.getStoreCategoriesById({

        id: new ObjectId(request.params.storeId)

    }, (err, result) => {

        if (err) {

            logger.error('Error occurred during get categories (getStoreCategoriesById): ' + JSON.stringify(err));
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);

        }

        if (result.length > 0) {

            for (var j = 0; j < result.length; j++) {

                result[j].categoryName = result[j].categoryName ? result[j].categoryName[request.headers.language] : "";
                result[j].description = result[j].description ? result[j].description[request.headers.language] : "";
                delete result[j]._id;

                for (var k = 0; k < result[j].subCategories.length; k++) {
                    result[j].subCategories[k].subCategoryName = result[j].subCategories[k].name ? result[j].subCategories[k].name[request.headers.language] : "";
                    result[j].subCategories[k].description = result[j].subCategories[k].description ? result[j].subCategories[k].description[request.headers.language] : "";
                    result[j].subCategories[k].subCategoryId = result[j].subCategories[k]._id ? result[j].subCategories[k]._id : "";
                    delete result[j].subCategories[k]._id;
                    delete result[j].subCategories[k].name;
                    delete result[j].subCategories[k].categoryId;
                    delete result[j].subCategories[k].seqId;
                    delete result[j].subCategories[k].visibility;
                }
            }
            return reply({
                message: request.i18n.__('stores')['200'],
                data: result
            }).code(200);
        } else {
            return reply({
                message: request.i18n.__('stores')['404']
            }).code(404);
        }
    });
}
/** 
 * @function
 * @name storeCategoryHandler 
 * @return {object} Reply to the user.
 * @param {data} 0 - name, 1 - email, 2 - mobile
 */
const storeCategoryHandler = (request, reply) => {

    storeCategory.getStoreCategories({

        visibility: 1,
        availableInCities: { $in: [request.params.cityId] }

    }, (err, result) => {

        if (err) {

            logger.error('Error occurred during get categories (getStoreCategoriesById): ' + JSON.stringify(err));
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        }

        if (result.length > 0) {
            for (var j = 0; j < result.length; j++) {

                result[j].categoryName = result[j].storeCategoryName ? result[j].storeCategoryName[request.headers.language] : "";
                //result[j].categoryName = "123";
                result[j].description = result[j].storeCategoryDescription ? result[j].storeCategoryDescription[request.headers.language] : "";
                result[j].bannerImage = result[j].bannerImage ? result[j].bannerImage : "";
                result[j].logoImage = result[j].logoImage ? result[j].logoImage : "";
                result[j].iconlogoimg = result[j].iconlogoimg ? result[j].iconlogoimg : "";
                result[j].backgroundImage = result[j].backgroundImage ? result[j].backgroundImage : "";
                result[j].type = result[j].type ? result[j].type : 1;
                result[j].typeMsg = result[j].typeMsg ? result[j].typeMsg : "";
                result[j].catTypeGif = result[j].catTypeGif ? result[j].catTypeGif : "";
                result[j].colorCode = result[j].colorCode ? result[j].colorCode : "";

                // delete result[j]._id;
                delete result[j].storeCategoryName;
                delete result[j].storeCategoryDescription;
                delete result[j].name;
                delete result[j].availableInCities;

            }
            return reply({
                message: request.i18n.__('stores')['200'],
                data: result
            }).code(200);
        } else {
            return reply({
                message: request.i18n.__('stores')['404']
            }).code(404);
        }
    });
}
/** 
 * @function
 * @name storeCategoryHandlerById 
 * @return {object} Reply to the user.
 * @param {data} 0 - name, 1 - email, 2 - mobile
 */
const storeCategoryHandlerFavourite = (request, reply) => {
    var storeData = [];
    var offerData = [];
    var favStoreData = [];

    // zones.inZone({

    //     lat: request.params.latitude,
    //     long: request.params.longitude

    // }, (zoneError, zoneResult) => {

    // if (!error && zoneResult.length > 0) {
    //     var storeParams = {
    //         type: request.params.type,
    //         long: request.params.longitude,
    //         lat: request.params.latitude,
    //         businessZoneId : zoneResult._id.toString()

    //     } 
    // }else{ 
    var storeParams = {
        type: request.params.type,
        long: request.params.long,
        lat: request.params.lat,
        categoryId: request.params.categoryId,
        zoneId: request.params.zoneId,
        // offset: (request.params.offset * request.params.limit),
        // limit: request.params.limit

    }


    // }

    stores.getAllByCategoryFavourite(storeParams, (err, result) => {

        if (err) {
            logger.error('Error occurred during get categories (getStoreCategoriesById): ' + JSON.stringify(err));
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);

        }

        if (result.length > 0) {

            async.eachSeries(result, (item, callback) => {
                offers.getStoreOffersByStoreId({
                    storeId: item._id.toString(),
                    status: 1
                }, (error, response) => {

                    if (response && response.length > 0) {

                        var storeOffer = 1;

                        if (response[0].status == 1 && response[0].endDateTime > moment().unix() && response[0].startDateTime < moment().unix()) {

                            var offerTitle = response[0].name.en;
                            var offerBanner = response[0].images;
                            var offerId = response[0]._id.toString();
                        } else {
                            var offerTitle = "";
                            var offerBanner = {};
                            var offerId = "";
                        }


                    } else {

                        var storeOffer = 0;
                        var offerId = "";
                        var offerTitle = "";
                        var offerBanner = {};
                    }
                    var storeSubCats = [];
                    if (item.storeSubCategory) {
                        async.each(item.storeSubCategory, (storeSubCategoryDetails, callback) => {
                            var storeSubCat = {
                                id: storeSubCategoryDetails.subCategoryId,
                                subCategoryName: storeSubCategoryDetails.subCategoryName.en
                            }
                            storeSubCats.push(storeSubCat)

                        });
                    }
                    item.distanceMiles = 0;
                    item.distanceKm = 0;
                    item.estimatedTime = 0;
                    let dest = item.coordinates.latitude + ',' + item.coordinates.longitude;
                    let origin = request.params.lat + ',' + request.params.long;

                    workingHour.workingHourCheck(item._id.toString(), (err, workingResult) => {
                        // resolve(true);

                        googleDistance.calculateDistance(origin, dest).then(distanceMeasured => {
                            let result = distanceMeasured.distance;
                            result *= 0.000621371192;
                            distanceMeasured.distanceMiles = result;
                            item.distanceMiles = result;
                            item.distanceKm = distanceMeasured.distance / 1000;
                            item.estimatedTime = distanceMeasured.durationMins;
                            delete item.coordinates;

                            //  item.distance *= 0.000621371192


                            storeList.isExistsWithStore({ userId: request.auth.credentials._id.toString(), storeId: item._id.toString() }, (err, isStore) => {
                                if (err) {
                                    logger.error('Error occurred while checking storeList : ' + err);
                                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                                }
                                if (isStore.length > 0) {
                                    if (parseInt(isStore[0].storeList.status) == 0) {
                                        favStoreData.push({
                                            storeName: item.sName ? item.sName[request.headers.language] : "",
                                            storeDescription: item.storedescription ? item.storedescription[request.headers.language] : "",
                                            bannerImage: item.bannerLogos ? item.bannerLogos.bannerimage : "",
                                            logoImage: item.profileLogos ? item.profileLogos.logoImage : "",
                                            type: item.type ? item.type : 1,
                                            typeMsg: item.typeMsg ? item.typeMsg : "",
                                            storeId: item._id ? item._id.toString() : "",
                                            franchiseId: item.franchiseId ? item.franchiseId : "",
                                            franchiseName: item.franchiseName ? item.franchiseName : "",
                                            distance: item.distanceKm,
                                            distanceMiles: item.distanceMiles,
                                            storeTypeMsg: item.storeTypeMsg,
                                            storeType: item.storeType,
                                            cartsAllowed: item.cartsAllowed,
                                            cartsAllowedMsg: item.cartsAllowedMsg,
                                            freeDeliveryAbove: item.freeDeliveryAbove,
                                            minimumOrder: item.minimumOrder,
                                            storeBillingAddr: item.storeBillingAddr,
                                            storeAddr: item.storeAddr,
                                            streetName: item.streetName ? item.streetName : "",
                                            localityName: item.localityName ? item.streetName : "",
                                            areaName: item.areaName ? item.areaName : "",
                                            addressCompo: item.addressCompo ? item.addressCompo : {},
                                            storeOffer: storeOffer,
                                            offerId: offerId,
                                            offerTitle: offerTitle,
                                            offerBanner: offerBanner,
                                            foodType: item.foodType ? item.foodType : 0,
                                            foodTypeName: item.foodTypeName ? item.foodTypeName : "",
                                            costForTwo: item.costForTwo ? item.costForTwo : 0,
                                            avgDeliveryTime: item.avgDeliveryTime ? item.avgDeliveryTime : 0,
                                            averageRating: item.averageRating ? item.averageRating : 0,
                                            storeSubCats: storeSubCats,
                                            storeIsOpen: workingResult['storeIsOpen'],
                                            nextOpenTime: workingResult['nextOpenTime'],
                                            nextCloseTime: workingResult['nextCloseTime'],
                                            today: workingResult['today']
                                        })
                                    }
                                }
                                // logger.error('Error occurred during view all stores get (calculateDistance): ' + JSON.stringify(err));
                                // return reply({ message: error['stores']['200'][request.headers.language], data: data }).code(200);
                                callback(null);

                            });

                            // callback(null);
                        }).catch((err) => {
                            storeList.isExistsWithStore({ userId: request.auth.credentials._id.toString(), storeId: item._id.toString() }, (err, isStore) => {
                                if (err) {
                                    logger.error('Error occurred while checking storeList : ' + err);
                                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                                }
                                if (isStore.length > 0) {
                                    if (parseInt(isStore[0].storeList.status) == 0) {
                                        favStoreData.push({
                                            storeName: item.sName ? item.sName[request.headers.language] : "",
                                            storeDescription: item.storedescription ? item.storedescription[request.headers.language] : "",
                                            bannerImage: item.bannerLogos ? item.bannerLogos.bannerimage : "",
                                            logoImage: item.profileLogos ? item.profileLogos.logoImage : "",
                                            type: item.type ? item.type : 1,
                                            typeMsg: item.typeMsg ? item.typeMsg : "",
                                            storeId: item._id ? item._id.toString() : "",
                                            franchiseId: item.franchiseId ? item.franchiseId : "",
                                            franchiseName: item.franchiseName ? item.franchiseName : "",
                                            distance: item.distance,
                                            distanceMiles: item.distanceMiles,
                                            storeTypeMsg: item.storeTypeMsg,
                                            storeType: item.storeType,
                                            cartsAllowed: item.cartsAllowed,
                                            cartsAllowedMsg: item.cartsAllowedMsg,
                                            freeDeliveryAbove: item.freeDeliveryAbove,
                                            minimumOrder: item.minimumOrder,
                                            storeBillingAddr: item.storeBillingAddr,
                                            storeAddr: item.storeAddr,
                                            streetName: item.streetName ? item.streetName : "",
                                            localityName: item.localityName ? item.localityName : "",
                                            areaName: item.areaName ? item.areaName : "",
                                            addressCompo: item.addressCompo ? item.addressCompo : {},
                                            storeOffer: storeOffer,
                                            offerId: offerId,
                                            offerTitle: offerTitle,
                                            offerBanner: offerBanner,
                                            foodType: item.foodType ? item.foodType : 0,
                                            foodTypeName: item.foodTypeName ? item.foodTypeName : "",
                                            costForTwo: item.costForTwo ? item.costForTwo : 0,
                                            avgDeliveryTime: item.avgDeliveryTime ? item.avgDeliveryTime : 0,
                                            averageRating: item.averageRating ? item.averageRating : 0,
                                            storeSubCats: storeSubCats,
                                            storeIsOpen: workingResult['storeIsOpen'],
                                            nextOpenTime: workingResult['nextOpenTime'],
                                            nextCloseTime: workingResult['nextCloseTime'],
                                            today: workingResult['today']
                                        })
                                    }
                                }
                                logger.error('Error occurred during view all stores get (calculateDistance): ' + JSON.stringify(err));
                                // return reply({ message: error['stores']['200'][request.headers.language], data: data }).code(200);
                                callback(null);

                            });

                        });
                    });

                })

                // stores.getStoreOffersByStoreId()
            }, function (error2) {
                if (error2) {
                }
                return reply({
                    message: request.i18n.__('stores')['200'],
                    data: favStoreData,
                }).code(200);
            })
        } else {
            return reply({
                message: request.i18n.__('stores')['404']
            }).code(404);
        }
    });


    // })
}

/** 
 * @function
 * @name storeCategoryHandlerById 
 * @return {object} Reply to the user.
 * @param {data} 0 - name, 1 - email, 2 - mobile
 */

const storeCategoryHandlerById = (request, reply) => {

    var storeData = [];
    var offerData = [];
    var favStoreData = [];

    var storeParams = {
        type: request.params.type,
        long: request.params.long,
        lat: request.params.lat,
        categoryId: request.params.categoryId,
        zoneId: request.params.zoneId,
        offset: (request.params.offset * request.params.limit),
        limit: request.params.limit
    }
    var zoneParams = {
        "storeType": request.params.type,
        "zones": {
            $in: [request.params.zoneId]
        },
        status: 1
    }

    // }
    offers.read(zoneParams, (err, result) => {

        if (err) {
            logger.error('Error occurred during get categories (getStoreCategoriesById): ' + JSON.stringify(err));
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        }
        if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                result[i].name = result[i].name ? result[i].name[request.headers.language] : "";
                result[i].offerId = result[i]._id.toString();
                result[i].description = result[i].description ? result[i].description[request.headers.language] : "";
                result[i].storeName = result[i].sName ? result[i].sName[request.headers.language] : "";
                result[i].storeAddress = result[i].storeAddr ? result[i].storeAddr : "";
                result[i].storeLogo = result[i].StoreProfileLogo ? result[i].StoreProfileLogo.logoImage : "";
                result[i].storeLat = result[i].storeCoordinates ? result[i].storeCoordinates.latitude : "";
                result[i].storeLong = result[i].storeCoordinates ? result[i].storeCoordinates.longitude : "";
                delete result[i].sName;
                delete result[i].storeAddr;
                delete result[i].StoreProfileLogo;
                delete result[i].storeName;
                delete result[i].storeCoordinates;
                offerData.push(result[i]);
            }
        }
        storeElastic.getAllByCategoryId(storeParams, (err, result) => {

            if (err) {
                logger.error('Error occurred during get categories (getStoreCategoriesById): ' + JSON.stringify(err));
                return reply({
                    message: request.i18n.__('genericErrMsg')['500']
                }).code(500);

            }

            if (result.length > 0) {
                async.each(result, (item, callback) => {
                    let storeOffer = 0;
                    let offerId = '';
                    let offerTitle = '';
                    let offerBanner = '';
                    if (typeof item['_source'].offer != "undefined") {
                        for (var k = 0; k < item['_source'].offer.length; k++) {
                            if (parseInt(item['_source'].offer[k].status) == 1) {
                                offerTitle = item['_source'].offer[k].offerName ? item['_source'].offer[k].offerName[request.headers.language] : "";
                                offerBanner = item['_source'].offer[k].images ? item['_source'].offer[k].images['image'] : "";
                                offerId = item['_source'].offer[k].offerId ? item['_source'].offer[k].offerId.toString() : "";
                                storeOffer = 1;
                            }
                        }
                    }
                    let favorites = item['_source'].favorites ? item['_source'].favorites : [];
                    let isfavorites = false;
                    for (let h = 0; h < favorites.length; h++) {
                        if (favorites[h].userId.toString() == request.auth.credentials._id.toString()) {
                            isfavorites = true
                        }
                    }
                    if (isfavorites) {
                        favStoreData.push({
                            storeName: item['_source'].sName ? item['_source'].sName[request.headers.language] : "",
                            storeDescription: item['_source'].storedescription ? item['_source'].storedescription[request.headers.language] : "",
                            bannerImage: item['_source'].bannerLogos ? item['_source'].bannerLogos.bannerimage : "",
                            logoImage: item['_source'].profileLogos ? item['_source'].profileLogos.logoImage : "",
                            type: item['_source'].type ? item['_source'].type : 1,
                            typeMsg: item['_source'].typeMsg ? item['_source'].typeMsg : "",
                            storeId: item._id ? item._id.toString() : "",
                            franchiseId: item['_source'].franchiseId ? item['_source'].franchiseId : "",
                            franchiseName: item['_source'].franchiseName ? item['_source'].franchiseName : "",
                            distanceMiles: parseFloat(parseFloat(parseFloat(item.sort[1]) * 0.621371).toFixed(2)),
                            distanceKm: parseFloat(parseFloat(item.sort[1]).toFixed(2)),
                            distance: parseFloat(parseFloat(item.sort[1]).toFixed(2)),
                            storeTypeMsg: item['_source'].storeTypeMsg,
                            storeType: item['_source'].storeType,
                            cartsAllowed: item['_source'].cartsAllowed,
                            cartsAllowedMsg: item['_source'].cartsAllowedMsg,
                            freeDeliveryAbove: item['_source'].freeDeliveryAbove,
                            minimumOrder: item['_source'].minimumOrder,
                            storeBillingAddr: item['_source'].storeBillingAddr,
                            storeAddr: item['_source'].storeAddr,
                            streetName: item['_source'].streetName ? item['_source'].streetName : "",
                            localityName: item['_source'].localityName ? item['_source'].localityName : "",
                            areaName: item['_source'].areaName ? item['_source'].areaName : "",
                            addressCompo: item['_source'].addressCompo ? item['_source'].addressCompo : {},
                            storeOffer: storeOffer,
                            offerId: offerId,
                            offerTitle: offerTitle,
                            offerBanner: offerBanner,
                            foodType: item['_source'].foodType ? item['_source'].foodType : 0,
                            foodTypeName: item['_source'].foodTypeName ? item['_source'].foodTypeName : "",
                            costForTwo: item['_source'].costForTwo ? item['_source'].costForTwo : 0,
                            avgDeliveryTime: item['_source'].avgDeliveryTime ? item['_source'].avgDeliveryTime : 0,
                            averageRating: item['_source'].averageRating ? item['_source'].averageRating : 0,
                            storeSubCategory: item['_source'].storeSubCategory[0] ? item['_source'].storeSubCategory[0].subCategoryName[request.headers.language] : "",
                            storeCategory: item['_source'].storeCategory[0] ? item['_source'].storeCategory[0].categoryName[request.headers.language] : "",
                            currency: item['_source'].currency,
                            currencySymbol: item['_source'].currencySymbol,
                            nextCloseTime: item['_source'].nextCloseTime || 0,
                            nextOpenTime: item['_source'].nextOpenTime || 0,
                            storeIsOpen: item['_source'].storeIsOpen || false
                        });
                        callback()
                    } else {
                        storeData.push({
                            storeName: item['_source'].sName ? item['_source'].sName[request.headers.language] : "",
                            storeDescription: item['_source'].storedescription ? item['_source'].storedescription[request.headers.language] : "",
                            bannerImage: item['_source'].bannerLogos ? item['_source'].bannerLogos.bannerimage : "",
                            logoImage: item['_source'].profileLogos ? item['_source'].profileLogos.logoImage : "",
                            type: item['_source'].type ? item['_source'].type : 1,
                            typeMsg: item['_source'].typeMsg ? item['_source'].typeMsg : "",
                            storeId: item._id ? item._id.toString() : "",
                            franchiseId: item['_source'].franchiseId ? item['_source'].franchiseId : "",
                            franchiseName: item['_source'].franchiseName ? item['_source'].franchiseName : "",
                            distanceMiles: parseFloat(parseFloat(parseFloat(item.sort[1]) * 0.621371).toFixed(2)),
                            distanceKm: parseFloat(parseFloat(item.sort[1]).toFixed(2)),
                            distance: parseFloat(parseFloat(item.sort[1]).toFixed(2)),
                            storeTypeMsg: item['_source'].storeTypeMsg,
                            storeType: item['_source'].storeType,
                            cartsAllowed: item['_source'].cartsAllowed,
                            cartsAllowedMsg: item['_source'].cartsAllowedMsg,
                            freeDeliveryAbove: item['_source'].freeDeliveryAbove,
                            minimumOrder: item['_source'].minimumOrder,
                            storeBillingAddr: item['_source'].storeBillingAddr,
                            storeAddr: item['_source'].storeAddr,
                            streetName: item['_source'].streetName ? item['_source'].streetName : "",
                            localityName: item['_source'].localityName ? item['_source'].localityName : "",
                            areaName: item['_source'].areaName ? item['_source'].areaName : "",
                            addressCompo: item['_source'].addressCompo ? item['_source'].addressCompo : {},
                            storeOffer: storeOffer,
                            offerId: offerId,
                            offerTitle: offerTitle,
                            offerBanner: offerBanner,
                            foodType: item['_source'].foodType ? item['_source'].foodType : 0,
                            foodTypeName: item['_source'].foodTypeName ? item['_source'].foodTypeName : "",
                            costForTwo: item['_source'].costForTwo ? item['_source'].costForTwo : 0,
                            avgDeliveryTime: item['_source'].avgDeliveryTime ? item['_source'].avgDeliveryTime : 0,
                            averageRating: item['_source'].averageRating ? item['_source'].averageRating : 0,
                            storeSubCategory: item['_source'].storeSubCategory[0] ? item['_source'].storeSubCategory[0].subCategoryName[request.headers.language] : "",
                            storeCategory: item['_source'].storeCategory[0] ? item['_source'].storeCategory[0].categoryName[request.headers.language] : "",
                            currency: item['_source'].currency,
                            currencySymbol: item['_source'].currencySymbol,
                            nextCloseTime: item['_source'].nextCloseTime || 0,
                            nextOpenTime: item['_source'].nextOpenTime || 0,
                            storeIsOpen: item['_source'].storeIsOpen || false
                        });
                        callback()
                    }

                }, function (err) {

                    return reply({
                        message: request.i18n.__('stores')['200'],
                        data: storeData,
                        offerData: offerData,
                        favStore: favStoreData
                    }).code(200);
                    // return reply({ message: request.i18n.__('stores')['200'], data: storeData }).code(200);
                });
            } else {
                return reply({
                    message: request.i18n.__('stores')['404']
                }).code(404);
            }
        });
    });

    // })
}

/** 
 * @function
 * @name storeCategoryHandlerById 
 * @return {object} Reply to the user.
 * @param {data} 0 - name, 1 - email, 2 - mobile
 */
const storeSubCategoryHandlerById = (request, reply) => {
    var storeData = [];
    var storeCount = 0;


    var storeParams = {
        type: request.params.type,
        long: request.params.long,
        lat: request.params.lat,
        categoryId: request.params.categoryId,
        subcategoryId: request.params.subcategoryId,
        zoneId: request.params.zoneId,
        offset: (request.params.offset * request.params.limit),
        limit: request.params.limit

    }
    stores.getAllBySubCategoryCount(storeParams, (err, countresult) => {

        if (err) {
            logger.error('Error occurred during get categories (getStoreCategoriesById): ' + JSON.stringify(err));
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        }
        storeCount = countresult;
        stores.getAllBySubCategoryId(storeParams, (err, result) => {

            if (err) {
                logger.error('Error occurred during get categories (getStoreCategoriesById): ' + JSON.stringify(err));
                return reply({
                    message: request.i18n.__('genericErrMsg')['500']
                }).code(500);

            }

            if (result.length > 0) {

                async.eachSeries(result, (item, callback) => {
                    offers.getStoreOffersByStoreId({
                        storeId: item._id.toString(),
                        status: 1
                    }, (error, response) => {

                        if (response && response.length > 0) {

                            var storeOffer = 1;

                            if (response[0].status == 1 && response[0].endDateTime > moment().unix() && response[0].startDateTime < moment().unix()) {

                                var offerTitle = response[0].name.en;
                                var offerBanner = response[0].images;
                                var offerId = response[0]._id.toString();
                            } else {
                                var offerTitle = "";
                                var offerBanner = {};
                                var offerId = "";
                            }


                        } else {

                            var storeOffer = 0;
                            var offerId = "";
                            var offerTitle = "";
                            var offerBanner = {};
                        }
                        var storeSubCats = [];
                        if (item.storeSubCategory) {
                            async.each(item.storeSubCategory, (storeSubCategoryDetails, callback) => {
                                var storeSubCat = {
                                    id: storeSubCategoryDetails.subCategoryId,
                                    subCategoryName: storeSubCategoryDetails.subCategoryName.en
                                }
                                storeSubCats.push(storeSubCat)

                            });
                        }
                        item.distanceMiles = 0;
                        item.distanceKm = 0;
                        item.estimatedTime = 0;
                        let dest = item.coordinates.latitude + ',' + item.coordinates.longitude;
                        let origin = request.params.lat + ',' + request.params.long;

                        workingHour.workingHourCheck(item._id.toString(), (err, workingResult) => {
                            // resolve(true);

                            googleDistance.calculateDistance(origin, dest).then(distanceMeasured => {
                                let result = distanceMeasured.distance;
                                result *= 0.000621371192;
                                distanceMeasured.distanceMiles = result;
                                item.distanceMiles = result;
                                item.distanceKm = distanceMeasured.distance / 1000;
                                item.estimatedTime = distanceMeasured.durationMins;
                                delete item.coordinates;

                                //  item.distance *= 0.000621371192
                                storeData.push({

                                    storeName: item.sName ? item.sName[request.headers.language] : "",
                                    storeDescription: item.storedescription ? item.storedescription[request.headers.language] : "",
                                    bannerImage: item.bannerLogos ? item.bannerLogos.bannerimage : "",
                                    logoImage: item.profileLogos ? item.profileLogos.logoImage : "",
                                    type: item.type ? item.type : 1,
                                    typeMsg: item.typeMsg ? item.typeMsg : "",
                                    storeId: item._id ? item._id.toString() : "",
                                    franchiseId: item.franchiseId ? item.franchiseId : "",
                                    franchiseName: item.franchiseName ? item.franchiseName : "",
                                    distance: item.distanceKm,
                                    distanceMiles: item.distanceMiles,
                                    storeTypeMsg: item.storeTypeMsg,
                                    storeType: item.storeType,
                                    cartsAllowed: item.cartsAllowed,
                                    cartsAllowedMsg: item.cartsAllowedMsg,
                                    freeDeliveryAbove: item.freeDeliveryAbove,
                                    minimumOrder: item.minimumOrder,
                                    storeBillingAddr: item.storeBillingAddr,
                                    storeAddr: item.storeAddr,
                                    streetName: item.streetName ? item.streetName : "",
                                    localityName: item.localityName ? item.localityName : "",
                                    areaName: item.areaName ? item.areaName : "",
                                    addressCompo: item.addressCompo ? item.addressCompo : {},
                                    storeOffer: storeOffer,
                                    offerId: offerId,
                                    offerTitle: offerTitle,
                                    offerBanner: offerBanner,
                                    foodType: item.foodType ? item.foodType : 0,
                                    foodTypeName: item.foodTypeName ? item.foodTypeName : "",
                                    costForTwo: item.costForTwo ? item.costForTwo : 0,
                                    avgDeliveryTime: item.avgDeliveryTime ? item.avgDeliveryTime : 0,
                                    averageRating: item.averageRating ? item.averageRating : 0,
                                    storeSubCats: storeSubCats,
                                    toreIsOpen: workingResult['storeIsOpen'],
                                    nextOpenTime: workingResult['nextOpenTime'],
                                    nextCloseTime: workingResult['nextCloseTime'],
                                    today: workingResult['today'],
                                    currencySymbol: item.currencySymbols
                                })

                                callback(null);
                            }).catch((err) => {
                                storeData.push({

                                    storeName: item.sName ? item.sName[request.headers.language] : "",
                                    storeDescription: item.storedescription ? item.storedescription[request.headers.language] : "",
                                    bannerImage: item.bannerLogos ? item.bannerLogos.bannerimage : "",
                                    logoImage: item.profileLogos ? item.profileLogos.logoImage : "",
                                    type: item.type ? item.type : 1,
                                    typeMsg: item.typeMsg ? item.typeMsg : "",
                                    storeId: item._id ? item._id.toString() : "",
                                    franchiseId: item.franchiseId ? item.franchiseId : "",
                                    franchiseName: item.franchiseName ? item.franchiseName : "",
                                    distance: item.distance,
                                    distanceMiles: item.distanceMiles,
                                    storeTypeMsg: item.storeTypeMsg,
                                    storeType: item.storeType,
                                    cartsAllowed: item.cartsAllowed,
                                    cartsAllowedMsg: item.cartsAllowedMsg,
                                    freeDeliveryAbove: item.freeDeliveryAbove,
                                    minimumOrder: item.minimumOrder,
                                    storeBillingAddr: item.storeBillingAddr,
                                    storeAddr: item.storeAddr,
                                    streetName: item.streetName ? item.streetName : "",
                                    localityName: item.localityName ? item.localityName : "",
                                    areaName: item.areaName ? item.areaName : "",
                                    addressCompo: item.addressCompo ? item.addressCompo : {},
                                    storeOffer: storeOffer,
                                    offerId: offerId,
                                    offerTitle: offerTitle,
                                    offerBanner: offerBanner,
                                    foodType: item.foodType ? item.foodType : 0,
                                    foodTypeName: item.foodTypeName ? item.foodTypeName : "",
                                    costForTwo: item.costForTwo ? item.costForTwo : 0,
                                    avgDeliveryTime: item.avgDeliveryTime ? item.avgDeliveryTime : 0,
                                    averageRating: item.averageRating ? item.averageRating : 0,
                                    storeSubCats: storeSubCats,
                                    storeIsOpen: workingResult['storeIsOpen'],
                                    nextOpenTime: workingResult['nextOpenTime'],
                                    nextCloseTime: workingResult['nextCloseTime'],
                                    today: workingResult['today'],
                                    currencySymbol: item.currencySymbol

                                })
                                logger.error('Error occurred during view all stores get (calculateDistance): ' + JSON.stringify(err));
                                // return reply({ message: error['stores']['200'][request.headers.language], data: data }).code(200);
                                callback(null);
                            });
                        });


                    })
                    // stores.getStoreOffersByStoreId()
                }, function (error2) {
                    if (error2) {
                    }

                    return reply({
                        message: request.i18n.__('stores')['200'],
                        data: storeData,
                        storeCount: storeCount
                    }).code(200);
                })
            } else {
                return reply({
                    message: request.i18n.__('stores')['404']
                }).code(404);
            }
        });
    });

    // })
}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    storeId: Joi.string().required().min(24).max(24).description('store id').default('5a1974a0e0dc3f28f46dd4df')
};
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const typeValidator = {

    type: Joi.number().required().description('Store type. Ex : 1 (For restaurant'),
    lat: Joi.number().required().description('Latitude Ex: 13.0286'),
    long: Joi.number().required().description('Longitude Ex: 77.5895'),
    zoneId: Joi.string().required().description('Zone Id . Ex: 5b7bf3fbf801683f1b14b3f6'),
    offset: Joi.number().required().description("Required field. Offset to start index . Ex : 0"),
    limit: Joi.number().required().description("Required field. Limit to end index. Ex : 20")

};

/** 
 *@validator to get categories by city id
 *@params
 */

const catByCityIdValidator = {

    cityId: Joi.string().required().description("Mandatory field. City id for fetching all the categories. Ex: 5b7aa229f801686e31123eb3").default('5b7aa229f801686e31123eb3')

};


/**
 * A module that exports business get store handler, validator!
 * @exports validator
 * @exports handler 
 */
const subcatValidator = {

    type: Joi.number().required().description('Store type. Ex : 1 (For restaurant'),
    lat: Joi.number().required().description('Latitude Ex: 13.0286'),
    long: Joi.number().required().description('Longitude Ex: 77.5895'),
    zoneId: Joi.string().required().description('Zone Id . Ex: 5b7bf3fbf801683f1b14b3f6'),
    categoryId: Joi.string().required().description("Category id. Ex: 5b7acea8f801686e31123ec9"),
    subcategoryId: Joi.string().required().description("Sub Category id. Ex: 5b7acea8f801686e31123ec9"),
    offset: Joi.number().required().description("Required field. Offset to start index . Ex : 0"),
    limit: Joi.number().required().description("Required field. Limit to end index. Ex : 20")

};

const catValidator = {

    type: Joi.number().required().description('Store type. Ex : 1 (For restaurant'),
    lat: Joi.number().required().description('Latitude Ex: 13.0286'),
    long: Joi.number().required().description('Longitude Ex: 77.5895'),
    zoneId: Joi.string().required().description('Zone Id . Ex: 5b7bf3fbf801683f1b14b3f6'),
    categoryId: Joi.string().required().description("Category id. Ex: 5b7acea8f801686e31123ec9"),
    offset: Joi.number().required().description("Required field. Offset to start index . Ex : 0"),
    limit: Joi.number().required().description("Required field. Limit to end index. Ex : 20")

};


module.exports = {
    typeValidator,
    catValidator,
    subcatValidator,
    handler,
    storeCategoryHandler,
    validator,
    storeCategoryHandlerFavourite,
    storeCategoryHandlerById,
    catByCityIdValidator,
    storeSubCategoryHandlerById
}