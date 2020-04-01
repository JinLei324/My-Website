'use strict'

var stores = require('../../../../../models/stores');
var storesElastic = require('../../../../../models/storeElastic');
const error = require('../../../../../statusMessages/responseMessage'); // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Async = require('async');
const Auth = require('../../../../middleware/authentication');
/** salesforce
 * @library 
 * @author Umesh Beti
 */
const customer = require('../../../../../models/customer');
const cities = require('../../../../../models/cities');
const superagent = require('superagent');
const salesforce = require('../../../../../library/salesforce');
const underscore = require('underscore');


/*salesforce*/

/** 
 * @function
 * @name handler 
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {
	let dataSalesforce;
	let payloadDataSalesforce = request.payload;

	stores.get({}, (err, result) => {

		request.payload._id = new ObjectID();

		if (result && result.seqId) {
			request.payload.seqId = result.seqId + 1;
		} else {
			request.payload.seqId = 1;
		}
		request.payload.wallet = {
			"balance": 0,
			"blocked": 0,
			"hardLimit": 0,
			"softLimit": 0,
			"softLimitHit": false,
			"hardLimitHit": false
		};
		let resultObjElastic = Object.assign({}, request.payload);
		resultObjElastic.location = {
			"lat": request.payload.coordinates.latitude,
			"lon": request.payload.coordinates.longitude
		}
		resultObjElastic._id = resultObjElastic._id.toString();




		storesElastic.Insert(resultObjElastic, (err, resultelastic) => {

			if (err) {
				return reply({
					message: request.i18n.__('genericErrMsg')['500'],
					data: err
				}).code(500);
			}
			stores.insert(request.payload, (err, resultObj) => {
				if (err) return reply({
					message: request.i18n.__('genericErrMsg')['500']
				}).code(500);
				updateArea(request.payload.cityId, request.payload.areaName, resultObj.ops[0]._id)
				dataSalesforce = resultObj;
				var sname1 = payloadDataSalesforce.sName.en;
				if (config.salesforceService) {
					/* salesforce Author Umesh beti */


					salesforce.login(() => { });
					var authData = salesforce.get();
					var commissionType = request.payload.commissionType == 0 ? "Percentage" : "Fixed"
					var DataToSF = {
						"Name": sname1 ? sname1 : "",
						"mongoId": resultObj.ops[0]._id ? resultObj.ops[0]._id : "",
						"email": request.payload.ownerEmail ? request.payload.ownerEmail : "",
						"ownerPhone": request.payload.ownerPhone ? request.payload.ownerPhone : "",
						"ownerName": request.payload.ownerName ? request.payload.ownerName : "",
						"averageDeliveryTime": request.payload.avgDeliveryTime ? request.payload.avgDeliveryTime : "",
						"walletBalance": 0,
						"walletBlock": 0,
						"walletHardLimit": 0,
						"walletSoftLimit": 0,
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
						"password": request.payload.password ? request.payload.password : "",
						"storeaddress": payloadDataSalesforce.storeAddr ? payloadDataSalesforce.storeAddr : "",
						"category": resultObj.ops[0].storeCategory[0] ? resultObj.ops[0].storeCategory[0].categoryName.en : "",
						"subCategory": resultObj.ops[0].storeSubCategory[0] ? resultObj.ops[0].storeSubCategory[0].subCategoryName.en : "",

						// "category": resultObj.ops[0].storeCategory[0].categoryName.en,
						// "subCategory": resultObj.ops[0].storeSubCategory[0].subCategoryName.en,
						"appLogo": resultObj.ops[0].profileLogos.logoImage ? resultObj.ops[0].profileLogos.logoImage : "",
						"webLogo": resultObj.ops[0].bannerLogos.bannerimage ? resultObj.ops[0].bannerLogos.bannerimage : "",
						"storeDriver": request.payload.storeDriver ? request.payload.storeDriver : "",
						"companyDriver": request.payload.companyDriver ? request.payload.companyDriver : "",
						"franchisee": "",
						"freeDeliveryAbove": request.payload.freeDeliveryAbove ? request.payload.freeDeliveryAbove : "",
						"businessZoneName": request.payload.businessZoneName ? request.payload.businessZoneName : "",
						"foodType": request.payload.foodType ? request.payload.foodType : "",
						"averageRating": 0,
						"storeType": request.payload.storeTypeMsg ? request.payload.storeTypeMsg : "",
						"website": resultObj.ops[0].website ? resultObj.ops[0].website : "",
						"description": resultObj.ops[0].description[0] ? resultObj.ops[0].description[0] : "",
						"recordType": "Store",
						"parentMongoId": request.payload.franchiseId ? request.payload.franchiseId : ""

					}



					if (authData) {
						superagent
							.put(authData.instanceUrl + '/services/apexrest/delivx/Store')
							.set('Accept', 'application/json')
							.set('Authorization', 'Bearer ' + authData.accessToken)
							.send(DataToSF) // sends a JSON post body
							.end((err, res) => {
								if (err) {
									logger.warn('New Store sent to salesforece failed', err);
								} else {
									logger.info('New Store sent to salesforece Success')
								}
							});
					}
					/* salesforce */
				}
				let authToken = Auth.SignJWT({
					_id: resultObj.insertedIds[0],
					key: 'acc',
					deviceId: ""
				}, 'manager', config.accTokenExp);
				let dataObj = {
					urlData: resultObj.ops[0].urlData,
					appId: resultObj.insertedIds[0],
					token: authToken,
					storeId: resultObj.insertedIds[0],
					ownerPhone: resultObj.ops[0].ownerPhone ? resultObj.ops[0].ownerPhone.toString() : "",
					countryCode: resultObj.ops[0].countryCode ? resultObj.ops[0].countryCode.toString() : "",
					ownerEmail: resultObj.ops[0].ownerEmail ? resultObj.ops[0].ownerEmail.toString() : "",
					storeName: resultObj.ops[0].name ? resultObj.ops[0].name[request.headers.language] : ""
				}
				//salseForese
				// return reply({ message: error['store']['200'][0], data: dataObj }).code(200);
				return reply({
					message: request.i18n.__('store')['200'],
					data: dataObj
				}).code(200);



			});


		})



	});
};

