'use strict'

var stores = require('../../../../../models/stores');
var storesElastic = require('../../../../../models/storeElastic');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Async = require('async');

/** salesforce
* @library 
* @author Umesh Beti
*/
const customer = require('../../../../../models/customer');
const superagent = require('superagent');
const salesforce = require('../../../../../library/salesforce');

/*salesforce*/
const handler = (request, reply) => {

    let storeId = request.payload.storeId ? new ObjectID(request.payload.storeId) : ""
    let storeNameSalesforce = request.payload.sName.en;
    stores.getOne({ "_id": storeId }, (err, result) => {

        if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500);

        if (result === null)
            return reply({ message: request.i18n.__('store')['404'] }).code(404);

        delete request.payload.storeId;

        request.payload.status = result.status;

        stores.update({ q: { "_id": storeId }, data: { $set: request.payload } }, (err, updateObj) => {

            if (err) return reply({ message: request.i18n.__('genericErrMsg')['500'], data: err }).code(500);
            request.payload.location = {
                "lat": request.payload.coordinates.latitude,
                "lon": request.payload.coordinates.longitude
            }
            // delete request.payload.sName;
            // delete request.payload.storedescription;
            // delete request.payload.storeaddress;

            storesElastic.Update(storeId.toString(), request.payload, (err, resultelastic) => {
                if (err) {
                    logger.error(err);
                    //return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']), data: err }).code(500);
                }
                if (config.salesforceService) {// checking is Salesforceservice is true
                    /* salesforce 
                        Author Umesh beti */
                    var authData = salesforce.get();
                    var commissionType = request.payload.commissionType == 0 ? "Percentage" : "Fixed";
                    var DataToSF =
                    {
                        "Name": storeNameSalesforce ? storeNameSalesforce : "",
                        "mongoId": result._id ? result._id : "",
                        "email": request.payload.ownerEmail ? request.payload.ownerEmail : "",
                        "ownerPhone": request.payload.ownerPhone ? request.payload.ownerPhone : "",
                        "ownerName": request.payload.ownerName ? request.payload.ownerName : "",
                        "averageDeliveryTime": request.payload.avgDeliveryTime ? request.payload.avgDeliveryTime : "",
                        // "walletBalance":0,
                        // "walletBlock":0,
                        // "walletHardLimit":0,
                        // "walletSoftLimit":0,
                        "storeLandLine": request.payload.businessNumber ? request.payload.businessNumber : "",
                        "billingCountry": request.payload.countryname ? request.payload.countryname : "",
                        "billingCity": request.payload.cityName ? request.payload.cityName : "",
                        "billingState": request.payload.cityName ? request.payload.cityName : "",
                        "billingStreet": request.payload.City ? request.payload.City : "",
                        "billingPostalCode": request.payload.postalCode ? request.payload.postalCode : "",
                        "status": true,
                        "commission": request.payload.commission ? request.payload.commission : 0,
                        "commissionType": commissionType ? commissionType : "",
                        "countryCode": request.payload.countryCode ? request.payload.countryCode : "",
                        "password": "",
                        "storeaddress": request.payload.storeAddr ? request.payload.storeAddr : "",
                        // "category": request.payload.storeCategory[0].en,
                        // "subCategory": request.payload.storeSubCategory[0].en,
                        //"category": request.payload.storeCategory[0].categoryName.en ? request.payload.storeCategory[0].categoryName.en : "",
                        //"subCategory": request.payload.storeSubCategory[0].subCategoryName.en ? request.payload.storeSubCategory[0].subCategoryName.en : "",
                        //removed above two key as of now 13/03/2019, will add back back secanario.
                        "foodType": request.payload.foodType ? request.payload.foodType : "",
                        "appLogo": request.payload.profileLogos.logoImage ? result.profileLogos.logoImage : "",
                        "webLogo": request.payload.bannerLogos.bannerimage ? result.bannerLogos.bannerimage : "",
                        "website": request.payload.website,
                        "description": request.payload.description[0] ? request.payload.description[0] : "",
                        "freeDeliveryAbove": request.payload.freeDeliveryAbove ? request.payload.freeDeliveryAbove : "",
                        "businessZoneName": request.payload.businessZoneName ? request.payload.businessZoneName : "",
                        "storeType": request.payload.storeType == 1 ? "Store" : "Franchises",
                        "recordType": request.payload.storeType == 1 ? "Store" : "Franchises",
                        "storeDriver": request.payload.storeDriver ? request.payload.storeDriver : "",
                        "companyDriver": request.payload.companyDriver ? request.payload.companyDriver : "",
                        "parentMongoId": request.payload.franchiseId ? request.payload.franchiseId : ""
                    }

                    if (authData) {
                        superagent
                            .put(authData.instanceUrl + '/services/apexrest/delivx/Store')
                            .send(DataToSF) // sends a JSON post body
                            .set('Accept', 'application/json')
                            .set('Authorization', 'Bearer ' + authData.accessToken)
                            .end((err, res) => {
                                if (err) {

                                }

                            });
                    }
                }
                /* salesforce over */
                return reply({ message: request.i18n.__('store')['200'], data: resultelastic }).code(200);
            })

            // return reply({ message: error['store']['200'], data: updateObj }).code(200);
        });
    });

}


