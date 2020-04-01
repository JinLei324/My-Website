'use strict'
const stores = require('../../../../../models/stores');
const childProducts = require('../../../../../models/childProducts');
const thirdCategory = require('../../../../../models/thirdCategory');
const appConfig = require('../../../../../models/appConfig');
const error = require('../../../../../statusMessages/responseMessage'); // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment'); //date-time
const distance = require('google-distance');
const async = require('async');
const googleDistance = require('../../../../commonModels/googleApi');
const ObjectId = require('mongodb').ObjectID;

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


    var comsumptionTiming = [];

    stores.getById({
        id: request.params.storeId,
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

                // var recomendedProducts = [];
                var condition = {
                    storeId: new ObjectId(store.businessId),
                    status: { '$in': [1, 5, 6] }
                }

                childProducts.getProductDetailsById(condition, (err, product) => {

                    if (err) {
                        logger.error('Error occurred during business products get (getProductsSubCatwise): ' + JSON.stringify(err));
                        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                        return reply({
                            message: request.i18n.__('genericErrMsg')['500']
                        }).code(500);
                    }
                    store.products = [];
                    var products = [];
                    /*
                        compare the current time with the consumption timings from app config by adding the current date to the time
                        17-08-2018 17:11
                    */
                    // var currentTime = new Date(request.params.timeStamp.trim());
                    // var currentTime = new Date(request.params.timeStamp.trim());

                    // var requestedDateTime = request.params.timeStamp.split(' ');
                    // var date = requestedDateTime[0];

                    /*breakfast*/
                    // var breakfastStartTime = new Date(date + ' ' + comsumptionTiming[0].breakfast.startTime)
                    // var breakfastEndTime = new Date(date + ' ' + comsumptionTiming[0].breakfast.endTime)
                    // /*brunch*/
                    // var brunchStartTime = new Date(date + ' ' + comsumptionTiming[0].brunch.startTime)
                    // var brunchEndTime = new Date(date + ' ' + comsumptionTiming[0].brunch.endTime)
                    // /*lunch*/
                    // var lunchStartTime = new Date(date + ' ' + comsumptionTiming[0].lunch.startTime)
                    // var lunchEndTime = new Date(date + ' ' + comsumptionTiming[0].lunch.endTime)
                    // /*tea*/
                    // var teaStartTime = new Date(date + ' ' + comsumptionTiming[0].tea.startTime)
                    // var teaEndTime = new Date(date + ' ' + comsumptionTiming[0].tea.endTime)
                    // /*dinner*/
                    // var dinnerStartTime = new Date(date + ' ' + comsumptionTiming[0].dinner.startTime)
                    // var dinnerEndTime = new Date(date + ' ' + comsumptionTiming[0].dinner.endTime)
                    // /*late night dinner*/
                    // var lateNightDinnerStartTime = new Date(date + ' ' + comsumptionTiming[0].latenightDinner.startTime)
                    // var lateNightDinnerEndTime = new Date(date + ' ' + comsumptionTiming[0].latenightDinner.endTime)
                    // var currentTimeSlot = "";

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


                    // if (currentTime > breakfastStartTime && currentTime < breakfastEndTime) {

                    //     currentTimeSlot = "breakfast";

                    // } else if (currentTime > brunchStartTime && currentTime < brunchEndTime) {

                    //     currentTimeSlot = "brunch";

                    // } else if (currentTime > lunchStartTime && currentTime < lunchEndTime) {

                    //     currentTimeSlot = "lunch";

                    // } else if (currentTime > teaStartTime && currentTime < teaEndTime) {

                    //     currentTimeSlot = "tea";

                    // } else if (currentTime > dinnerStartTime && currentTime < dinnerEndTime) {

                    //     currentTimeSlot = "dinner";


                    // } else if (currentTime > lateNightDinnerStartTime && currentTime < lateNightDinnerEndTime) {

                    //     currentTimeSlot = "latenightdinner"

                    // } else {
                    // currentTimeSlot = "";
                    // }

                    for (var j = 0; j < product.length; j++) {

                        product[j].productName = product[j].productname ? product[j].productname[request.headers.language] : "";
                        product[j].subCatName = product[j].subCatName ? product[j].subCatName[request.headers.language] : "";
                        product[j].catName = product[j].catName ? product[j].catName[request.headers.language] : "";
                        product[j].childProductId = product[j]._id;
                        // product[j].subCategoryName = product[j].subCategoryName[0];                        
                        product[j].parentProductId = product[j].parentProductId ? product[j].parentProductId : "";
                        product[j].unitId = product[j].units ? product[j].units[0]["unitId"] : "";
                        product[j].unitName = product[j].units ? product[j].units[0]["name"][request.headers.language] : "";
                        product[j].categoryName = product[j].catName ? product[j].catName[request.headers.language] : "";
                        // product[j].categoryName = product[j].catName.en;
                        product[j].secondCategoryName = product[j].subCatName ? product[j].subCatName[request.headers.language] : "";
                        product[j].firstCategoryName = product[j].catName ? product[j].catName[request.headers.language] : "";
                        product[j].priceValue = product[j].units ? parseFloat(product[j].units[0]["price"]["en"]) : 0;
                        product[j].appliedDiscount = 0;
                        product[j].finalPrice = parseFloat(product[j].priceValue);
                        product[j].offerId = "";
                        product[j].addOns = product[j].units[0].addOns;


                        // if (product[j].addOns || product[j].addOns.length > 0 ) {
                        if (product[j].addOns) {
                            if (product[j].addOns.length > 0) {
                                product[j].addOnAvailable = 1;
                            } else {
                                product[j].addOnAvailable = 0;
                            }
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
                        delete product[j].views;
                        delete product[j].addOns;
                        delete product[j].consumptionTime;
                        delete product[j].productname;
                        // delete products[j].catName;
                        products.push(product[j]);
                        // if (product[j].consumptionTime) {
                        //     if (product[j].consumptionTime[currentTimeSlot]) {
                        //         recomendedProducts.push(product[j])
                        //     }
                        // }
                    }

                    store.products = product;
                    // store.recomendedProducts = recomendedProducts;
                    // store.storeSubCats = storeSubCats;

                    return reply({
                        message: request.i18n.__('stores')['200'],
                        data: store
                    }).code(200);
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


const getProductValidator = {
    storeId: Joi.string().required().description('Requried field. 0 - For nearest store. storeId : "5b7acf9e891e366e55e5fba5" (Data for a particular store)').default("5b7acf9e891e366e55e5fba5"),
}
/**
 * A module that exports customer get categories handler, validator!
 * @exports validator
 * @exports handler 
 */
module.exports = {
    handlerNew,
    getProductValidator
}