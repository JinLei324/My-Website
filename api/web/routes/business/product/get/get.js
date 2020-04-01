'use strict'
const stores = require('../../../../../models/stores');
const childProducts = require('../../../../../models/childProducts');
const thirdCategory = require('../../../../../models/thirdCategory');
const appConfig = require('../../../../../models/appConfig');
const shoppingList = require('../../../../../models/shoppingList');

const offers = require('../../../../../models/offers');
const error = require('../../../../../statusMessages/responseMessage'); // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment'); //date-time
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
    //  request.headers.language = "en"; // remove in last
    stores.getNearbyStoresId({
        catId: new ObjectId(request.params.categoryId),
        storeId: request.params.storeId,
        lat: request.params.latitude,
        long: request.params.longitude,
        zoneId: request.params.zoneId,
    }, (err, store) => {

        if (err) {
            logger.error('Error occurred during business products get (getNearbyStoresId): ' + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        } else if (store) {

            const getDistance = (itemCoords) => {
                return new Promise((resolve, reject) => {
                    // distance.get(
                    //     {
                    //         index: 1,
                    //         origin: itemCoords.latitude + ',' + itemCoords.longitude,
                    //         destination: request.params.latitude + ',' + request.params.longitude
                    //     },
                    //     (err, data) => {
                    let origin = itemCoords.latitude + ',' + itemCoords.longitude;
                    let dest = request.params.latitude + ',' + request.params.longitude;

                    googleDistance.calculateDistance(origin, dest).then(data => {
                        if (err) logger.error('Error occurred during business products get (calculateDistance): ' + JSON.stringify(err));
                        // reject(err);
                        // if (err)
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                        store.distanceMiles = 0;
                        store.distanceKm = 0;
                        store.estimatedTime = 0;
                        if (data) {
                            let result = data.distance;
                            result *= 0.000621371192;
                            store.distanceMiles = result;
                            store.distanceKm = data.distance / 1000;
                            store.estimatedTime = data.durationMins;
                        }
                        resolve(store);
                    }).catch((err) => {
                        logger.error('Error occurred during   get all products (calculateDistance): ' + JSON.stringify(err));
                        store.distanceMiles = 0;
                        store.distanceKm = 0;
                        store.estimatedTime = '';
                        resolve(store);
                    });
                });
            }
            getDistance(store.coordinates).then(store => {
                store.businessName = store.sName ? store.sName[request.headers.language] : "";
                store.businessAddress = store.storeAddr ? store.storeAddr : "";
                store.businessImage = store.profileLogos ? store.profileLogos.logoImage : "";
                store.bannerImage = store.bannerLogos ? store.bannerLogos.bannerimage : "";
                store.businessLatitude = store.coordinates.latitude ? store.coordinates.latitude : 0;
                store.businessLongitude = store.coordinates.longitude ? store.coordinates.longitude : 0;
                store.businessId = store._id ? store._id.toString() : "";
                store.businessRating = store.averageRating ? store.averageRating : 0;
                store.storeType = store.storeType ? parseInt(store.storeType) : 0;
                store.storeTypeMsg = store.storeTypeMsg ? store.storeTypeMsg : "";
                store.cartsAllowed = store.cartsAllowed ? parseInt(store.cartsAllowed) : 0;
                store.cartsAllowedMsg = store.cartsAllowedMsg;
                delete store._id;
                delete store.profileLogos;
                delete store.bannerLogos;
                delete store.name;
                delete store.sName;
                delete store.storeaddress;

                if (request.params.subCategoryId != 0) {
                    thirdCategory.getByCatSubcatId({
                        catId: new ObjectId(request.params.categoryId),
                        subCatId: new ObjectId(request.params.subCategoryId)
                    }, (err, subSubCats) => {
                        if (err) {
                            logger.error('Error occurred during business products get (getSubCategories): ' + JSON.stringify(err));
                            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                            return reply({
                                message: request.i18n.__('genericErrMsg')['500']
                            }).code(500);
                        }
                        let newSubCats = []
                        for (var j = 0; j < subSubCats.length; j++) {
                            subSubCats[j].subSubCategoryName = subSubCats[j].subSubCategoryName ? subSubCats[j].subSubCategoryName[request.headers.language] : "";
                            subSubCats[j].description = subSubCats[j].subSubCategoryDesc ? subSubCats[j].subSubCategoryDesc[request.headers.language] : "";
                            subSubCats[j].categoryId = subSubCats[j].categoryId ? subSubCats[j].categoryId.toString() : "";
                            subSubCats[j].subSubCategoryId = subSubCats[j]._id ? subSubCats[j]._id.toString() : "";
                            delete subSubCats[j]._id;
                            delete subSubCats[j].name;
                            //   delete subSubCats[j].subSubCategoryName;
                            delete subSubCats[j].subSubCategoryDesc;
                            store.subSubCatWiseProductCount = store.subSubCatWiseProductCount ? store.subSubCatWiseProductCount : []
                            for (let i = 0; i < store.subSubCatWiseProductCount.length; i++) {
                                if (subSubCats[j].subSubCategoryId == store.subSubCatWiseProductCount[i].thirdCategoryId.toString() && store.subSubCatWiseProductCount[i].count > 0) {
                                    newSubCats.push(subSubCats[j])
                                }
                            }

                        }

                        if (newSubCats.length > 0) {
                            newSubCats = newSubCats;
                            newSubCats.push({
                                description: "",
                                imageUrl: "",
                                subCategoryId: request.params.subCategoryId,
                                categoryId: request.params.categoryId,
                                subSubCategoryId: "",
                                subSubCategoryName: "Others"
                            })

                        } else {
                            newSubCats = [{
                                description: "",
                                imageUrl: "",
                                subCategoryId: request.params.subCategoryId,
                                categoryId: request.params.categoryId,
                                subSubCategoryId: "",
                                subSubCategoryName: "",
                            }]
                        }
                        store.subSubCategories = newSubCats;

                        async.each(newSubCats, (item, callback) => {
                            let conditn = {};
                            var skip = request.params.skip || 0
                            var limit = request.params.limit || 10
                            if (newSubCats[0].subSubCategoryId != "") {
                                conditn = {
                                    firstCategoryId: item.categoryId.toString(),
                                    secondCategoryId: item.subCategoryId.toString() || 0,
                                    thirdCategoryId: item.subSubCategoryId ? item.subSubCategoryId.toString() : "",
                                    storeId: new ObjectId(store.businessId),
                                    status: { '$in': [1, 6] },

                                }
                            } else {
                                conditn = {
                                    firstCategoryId: item.categoryId.toString(),
                                    secondCategoryId: item.subCategoryId.toString() || 0,
                                    storeId: new ObjectId(store.businessId),
                                    status: { '$in': [1, 6] },


                                }
                            }

                            childProducts.getProductsSubCatwiseProduct(conditn, skip, limit, (err, product) => {
                                if (err) {
                                    logger.error('Error occurred during business products get (getProductsSubCatwise): ' + JSON.stringify(err));
                                    // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                                    return reply({
                                        message: request.i18n.__('genericErrMsg')['500']
                                    }).code(500);
                                }

                                for (var j = 0; j < product.length; j++) {

                                    product[j].productName = product[j].productname ? product[j].productname[request.headers.language] : "";
                                    product[j].childProductId = product[j]._id;
                                    product[j].parentProductId = product[j].parentProductId ? product[j].parentProductId : "";
                                    product[j].unitId = product[j].units ? product[j].units[0]["unitId"] : "";
                                    product[j].availableQuantity = product[j].units ? product[j].units[0]["availableQuantity"] : "";
                                    product[j].unitName = product[j].units ? product[j].units[0]["name"][request.headers.language] : "";
                                    product[j].priceValue = product[j].units ? parseFloat(product[j].units[0]["price"]["en"]) : 0;
                                    product[j].appliedDiscount = 0;
                                    product[j].finalPrice = parseFloat(product[j].priceValue);
                                    product[j].offerId = "";
                                    product[j].addOns = [];

                                    if (product[j].units[0].addOns && product[j].units[0].addOns.length > 0) {
                                        product[j].addOnAvailable = 1;
                                        product[j].addOns = product[j].units[0].addOns;
                                    } else {
                                        product[j].addOnAvailable = 0;
                                    }
                                    if (product[j].offer && product[j].offer.length > 0) { // offers
                                        for (let k = 0; k < product[j].offer.length; k++) {
                                            if (product[j].offer[k].status == 1 && product[j].offer[k].endDateTime > moment().unix() && product[j].offer[k].startDateTime < moment().unix()) { //check status and expiry
                                                if (product[j].offer[k].discountType == 1) { //check offertype if percentage
                                                    product[j].appliedDiscount = (product[j].priceValue / 100) * parseFloat(product[j].offer[k].discountValue);
                                                    product[j].offerId = product[j].offer[k].offerId ? product[j].offer[k].offerId : "";
                                                    product[j].finalPrice = (product[j].appliedDiscount > product[j].priceValue) ? 0 : product[j].priceValue - product[j].appliedDiscount;
                                                    // }
                                                }
                                                if (product[j].offer[k].discountType == 0) { //check offertype if flat discount
                                                    product[j].appliedDiscount = parseFloat(product[j].offer[k].discountValue);
                                                    product[j].offerId = product[j].offer[k].offerId ? product[j].offer[k].offerId : "";
                                                    product[j].finalPrice = (product[j].appliedDiscount > product[j].priceValue) ? 0 : product[j].priceValue - product[j].appliedDiscount;
                                                }
                                            }
                                        }
                                    }

                                    product[j].units = product[j].units ? product[j].units : [];
                                    product[j].mobileImage = product[j].images ? product[j].images : [];
                                    delete product[j]._id;
                                    delete product[j].images;
                                    delete product[j].units;
                                    delete product[j].offer;
                                    delete product[j].productname;
                                }
                                item.products = product;
                                callback();
                            });
                        }, function (err) {
                            if (store.subSubCategories.length > 0) {
                                let newSubCats = [];
                                for (let g = 0; g < store.subSubCategories.length; g++) {
                                    if (store.subSubCategories[g].products.length > 0)
                                        newSubCats.push(store.subSubCategories[g]);
                                }
                                store.subSubCategories = newSubCats;
                            }
                            delete store.coordinates;
                            return reply({
                                message: request.i18n.__('stores')['200'],
                                data: store
                            }).code(200);
                        });
                    });
                } else {

                    var skip = request.params.skip || 0
                    var limit = request.params.limit || 10
                    childProducts.getProductsSubCatwiseProduct({
                        firstCategoryId: request.params.categoryId,
                        storeId: new ObjectId(request.params.storeId),
                        status: { '$in': [1, 6] }
                    }, skip, limit, (err, product) => {
                        if (err) {
                            logger.error('Error occurred during business products get (getProductsSubCatwise): ' + JSON.stringify(err));
                            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                            return reply({
                                message: request.i18n.__('genericErrMsg')['500']
                            }).code(500);
                        }

                        for (var j = 0; j < product.length; j++) {
                            product[j].productName = product[j].productname ? product[j].productname[request.headers.language] : "";
                            product[j].childProductId = product[j]._id;
                            product[j].parentProductId = product[j].parentProductId ? product[j].parentProductId : "";
                            product[j].unitId = product[j].units ? product[j].units[0]["unitId"] : "";
                            product[j].availableQuantity = product[j].units ? product[j].units[0]["availableQuantity"] : "";
                            product[j].unitName = product[j].units ? product[j].units[0]["name"][request.headers.language] : "";
                            product[j].priceValue = product[j].units ? parseFloat(product[j].units[0]["price"]["en"]) : 0;
                            product[j].appliedDiscount = 0;
                            product[j].finalPrice = parseFloat(product[j].priceValue);
                            product[j].offerId = "";
                            if (product[j].offer && product[j].offer.length > 0) { // offers
                                for (let k = 0; k < product[j].offer.length; k++) {
                                    if (product[j].offer[k].status == 1 && product[j].offer[k].endDateTime > moment().unix() && product[j].offer[k].startDateTime < moment().unix()) { //check status and expiry
                                        if (product[j].offer[k].discountType == 1) { //check offertype if percentage
                                            product[j].appliedDiscount = (product[j].priceValue / 100) * parseFloat(product[j].offer[k].discountValue);
                                            product[j].offerId = product[j].offer[k].offerId ? product[j].offer[k].offerId : "";
                                            product[j].finalPrice = (product[j].appliedDiscount > product[j].priceValue) ? 0 : product[j].priceValue - product[j].appliedDiscount;
                                            // }
                                        }
                                        if (product[j].offer[k].discountType == 0) { //check offertype if flat discount
                                            product[j].appliedDiscount = parseFloat(product[j].offer[k].discountValue);
                                            product[j].offerId = product[j].offer[k].offerId ? product[j].offer[k].offerId : "";
                                            product[j].finalPrice = (product[j].appliedDiscount > product[j].priceValue) ? 0 : product[j].priceValue - product[j].appliedDiscount;
                                        }
                                    }
                                }
                            }

                            product[j].units = product[j].units ? product[j].units : [];
                            product[j].mobileImage = product[j].images ? product[j].images : [];
                            delete product[j]._id;
                            delete product[j].images;
                            delete product[j].units;
                            delete product[j].offer;
                            delete product[j].productname;
                        }
                        store.products = product;
                        return reply({
                            message: request.i18n.__('stores')['200'],
                            data: store
                        }).code(200);
                    });



                }
            }).catch(e => {
                logger.error('err during get fare(catch) ' + JSON.stringify(e));
                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                return reply({
                    message: request.i18n.__('genericErrMsg')['500']
                }).code(500);
            });
        } else {
            logger.error('no store found')
            // return reply({ message: error['stores']['404'][request.headers.language] }).code(404);
            return reply({
                message: request.i18n.__('stores')['404']
            }).code(404);
        }
    });
}
/*
Reponse changed told by rahul sir and shivansh 14-08-2018,
New format :
    cat: [{
        subCat:
            {products: [
            {},
            {},
            {}
            ]}

    },
    {
    
    },
    {
    
    }


    ]

*/
const handlerNew = (request, reply) => {


    var skip = request.params.skip;
    var limit = request.params.limit;


    var comsumptionTiming = [];


    stores.getNearbyStoresId({
        // catId: new ObjectId(request.params.categoryId),
        storeId: request.params.storeId,
        lat: request.params.latitude,
        long: request.params.longitude,
        zoneId: request.params.zoneId,
    }, (err, store) => {
        /*
            getting comsumption details timing from app config collection
        */
        appConfig.get({}, (appConfigError, appConfigResponse) => {
            if (appConfigResponse) {

                comsumptionTiming.push(appConfigResponse.consumptionTime)

            }
        })


        if (err) {
            logger.error('Error occurred during business products get (getNearbyStoresId): ' + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        } else if (store) {
            const getDistance = (itemCoords) => {
                return new Promise((resolve, reject) => {

                    let origin = itemCoords.latitude + ',' + itemCoords.longitude;
                    let dest = request.params.latitude + ',' + request.params.longitude;

                    googleDistance.calculateDistance(origin, dest).then(data => {

                        if (err) logger.error('Error occurred during business products get (calculateDistance): ' + JSON.stringify(err));
                        // reject(err);
                        // if (err)
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                        store.distanceMiles = 0;
                        store.distanceKm = 0;
                        store.estimatedTime = 0;
                        if (data) {
                            let result = data.distance;
                            result *= 0.000621371192;
                            store.distanceMiles = result;
                            store.distanceKm = data.distance / 1000;
                            store.estimatedTime = data.durationMins;
                        }
                        resolve(store);
                    }).catch((err) => {
                        logger.error('Error occurred during   get all products (calculateDistance): ' + JSON.stringify(err));
                        store.distanceMiles = 0;
                        store.distanceKm = 0;
                        store.estimatedTime = '';
                        resolve(store);
                    });
                });
            }
            getDistance(store.coordinates).then(store => {
                var storeOffer = 0;
                var offerId = "";
                var offerTitle = "";
                var offerBanner = {};
                offers.getStoreOffersByStoreId({
                    storeId: store._id.toString()
                }, (error, response) => {
                    if (response && response.length > 0) {
                        storeOffer = 1;
                        if (response[0].status == 1 && response[0].endDateTime > moment().unix() && response[0].startDateTime < moment().unix()) {
                            offerTitle = response[0].name.en;
                            offerBanner = response[0].images;
                            offerId = response[0]._id.toString();
                        } else {
                            offerTitle = "";
                            offerBanner = {};
                            offerId = "";
                        }
                    } else {
                        storeOffer = 0;
                        offerId = "";
                        offerTitle = "";
                        offerBanner = {};
                    }

                    store.isFavorite = false;
                    store.favorites = store.favorites ? store.favorites : [];


                    for (let h = 0; h < store.favorites.length; h++) {
                        if (store.favorites[h].userId == request.auth.credentials._id.toString()) {
                            store.isFavorite = true;
                        }
                    }
                    store.storeOffer = storeOffer;
                    store.offerId = offerId;
                    store.offerTitle = offerTitle;
                    store.offerBanner = offerBanner;
                    store.businessName = store.sName ? store.sName[request.headers.language] : "";
                    store.businessAddress = store.storeAddr ? store.storeAddr : "";
                    store.businessImage = store.profileLogos ? store.profileLogos.logoImage : "";
                    store.bannerImage = store.bannerLogos ? store.bannerLogos.bannerimage : "";
                    store.businessLatitude = store.coordinates.latitude ? store.coordinates.latitude : 0;
                    store.businessLongitude = store.coordinates.longitude ? store.coordinates.longitude : 0;
                    store.businessId = store._id ? store._id.toString() : "";
                    store.businessRating = store.averageRating ? store.averageRating : 0;
                    store.storeType = store.storeType ? parseInt(store.storeType) : 0;
                    store.storeTypeMsg = store.storeTypeMsg ? store.storeTypeMsg : "";
                    store.cartsAllowed = store.cartsAllowed ? parseInt(store.cartsAllowed) : 0;
                    store.cartsAllowedMsg = store.cartsAllowedMsg;
                    store.currency = store.currency;
                    store.currencySymbol = store.currencySymbol;

                    delete store._id;
                    delete store.profileLogos;
                    delete store.bannerLogos;
                    delete store.name;
                    delete store.sName;
                    delete store.storeaddress;
                    delete store.subSubCatWiseProductCount;
                    var storeSubCats = [];
                    if (store.storeSubCategory) {
                        async.each(store.storeSubCategory, (storeSubCategoryDetails, callback) => {
                            var storeSubCat = {
                                id: storeSubCategoryDetails.subCategoryId,
                                subCategoryName: storeSubCategoryDetails.subCategoryName.en
                            }
                            storeSubCats.push(storeSubCat)

                        });
                    }

                    var recomendedProducts = [];
                    var condition = {
                        storeId: new ObjectId(store.businessId),
                        status: { '$in': [1, 6] }
                    }

                    childProducts.getProductsSubCatwiseProduct(condition, skip, limit, (err, product) => {

                        if (err) {
                            logger.error('Error occurred during business products get (getProductsSubCatwise): ' + JSON.stringify(err));
                            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                            return reply({
                                message: request.i18n.__('genericErrMsg')['500']
                            }).code(500);
                        }
                        store.products = [];
                        var favProductData = [];
                        var products = [];
                        /*
                            compare the current time with the consumption timings from app config by adding the current date to the time
                            17-08-2018 17:11
                        */
                        // var currentTime = new Date(request.params.timeStamp.trim());
                        var currentTime = new Date(request.params.timeStamp.trim());

                        var requestedDateTime = request.params.timeStamp.split(' ');
                        var date = requestedDateTime[0];

                        /*breakfast*/
                        var breakfastStartTime = new Date(date + ' ' + comsumptionTiming[0].breakfast.startTime)
                        var breakfastEndTime = new Date(date + ' ' + comsumptionTiming[0].breakfast.endTime)
                        /*brunch*/
                        var brunchStartTime = new Date(date + ' ' + comsumptionTiming[0].brunch.startTime)
                        var brunchEndTime = new Date(date + ' ' + comsumptionTiming[0].brunch.endTime)
                        /*lunch*/
                        var lunchStartTime = new Date(date + ' ' + comsumptionTiming[0].lunch.startTime)
                        var lunchEndTime = new Date(date + ' ' + comsumptionTiming[0].lunch.endTime)
                        /*tea*/
                        var teaStartTime = new Date(date + ' ' + comsumptionTiming[0].tea.startTime)
                        var teaEndTime = new Date(date + ' ' + comsumptionTiming[0].tea.endTime)
                        /*dinner*/
                        var dinnerStartTime = new Date(date + ' ' + comsumptionTiming[0].dinner.startTime)
                        var dinnerEndTime = new Date(date + ' ' + comsumptionTiming[0].dinner.endTime)
                        /*late night dinner*/
                        var lateNightDinnerStartTime = new Date(date + ' ' + comsumptionTiming[0].latenightDinner.startTime)
                        var lateNightDinnerEndTime = new Date(date + ' ' + comsumptionTiming[0].latenightDinner.endTime)
                        var currentTimeSlot = "";

                        /*
                            * Check the current time is in which time interval form the list
                            * Fetch the available products for that time interval
                            * total available time slot strings in child product collection
                                "breakfast" : true,
                                "brunch" : true,
                                "lunch" : true,
                                "tea" : true,
                                "dinner" : true,
                                "latenightdinner" : true
                        */


                        if (currentTime > breakfastStartTime && currentTime < breakfastEndTime) {

                            currentTimeSlot = "breakfast";

                        } else if (currentTime > brunchStartTime && currentTime < brunchEndTime) {

                            currentTimeSlot = "brunch";

                        } else if (currentTime > lunchStartTime && currentTime < lunchEndTime) {

                            currentTimeSlot = "lunch";

                        } else if (currentTime > teaStartTime && currentTime < teaEndTime) {

                            currentTimeSlot = "tea";

                        } else if (currentTime > dinnerStartTime && currentTime < dinnerEndTime) {

                            currentTimeSlot = "dinner";


                        } else if (currentTime > lateNightDinnerStartTime && currentTime < lateNightDinnerEndTime) {

                            currentTimeSlot = "latenightdinner"

                        } else {
                            currentTimeSlot = "";
                        }

                        // for (var j = 0; j < product.length; j++) {

                        //     product[j].productName = product[j].productname ? product[j].productname[request.headers.language] : "";
                        //     product[j].childProductId = product[j]._id;
                        //     // product[j].subCategoryName = product[j].subCategoryName[0];                        
                        //     product[j].parentProductId = product[j].parentProductId ? product[j].parentProductId : "";
                        //     product[j].unitId = product[j].units ? product[j].units[0]["unitId"] : "";
                        // product[j].availableQuantity = product[j].units ? product[j].units[0]["availableQuantity"] : "";
                        //     product[j].unitName = product[j].units ? product[j].units[0]["name"][request.headers.language] : "";
                        //     product[j].categoryName = product[j].catName ? product[j].catName[request.headers.language] : "";
                        //     // product[j].categoryName = product[j].catName.en;
                        //     product[j].secondCategoryName = product[j].subCatName ? product[j].subCatName[request.headers.language] : "";
                        //     product[j].firstCategoryName = product[j].catName ? product[j].catName[request.headers.language] : "";
                        //     product[j].priceValue = product[j].units ? parseFloat(product[j].units[0]["price"]["en"]) : 0;
                        //     product[j].appliedDiscount = 0;
                        //     product[j].finalPrice = parseFloat(product[j].priceValue);
                        //     product[j].offerId = "";


                        //     // if (product[j].addOns || product[j].addOns.length > 0 ) {
                        //     if (product[j].addOns) {
                        //         if (product[j].addOns.length > 0) {
                        //             product[j].addOnAvailable = 1;
                        //         } else {
                        //             product[j].addOnAvailable = 0;
                        //         }
                        //     } else {
                        //         product[j].addOnAvailable = 0;
                        //     }
                        //     if (product[j].offer && product[j].offer.length > 0) { // offers
                        //         for (let k = 0; k < product[j].offer.length; k++) {
                        //             if (product[j].offer[k].status == 1 && product[j].offer[k].endDateTime > moment().unix() && product[j].offer[k].startDateTime < moment().unix()) { //check status and expiry
                        //                 if (product[j].offer[k].discountType == 1) { //check offertype if percentage
                        //                     product[j].appliedDiscount = (product[j].priceValue / 100) * parseFloat(product[j].offer[k].discountValue);
                        //                     product[j].offerId = product[j].offer[k].offerId ? product[j].offer[k].offerId : "";
                        //                     product[j].finalPrice = (product[j].appliedDiscount > product[j].priceValue) ? 0 : product[j].priceValue - product[j].appliedDiscount;
                        //                     // }
                        //                 }
                        //                 if (product[j].offer[k].discountType == 0) { //check offertype if flat discount
                        //                     product[j].appliedDiscount = parseFloat(product[j].offer[k].discountValue);
                        //                     product[j].offerId = product[j].offer[k].offerId ? product[j].offer[k].offerId : "";
                        //                     product[j].finalPrice = (product[j].appliedDiscount > product[j].priceValue) ? 0 : product[j].priceValue - product[j].appliedDiscount;
                        //                 }
                        //             }
                        //         }
                        //     }

                        //     product[j].units = product[j].units ? product[j].units : [];
                        //     product[j].mobileImage = product[j].images ? product[j].images : [];
                        //     delete product[j]._id;
                        //     delete product[j].images;
                        //     delete product[j].units;
                        //     delete product[j].offer;
                        //     delete product[j].productname;
                        //     // delete products[j].catName;
                        //     products.push(product[j]);
                        //     if (product[j].consumptionTime) {
                        //         if (product[j].consumptionTime[currentTimeSlot]) {
                        //             recomendedProducts.push(product[j])
                        //         }
                        //     }


                        //     shoppingList.isExistsWithItem({ userId: request.auth.credentials._id.toString(), childProductId: product[j].childProductId.toString(), parentProductId: product[j].parentProductId.toString() }, (err, isStore) => {

                        //         if (err) {
                        //             logger.error('Error occurred while checking shoppingList : ' + err);
                        //             return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                        //         }
                        //         if (isStore.length > 0) {
                        //             if (parseInt(isStore[0].shoppingList.status) == 0) {


                        //                 favProductData.push(product[j])
                        //             }
                        //         }
                        //     });
                        // }
                        async.eachSeries(product, (item, callback) => {

                            item.productName = item.productname ? item.productname[request.headers.language] : "";
                            item.childProductId = item._id;
                            // item.subCategoryName = item.subCategoryName[0];                        
                            item.parentProductId = item.parentProductId ? item.parentProductId : "";
                            item.unitId = item.units ? item.units[0]["unitId"] : "";
                            item.unitName = item.units ? item.units[0]["name"][request.headers.language] : "";
                            item.categoryName = item.catName ? item.catName[request.headers.language] : "";
                            // item.categoryName = item.catName.en;
                            item.secondCategoryName = item.subCatName ? item.subCatName[request.headers.language] : "";
                            item.firstCategoryName = item.catName ? item.catName[request.headers.language] : "";
                            item.priceValue = item.units ? parseFloat(item.units[0]["price"]["en"]) : 0;
                            item.appliedDiscount = 0;
                            item.finalPrice = parseFloat(item.priceValue);
                            item.offerId = "";
                            item.addOns = [];

                            // if (item.addOns || item.addOns.length > 0 ) {


                            if (item.units[0].addOns) {
                                if (item.units[0].addOns.length > 0) {
                                    item.addOnAvailable = 1;
                                    item.addOns = item.units[0].addOns;
                                } else {
                                    item.addOnAvailable = 0;
                                }
                            } else {
                                item.addOnAvailable = 0;
                            }

                            if (item.offer && item.offer.length > 0) { // offers
                                for (let k = 0; k < item.offer.length; k++) {
                                    if (item.offer[k].status == 1 && item.offer[k].endDateTime > moment().unix() && item.offer[k].startDateTime < moment().unix()) { //check status and expiry
                                        if (item.offer[k].discountType == 1) { //check offertype if percentage
                                            item.appliedDiscount = (item.priceValue / 100) * parseFloat(item.offer[k].discountValue);
                                            item.offerId = item.offer[k].offerId ? item.offer[k].offerId : "";
                                            item.finalPrice = (item.appliedDiscount > item.priceValue) ? 0 : item.priceValue - item.appliedDiscount;
                                            // }
                                        }
                                        if (item.offer[k].discountType == 0) { //check offertype if flat discount
                                            item.appliedDiscount = parseFloat(item.offer[k].discountValue);
                                            item.offerId = item.offer[k].offerId ? item.offer[k].offerId : "";
                                            item.finalPrice = (item.appliedDiscount > item.priceValue) ? 0 : item.priceValue - item.appliedDiscount;
                                        }
                                    }
                                }
                            }

                            item.units = item.units ? item.units : [];
                            item.mobileImage = item.images ? item.images : [];
                            delete item._id;
                            delete item.images;
                            delete item.units;
                            delete item.offer;
                            delete item.productname;
                            // delete products[j].catName;
                            products.push(item);
                            if (item.consumptionTime) {
                                if (item.consumptionTime[currentTimeSlot]) {
                                    recomendedProducts.push(item)
                                }
                            }
                            shoppingList.isExistsWithItem({ userId: request.auth.credentials._id.toString(), childProductId: item.childProductId.toString(), parentProductId: item.parentProductId.toString() }, (err, isStore) => {

                                if (err) {
                                    logger.error('Error occurred while checking shoppingList : ' + err);
                                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                                }
                                if (isStore.length > 0) {
                                    if (parseInt(isStore[0].shoppingList.status) == 0) {
                                        favProductData.push(item)
                                    }
                                }

                                callback(null);
                            });
                            // stores.getStoreOffersByStoreId()
                        }, function (error2) {

                            store.products = product;
                            store.favProduct = favProductData;
                            store.recomendedProducts = recomendedProducts;
                            store.storeSubCats = storeSubCats;
                            return reply({
                                message: request.i18n.__('stores')['200'],
                                data: store
                            }).code(200);
                        })
                    })
                })

            }).catch(e => {
                logger.error('err during get fare(catch) ' + JSON.stringify(e));
                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                return reply({
                    message: request.i18n.__('genericErrMsg')['500']
                }).code(500);
            });
        } else {
            logger.error('no store found')
            // return reply({ message: error['stores']['404'][request.headers.language] }).code(404);
            return reply({
                message: request.i18n.__('stores')['404']
            }).code(404);
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
    categoryId: Joi.string().required().description('Category Id').default("5b7bdeb0f801683f1b14b3e8"),
    subCategoryId: Joi.string().required().description('sub Category Id').default("5b7bf022f8016807815556b4"),
    storeId: Joi.string().required().description('Requried field. 0 - For nearest store. storeId : "5b7c25c2e809bd5f1b6dbbd4" (Data for a particular store)').default("5b7c25c2e809bd5f1b6dbbd4"),
    zoneId: Joi.string().required().description('zoneId 5b7bf3fbf801683f1b14b3f6').default("5b7bf3fbf801683f1b14b3f6"),
    latitude: Joi.number().required().description('Latitude').default("13.0286"),
    longitude: Joi.number().required().description('Longitude').default("77.5895"),
    skip: Joi.number().description('Skip for pagignation').default(0),
    limit: Joi.number().description('Response data limit').default(30)
}

const getProductValidator = {
    // categoryId: Joi.string().required().description('Category Id').default("5ac36553e0dc3f58464ddffc"),
    // subCategoryId: Joi.string().required().description('sub Category Id').default("59d34bf6e0dc3f256f5848ab"),
    storeId: Joi.string().required().description('Requried field. 0 - For nearest store. storeId : "5b7acf9e891e366e55e5fba5" (Data for a particular store)').default("5b7acf9e891e366e55e5fba5"),
    zoneId: Joi.string().required().description('Required field. zoneId : "5b7bf3fbf801683f1b14b3f6"').default("5b7bf3fbf801683f1b14b3f6"),
    latitude: Joi.number().required().description('Required Field. Latitude : 13.0286').default("13.0286"),
    longitude: Joi.number().required().description('Required Field. Longitude : 77.5895').default("77.5895"),
    timeStamp: Joi.string().required().description("Mandatory Field. Used to get the recomended prducts. Time in 24 hours format. Required Format : YYYY-MM-DD HH:MM").default("2018-08-27 15:22:33"),
    skip: Joi.number().description('Skip for pagignation').default("0"),
    limit: Joi.number().description('Response data limit').default("20")
}
/**
 * A module that exports customer get categories handler, validator!
 * @exports validator
 * @exports handler 
 */

const productHandler = (request, reply) => {
    stores.getStores({
        // catId: new ObjectId(request.params.categoryId),
        storeId: request.params.storeId,
    }, (err, store) => {
        if (err) {
            logger.error('Error occurred during business products get (getNearbyStoresId): ' + JSON.stringify(err));
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        } else if (store) {

            store.businessName = store.sName ? store.sName[request.headers.language] : "";
            store.businessAddress = store.storeAddr ? store.storeAddr : "";
            store.businessImage = store.profileLogos ? store.profileLogos.logoImage : "";
            store.bannerImage = store.bannerLogos ? store.bannerLogos.bannerimage : "";
            store.businessLatitude = store.coordinates.latitude ? store.coordinates.latitude : 0;
            store.businessLongitude = store.coordinates.longitude ? store.coordinates.longitude : 0;
            store.businessId = store._id ? store._id.toString() : "";
            store.businessRating = store.averageRating ? store.averageRating : 0;
            store.storeType = store.storeType ? parseInt(store.storeType) : 0;
            store.storeTypeMsg = store.storeTypeMsg ? store.storeTypeMsg : "";
            store.cartsAllowed = store.cartsAllowed ? parseInt(store.cartsAllowed) : 0;
            store.cartsAllowedMsg = store.cartsAllowedMsg;
            delete store._id;
            delete store.profileLogos;
            delete store.bannerLogos;
            delete store.name;
            delete store.sName;
            delete store.storeaddress;

            if (request.params.subCategoryId != 0) {
                thirdCategory.getByCatSubcatId({
                    catId: new ObjectId(request.params.categoryId),
                    subCatId: new ObjectId(request.params.subCategoryId)
                }, (err, subSubCats) => {
                    if (err) {
                        logger.error('Error occurred during business products get (getSubCategories): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                        return reply({
                            message: request.i18n.__('genericErrMsg')['500']
                        }).code(500);
                    }
                    let newSubCats = []
                    for (var j = 0; j < subSubCats.length; j++) {
                        subSubCats[j].subSubCategoryName = subSubCats[j].subSubCategoryName ? subSubCats[j].subSubCategoryName[request.headers.language] : "";
                        subSubCats[j].description = subSubCats[j].subSubCategoryDesc ? subSubCats[j].subSubCategoryDesc[request.headers.language] : "";
                        subSubCats[j].categoryId = subSubCats[j].categoryId ? subSubCats[j].categoryId.toString() : "";
                        subSubCats[j].subSubCategoryId = subSubCats[j]._id ? subSubCats[j]._id.toString() : "";
                        delete subSubCats[j]._id;
                        delete subSubCats[j].name;
                        //   delete subSubCats[j].subSubCategoryName;
                        delete subSubCats[j].subSubCategoryDesc;
                        store.subSubCatWiseProductCount = store.subSubCatWiseProductCount ? store.subSubCatWiseProductCount : []
                        for (let i = 0; i < store.subSubCatWiseProductCount.length; i++) {
                            if (subSubCats[j].subSubCategoryId == store.subSubCatWiseProductCount[i].thirdCategoryId.toString() && store.subSubCatWiseProductCount[i].count > 0) {
                                newSubCats.push(subSubCats[j])
                            }
                        }

                    }

                    if (newSubCats.length > 0) {
                        newSubCats = newSubCats;
                        newSubCats.push({
                            description: "",
                            imageUrl: "",
                            subCategoryId: request.params.subCategoryId,
                            categoryId: request.params.categoryId,
                            subSubCategoryId: "",
                            subSubCategoryName: "Others"
                        })

                    } else {
                        newSubCats = [{
                            description: "",
                            imageUrl: "",
                            subCategoryId: request.params.subCategoryId,
                            categoryId: request.params.categoryId,
                            subSubCategoryId: "",
                            subSubCategoryName: "",
                        }]
                    }
                    store.subSubCategories = newSubCats;

                    async.each(newSubCats, (item, callback) => {
                        let conditn = {};
                        var skip = request.params.skip || 0
                        var limit = request.params.limit || 10
                        if (newSubCats[0].subSubCategoryId != "") {
                            conditn = {
                                firstCategoryId: item.categoryId.toString(),
                                secondCategoryId: item.subCategoryId.toString() || 0,
                                thirdCategoryId: item.subSubCategoryId ? item.subSubCategoryId.toString() : "",
                                storeId: new ObjectId(store.businessId),
                                status: {
                                    '$in': [1, 6]
                                },

                            }
                        } else {
                            conditn = {
                                firstCategoryId: item.categoryId.toString(),
                                secondCategoryId: item.subCategoryId.toString() || 0,
                                storeId: new ObjectId(store.businessId),
                                status: {
                                    '$in': [1, 6]
                                },


                            }
                        }

                        childProducts.getProductsSubCatwiseProduct(conditn, skip, limit, (err, product) => {
                            if (err) {
                                logger.error('Error occurred during business products get (getProductsSubCatwise): ' + JSON.stringify(err));
                                // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                                return reply({
                                    message: request.i18n.__('genericErrMsg')['500']
                                }).code(500);
                            }



                            for (var j = 0; j < product.length; j++) {

                                /*
                                    Check units available for product 
                                    -> Lowest price of the unit should come first 
                                    -> Quantity of the product should not be zero 
                                    -> If quantity of all units are zero the product is out of stock

                                */
                                var ProductUnitAvailableQuantity;
                                var productUnitPrice;
                                var productUnitName;
                                var productUnitID;


                                var unitsArray = product[j].units
                                if (product[j].units.length > 0) {

                                    product[j].units.sort(function (a, b) {
                                        return a.floatValue - b.floatValue
                                    });

                                    for (var m = 0; m < product[j].units.length; m++) {

                                        if (product[j].units[m].availableQuantity > 0) {
                                            ProductUnitAvailableQuantity = product[j].units ? product[j].units[m]["availableQuantity"] : "";
                                            productUnitPrice = product[j].units[m].floatValue;
                                            productUnitID = product[j].units[m].unitId;
                                            productUnitName = product[j].units ? product[j].units[m]["name"][request.headers.language] : "";
                                            break;
                                        } else {
                                            ProductUnitAvailableQuantity = 0;
                                            productUnitID = product[j].units[m].unitId;
                                            productUnitPrice = product[j].units[m].floatValue;
                                            productUnitName = product[j].units ? product[j].units[m]["name"][request.headers.language] : "";
                                        }

                                    }
                                }



                                product[j].productName = product[j].productname ? product[j].productname[request.headers.language] : "";
                                product[j].childProductId = product[j]._id;
                                product[j].parentProductId = product[j].parentProductId ? product[j].parentProductId : "";
                                // product[j].unitId = product[j].units ? product[j].units[0]["unitId"] : "";
                                // product[j].availableQuantity = product[j].units ? product[j].units[0]["availableQuantity"] : "";
                                // product[j].unitName = product[j].units ? product[j].units[0]["name"][request.headers.language] : "";
                                // product[j].priceValue = product[j].units ? parseFloat(product[j].units[0]["price"]["en"]) : 0;
                                product[j].unitId = productUnitID;
                                product[j].availableQuantity = ProductUnitAvailableQuantity;
                                product[j].unitName = productUnitName;
                                product[j].priceValue = productUnitPrice;

                                product[j].appliedDiscount = 0;
                                product[j].finalPrice = parseFloat(product[j].priceValue);
                                product[j].offerId = "";
                                product[j].addOns = [];

                                if (product[j].units[0].addOns && product[j].units[0].addOns.length > 0) {
                                    product[j].addOnAvailable = 1;
                                    product[j].addOns = product[j].units[0].addOns;
                                } else {
                                    product[j].addOnAvailable = 0;
                                }
                                if (product[j].offer && product[j].offer.length > 0) { // offers
                                    for (let k = 0; k < product[j].offer.length; k++) {
                                        if (product[j].offer[k].status == 1 && product[j].offer[k].endDateTime > moment().unix() && product[j].offer[k].startDateTime < moment().unix()) { //check status and expiry
                                            if (product[j].offer[k].discountType == 1) { //check offertype if percentage
                                                product[j].appliedDiscount = (product[j].priceValue / 100) * parseFloat(product[j].offer[k].discountValue);
                                                product[j].offerId = product[j].offer[k].offerId ? product[j].offer[k].offerId : "";
                                                product[j].finalPrice = (product[j].appliedDiscount > product[j].priceValue) ? 0 : product[j].priceValue - product[j].appliedDiscount;
                                                // }
                                            }
                                            if (product[j].offer[k].discountType == 0) { //check offertype if flat discount
                                                product[j].appliedDiscount = parseFloat(product[j].offer[k].discountValue);
                                                product[j].offerId = product[j].offer[k].offerId ? product[j].offer[k].offerId : "";
                                                product[j].finalPrice = (product[j].appliedDiscount > product[j].priceValue) ? 0 : product[j].priceValue - product[j].appliedDiscount;
                                            }
                                        }
                                    }
                                }

                                product[j].units = product[j].units ? product[j].units : [];
                                product[j].mobileImage = product[j].images ? product[j].images : [];
                                delete product[j]._id;
                                delete product[j].images;
                                delete product[j].units;
                                delete product[j].offer;
                                delete product[j].productname;
                            }
                            item.products = product;
                            callback();
                        });
                    }, function (err) {
                        if (store.subSubCategories.length > 0) {
                            let newSubCats = [];
                            for (let g = 0; g < store.subSubCategories.length; g++) {
                                if (store.subSubCategories[g].products.length > 0)
                                    newSubCats.push(store.subSubCategories[g]);
                            }
                            store.subSubCategories = newSubCats;
                        }
                        delete store.coordinates;
                        return reply({
                            message: request.i18n.__('stores')['200'],
                            data: store
                        }).code(200);
                    });
                });
            } else {

                var skip = (request.params.skip * request.params.limit) || 0
                var limit = request.params.limit || 10
                childProducts.getProductsSubCatwiseProduct({
                    firstCategoryId: request.params.categoryId,
                    storeId: new ObjectId(request.params.storeId),
                    status: {
                        '$in': [1, 6]
                    }
                }, skip, limit, (err, product) => {
                    if (err) {
                        logger.error('Error occurred during business products get (getProductsSubCatwise): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                        return reply({
                            message: request.i18n.__('genericErrMsg')['500']
                        }).code(500);
                    }


                    for (var j = 0; j < product.length; j++) {
                        product[j].productName = product[j].productname ? product[j].productname[request.headers.language] : "";
                        product[j].childProductId = product[j]._id;
                        product[j].parentProductId = product[j].parentProductId ? product[j].parentProductId : "";
                        product[j].unitId = product[j].units ? product[j].units[0]["unitId"] : "";
                        product[j].availableQuantity = product[j].units ? product[j].units[0]["availableQuantity"] : "";
                        product[j].unitName = product[j].units ? product[j].units[0]["name"][request.headers.language] : "";
                        product[j].priceValue = product[j].units ? parseFloat(product[j].units[0]["price"]["en"]) : 0;
                        product[j].appliedDiscount = 0;
                        product[j].finalPrice = parseFloat(product[j].priceValue);
                        product[j].offerId = "";
                        if (product[j].offer && product[j].offer.length > 0) { // offers
                            for (let k = 0; k < product[j].offer.length; k++) {
                                if (product[j].offer[k].status == 1 && product[j].offer[k].endDateTime > moment().unix() && product[j].offer[k].startDateTime < moment().unix()) { //check status and expiry
                                    if (product[j].offer[k].discountType == 1) { //check offertype if percentage
                                        product[j].appliedDiscount = (product[j].priceValue / 100) * parseFloat(product[j].offer[k].discountValue);
                                        product[j].offerId = product[j].offer[k].offerId ? product[j].offer[k].offerId : "";
                                        product[j].finalPrice = (product[j].appliedDiscount > product[j].priceValue) ? 0 : product[j].priceValue - product[j].appliedDiscount;
                                        // }
                                    }
                                    if (product[j].offer[k].discountType == 0) { //check offertype if flat discount
                                        product[j].appliedDiscount = parseFloat(product[j].offer[k].discountValue);
                                        product[j].offerId = product[j].offer[k].offerId ? product[j].offer[k].offerId : "";
                                        product[j].finalPrice = (product[j].appliedDiscount > product[j].priceValue) ? 0 : product[j].priceValue - product[j].appliedDiscount;
                                    }
                                }
                            }
                        }

                        product[j].units = product[j].units ? product[j].units : [];
                        product[j].mobileImage = product[j].images ? product[j].images : [];
                        delete product[j]._id;
                        delete product[j].images;
                        delete product[j].units;
                        delete product[j].offer;
                        delete product[j].productname;
                    }
                    store.products = product;
                    return reply({
                        message: request.i18n.__('stores')['200'],
                        data: store
                    }).code(200);
                });



            }
        } else {
            logger.error('no store found')
            // return reply({ message: error['stores']['404'][request.headers.language] }).code(404);
            return reply({
                message: request.i18n.__('stores')['404']
            }).code(404);
        }
    });
}
const productValidator = {
    categoryId: Joi.string().required().description('Category Id').default("5cdd7dec8badfe52383f62dd"),
    subCategoryId: Joi.string().required().description('sub Category Id').default("5cdd7dec8badfe52383f62de"),
    storeId: Joi.string().required().description('Requried field. 0 - For nearest store. storeId : "5b7acf9e891e366e55e5fba5" (Data for a particular store)').default("5cdd69337e10dd455436b0c1"),
    skip: Joi.number().description('Skip for pagignation').default("0"),
    limit: Joi.number().description('Response data limit').default("20")
}
module.exports = {
    handler,
    validator,
    handlerNew,
    getProductValidator,
    productHandler,
    productValidator
}