const validator = {

    storeId: Joi.string().required().description('storeId'),
    name: Joi.array().items().description('productName'),
    ownerName: Joi.string().required().description('ownerName'),
    countryCode: Joi.string().required().description('countryCode'),
    countryId: Joi.string().required().description('countryId'),
    ownerPhone: Joi.string().allow('').description('ownerPhone'),
    ownerEmail: Joi.string().required().description('ownerEmail'),
    businessNumber: Joi.string().allow('').description('businessNumber'),
    website: Joi.string().allow('').description('website'),
    description: Joi.array().items().description('description'),
    //  businessAddress: Joi.array().items().description('businessAddress'),
    // billingAddress: Joi.string().description('billingAddress'),
    cityId: Joi.string().required().description('cityId'),
    cityName: Joi.string().required().description('cityName'),
    postalCode: Joi.string().allow('').description('postalCode'),
    driverExist: Joi.number().allow('').description('driverExist'),
    coordinates: Joi.object().keys().description('coordinates'),
    businessZoneId: Joi.string().required().description('businessZoneId'),
    businessZoneName: Joi.string().allow('').description('businessZoneName'),
    serviceZones: Joi.array().items().required().description('serviceZones'),
    firstCategory: Joi.array().items().description('firstCategory'),
    pricingStatus: Joi.string().allow('').description('pricingStatus'),
    minimumOrder: Joi.string().allow('').description('minimumOrder'),
    freeDeliveryAbove: Joi.string().allow('').description('freeDeliveryAbove'),
    pickupCash: Joi.number().allow('').description('pickupCash'),
    pickupCard: Joi.number().allow('').description('pickupCard'),
    cash: Joi.number().allow('').description('cash'),
    card: Joi.number().allow('').description('card'),
    orderType: Joi.string().allow('').description('orderType'),
    baseFare: Joi.number().allow('').description('baseFare'),
    pricePerMile: Joi.number().allow('').description('pricePerMile'),
    range: Joi.string().allow('').description('range'),
    budget: Joi.string().allow('').description('budget'),
    grocerDriver: Joi.string().allow('').description('grocerDriver'),
    storeDriver: Joi.string().allow('').description('storeDriver'),
    offlineDriver: Joi.string().allow('').description('offlineDriver'),
    Country: Joi.string().allow('').description('Country'),
    cityname: Joi.string().allow('').description('cityname'),
    countryname: Joi.string().allow('').description('countryname'),
    City: Joi.string().allow('').description('City'),
    maxImagesForProducts: Joi.string().allow('').description('maxImagesForProducts'),
    Basefare: Joi.string().allow('').description('Basefare'),
    Pricepermile: Joi.string().allow('').description('Pricepermile'),
    googleplusUrl: Joi.string().allow('').description('googleplusUrl'),
    facebookUrl: Joi.string().allow('').description('facebookUrl'),
    twitterUrl: Joi.string().allow('').description('twitterUrl'),
    instagramUrl: Joi.string().allow('').description('instagramUrl'),
    orderEmail: Joi.string().allow('').description('orderEmail'),
    deliveryCash: Joi.number().allow('').description('deliveryCash'),
    deliveryCard: Joi.number().allow('').description('deliveryCard'),
    imageFlag: Joi.string().allow('').description('imageFlag'),
    logoImage: Joi.string().allow('').description('logoImage'),
    bannerImage: Joi.string().allow('').description('bannerImage'),
    companyDriver: Joi.string().allow('').description('companyDriver'),
    currency: Joi.string().allow('').description('currency'),
    currencySymbol: Joi.string().allow('').description('currencySymbol'),
    posID: Joi.string().allow('').description('posID'),
    locationId: Joi.string().allow('').description('locationId'),
    walletID: Joi.string().allow('').description('walletID'),
    paymentsEnabled: Joi.string().allow('').description('paymentsEnabled'),
    locationName: Joi.string().allow('').description('locationName'),
    externalCreditCard: Joi.string().allow('').description('externalCreditCard'),
    internalCreditCard: Joi.string().allow('').description('internalCreditCard'),
    check: Joi.string().allow('').description('check'),
    quickCard: Joi.string().allow('').description('quickCard'),
    giftCard: Joi.string().allow('').description('giftCard'),
    profileLogos: Joi.object().keys().description('profileLogo'),
    bannerLogos: Joi.object().keys().description('bannerLogo'),
    bcountryCode: Joi.string().allow('').description('bcountryCode'),
    forcedAccept: Joi.number().allow('').description(" 1- Enabled, 2 - Disabled "),
    driverType: Joi.number().allow('').description("1 - Store Drivers, 2 - Central Pool Drivers/ Free Lancers"),
    baseFare: Joi.number().required().description('baseFare'),
    mileagePrice: Joi.number().required().description('mileagePrice'),
    mileagePriceAfterMinutes: Joi.number().required().description('mileagePriceAfterMinutes'),
    timeFee: Joi.number().required().description('timeFee'),
    timeFeeAfterMinutes: Joi.number().required().description('timeFeeAfterMinutes'),
    waitingFee: Joi.number().required().description('waitingFee'),
    waitingFeeAfterMinutes: Joi.number().required().description('waitingFeeAfterMinutes'),
    minimumFare: Joi.number().required().description('minimumFare'),
    onDemandBookingsCancellationFee: Joi.number().required().description('onDemandBookingsCancellationFee'),
    onDemandBookingsCancellationFeeAfterMinutes: Joi.number().required().description('onDemandBookingsCancellationFeeAfterMinutes'),
    scheduledBookingsCancellationFee: Joi.number().required().description('scheduledBookingsCancellationFee'),
    scheduledBookingsCancellationFeeAfterMinutes: Joi.number().required().description('scheduledBookingsCancellationFeeAfterMinutes'),
    convenienceFee: Joi.number().required().description('convenienceFee'),
    commission: Joi.number().required().description('commission'),
    commissionType: Joi.number().required().description('commissionType 0- percentage, 1- fixed'),
    sName: Joi.object().keys().description('sname'),
    storedescription: Joi.object().keys().description('storeDescription'),
    // storeaddress: Joi.string().description('storeAddress'),
    urlData: Joi.string().allow('').description('urlData'),
    statusMsg: Joi.string().allow('').description('statusMsg'),
    pickupCashMsg: Joi.string().allow('').description('pickupCashMsg'),
    pricingStatusMsg: Joi.string().allow('').description('pickupCashMsg'),
    pickupCardMsg: Joi.string().allow('').description('pickupCardMsg'),
    deliveryCardMsg: Joi.string().allow('').description('deliveryCardMsg'),
    deliveryCashMsg: Joi.string().allow('').description('deliveryCashMsg'),
    orderTypeMsg: Joi.string().allow('').description('orderTypeMsg'),
    driverTypeMsg: Joi.string().allow('').description('driverTypeMsg'),
    forcedAcceptMsg: Joi.string().allow('').description('forcedAcceptMsg'),
    commissionTypeMsg: Joi.string().allow('').description('commissionTypeMsg'),
    // billingAddr: Joi.object().keys().description('storeAddress'),
    autoApproval: Joi.number().description('autoApproval'),
    autoApprovalMsg: Joi.string().description('autoApprovalMsg'),
    autoDispatch: Joi.number().description('autoDispatch'),
    autoDispatchMsg: Joi.string().description('autoDispatchMsg'),
    // dispatchonAcceptance: Joi.number().description('dispatchonAcceptance'),
    // dispatchonAcceptanceMsg: Joi.string().description('dispatchonAcceptanceMsg'),
    storeCategory: Joi.array().items().description('storeCategory'),
    storeSubCategory: Joi.array().items().description('storeSubCategory'),
    socialLinks: Joi.object().keys().description('socialLinks'),
    avgDeliveryTime: Joi.string().description('avgDeliveryTime').allow(''),
    storeAddr: Joi.string().description('storeAddress'),
    storeBillingAddr: Joi.string().description('storeAddress'),
    streetName: Joi.string().allow('').description('streetName'),
    localityName: Joi.string().allow('').description('localityName'),
    areaName: Joi.string().allow('').description('areaName'),
    addressCompo: Joi.object().description('address Component'),
    storeType: Joi.number().required().description('storeType'),
    storeTypeMsg: Joi.string().required().description('storeTypeMsg'),

    cartsAllowed: Joi.number().required().description('cartsAllowed'),
    cartsAllowedMsg: Joi.string().required().description('cartsAllowedMsg'),
    franchiseId: Joi.string().allow("").description("Non mandatory field. Id of franchaise if available"),
    franchiseName: Joi.string().allow("").description("Franchise name if available"),
    costForTwo: Joi.number().allow("").description("Avg cost for two"),
    foodType: Joi.number().allow("").description("1 for veg, 2 - Non veg, 3- Both"),
    foodTypeName: Joi.string().allow("").description("Veg , Non veg or Both")

}

module.exports = { handler, validator }