function updateArea(cityId, areaName, storeId) {

	var area = {}

	// get the city details 

	cities.readByCityId({
		"cities.cityId": new ObjectID(cityId),
	}, (err, result) => {
		if (result) {

			/*
			Check if the area key  does not exists then push the new are to the city data
			if area key exists
					-> Area name exists , update the store id to the area
					-> Area name does not exists then update the new area with area
			*/
			if ("area" in result.cities[0]) {
				var areaDetails = underscore.findWhere(result.cities[0], {
					name: areaName
				});
				if (areaDetails) {

					// Push store id to the area
					// cities.updateArea({
					// 	"cities.cityId": new ObjectID(cityId),
					// 	"cities."
					// }, {
					// 	"cities.$.area.$.": area
					// }, (err, response) => {
					// 	logger.info('Area updated to city')
					// })


				} else {
					// Add the new area
					area = {
						name: areaName,
						storeId: [
							storeId
						]
					}
					cities.updateArea({
						"cities.cityId": new ObjectID(cityId)
					}, {
							$push: {
								"cities.$.area": area
							}
						}, (err, response) => {
							logger.info('Area updated to city')
						})


				}

			} else {
				// Push the area object to the city
				area = [{
					name: areaName,
					storeId: [
						storeId
					]
				}]
				cities.updateArea({
					"cities.cityId": new ObjectID(cityId)
				}, {
						$set: {
							"cities.$.area": area
						}
					}, (err, response) => {
						logger.info('Area updated to city')
					})
			}


		} else {

		}
	})
}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
	name: Joi.array().items().required().description('Name of the store'),
	ownerName: Joi.string().required().description('Name of the owner'),
	countryCode: Joi.string().required().description('country code. Ex : "+91" for India'),
	countryId: Joi.string().required().description('Country Mongo ID. Ex : "5af45724f5a599527c31f68e"'),
	ownerPhone: Joi.string().allow('').description('Owner phone number'),
	ownerEmail: Joi.string().required().description('Email id of the owner'),
	businessNumber: Joi.string().allow('').description('Business Number'),
	password: Joi.string().required().description('Password for login'),
	website: Joi.string().allow('').description('Wesite address.'),
	description: Joi.array().items().description('Brief description about the store'),
	// businessAddress: Joi.array().items().description('businessAddress'),
	// billingAddress: Joi.string().description('billingAddress'),
	cityId: Joi.string().required().description('MongoId of the city.'),
	cityName: Joi.string().required().description('Name of the city'),
	postalCode: Joi.string().allow('').description('Postal code'),
	driverExist: Joi.number().allow('').description('Driver Exists'),
	coordinates: Joi.object().keys().required().description('coordinates of the store'),
	businessZoneId: Joi.string().required().description('businessZoneId'),
	businessZoneName: Joi.string().allow('').description('businessZoneName'),
	serviceZones: Joi.array().items().required().description('serviceZones'),
	firstCategory: Joi.array().items().description('firstCategory'),
	status: Joi.number().required().description('status'),
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
	// billingAddr: Joi.string().description('billingAddr'),
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
	appId: Joi.string().description('appId').allow(''),
	storeAddr: Joi.string().description('storeAddress'),
	storeBillingAddr: Joi.string().allow('').description('storeBillingAddr'),
	streetName: Joi.string().allow('').description('streetName'),
	localityName: Joi.string().allow('').description('localityName'),
	areaName: Joi.string().allow('').description('areaName'),
	addressCompo: Joi.object().description('address Component'),
	storeType: Joi.number().required().description('storeType'),
	storeTypeMsg: Joi.string().required().description('storeTypeMsg'),
	cartsAllowed: Joi.number().required().description('cartsAllowed'),
	cartsAllowedMsg: Joi.string().required().description('cartsAllowedMsg'),
	dp_id: Joi.string().description('dp_id').allow(""),
	dp_email: Joi.string().description('dp_email').allow(""),
	dp_name: Joi.string().description('dp_name').allow(""),
	// consumptionTime: Joi.object().keys().description('Recomended time to consume'),
	franchiseId: Joi.string().allow("").description("Id of franchaise if available"),
	franchiseName: Joi.string().allow("").description("Franchise name if available"),
	costForTwo: Joi.number().allow("").description("Avg cost for two"),
	foodType: Joi.number().allow("").description("1 for veg, 2 - Non veg, 3- Both"),
	foodTypeName: Joi.string().allow("").description("Veg , Non veg or Both"),


}

/**
 * A module that exports customer get cart handler, get cart validator! 
 * @exports handler 
 */
module.exports = {
	handler,
	validator
}