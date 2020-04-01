"use strict";

const Joi = require("joi");
const logger = require("winston");
var async = require("async");
var moment = require("moment");
var config = process.env;
// const webSocket = require('../../../../library/websocket');
const webSocket = require("../../../../library/websocket/websocket");

const redis = require("../../../../library/redis");
const rabbitMq = require("../../../../library/rabbitMq");
const orders = require("../../../../models/orders");
const storeManagers = require("../../../../models/storeManagers");
const newOrders = require("../../../../models/order");
const bookingsUnassigned = require("../../../../models/bookingsUnassigned");
const bookingExpired = require("../../../../models/bookingExpired");
const bookingsPast = require("../../../../models/bookingsPast");
const expiredOrders = require("../../../../models/expiredOrders");
const campaignAndreferral = require("../../../../web/routes/campaignAndreferral/promoCode/post");

const ObjectId = require("mongodb").ObjectID;
const customer = require("../../../../models/customer");
const stores = require("../../../../models/stores");

const masters = require("../../../../models/driver");
const zones = require("../../../../models/zones");
const notifyi = require("../../../../library/mqttModule/mqtt");
var notifications = require("../../../../library/fcm");
const presence = require("../../../commonModels/presence");
const dispatcher = require("../../../commonModels/dispatcher");
const workingHour = require('../../../commonModels/workingHour');
const i18n = require('../../../../locales/locales');

var accounting = require("../../../commonModels/accounting/accounting");
const serverDispatcher = require("../../../../worker/handlers/serverDispatcher");

// var stripeCharges = require('../../../../models/stripeCharges');
var statusMsg =
	"Sorry , we cannot take up your delivery request at this moment , all our drivers are busy. Please try again after sometime";
const ObjectID = require("mongodb").ObjectID;

const client = redis.client;

var managerTopics = require("../../../commonModels/managerTopics");
var geo = require("georedis").initialize(client);
let cityZone = [];
let cityList = [];
const cities = require("../../../../models/cities");
const payloadValidator = Joi.object({
	pattern: Joi.any()
		.required()
		.description("pattern")
		.error(new Error("pattern is missing")),
	channel: Joi.any()
		.required()
		.description("channel")
		.error(new Error("channel is missing")),
	message: Joi.any()
		.required()
		.description("message")
		.error(new Error("message is missing"))
}).required();

const APIHandler = (req, reply) => {
	redisEventListner(req.payload.pattern, req.payload.channel, req.payload.message);
	reply({ message: "success for redisEnvent" }).code(200);
};

/**
 *
 * @param {*} pattern
 * @param {*} channel
 * @param {*} message
 */
function redisEventListner(pattern, channel, message) {
	i18n.setLocale(config.DEFAULT_LANGUAGE);
	switch (channel) {
		case "__keyevent@0__:hset":
			break;

		case "__keyevent@0__:del":
			break;

		case "__keyevent@0__:expired":
			var booking = message.split("_");
			switch (booking[0]) {
				case "que":
					queExpire(booking[1]);
					break;

				case "centralQue":
					centralQueExpire(booking[1]);
					break;
				case "bid":
					bookingsUnassigned.SelectOne({ orderId: Number(booking[1]) }, function (err, bookingdata) {
						if (bookingdata) {
							var email = "";
							var fName = "";
							if (
								typeof bookingdata.dispatched !== "undefined" &&
								Array.isArray(bookingdata.dispatched) &&
								bookingdata.dispatched.length > 0
							) {
								email = bookingdata.dispatched[bookingdata.dispatched.length - 1].email;
								fName = bookingdata.dispatched[bookingdata.dispatched.length - 1].fName;
							}
							let dispatcherData = {
								status: 101,
								bid: Number(booking[1]),
								name: fName,
								email: email,
								inDispatch: bookingdata.inDispatch
							};
							notifyi.notifyRealTime({ listner: "bookingChn", message: dispatcherData });

							bookingsUnassigned.Update({ orderId: Number(booking[1]) }, { isPopupShowing: false }, () => { });
							var bookingData1 = {
								bid: Number(booking[1])
							};

							// if (bookingdata.dispatchSetting.dispatchMode == 0) {
							// client.del("que_" + Number(booking[1]), function (err, reply) { });
							client.del("bid_" + Number(booking[1]), function (err, reply) { });
							// } else {
							rabbitMq.sendToQueue(rabbitMq.queueRetry, bookingData1, (err, doc) => { });
							// }
							return 1;
						}
					});

					break;

				case "laterQue":
					var bookingData1 = {
						bid: Number(booking[1])
					};
					break;

				case "presence":
					if (booking[1].length == 24) {
						masters.makeInActive({ id: booking[1], status: 9 }, (err, response) => {
							// to make timedout to driver
							// driver.setExPresence({ key: 'inactive_' + id[1], presenceTime: 20, extra: id[1] }, (err, result) => {// to add driver to logout  to make after 20s driver logout state
							// });
							presence.driverStatusPresence({ mid: booking[1], status: 9 }, (err, res) => { });
							dispatcher.providerStatus({ _id: booking[1], status: 9 }, (err, res) => { });
						});
					}
					break;
				case "inactive":
					if (booking[1].length == 24) {
						masters.makeInActive({ id: booking[1], status: 8 }, (err, response) => { });
					}
					break;
				case "did":
					masters.updateWithoutPromise({ _id: new ObjectID(booking[1]) }, { isPopupShowing: false }, () => { });
					break;

				case "citiesZone":
					updateCityZone();
					break;
				case "totalCities":
					updateCityList();
					break;
				case "nowBooking":
					nowBookingExpire(booking[1]);
				case "storeAcceptExpire":
					storeAcceptExpire(booking[1]);
					break;
				case 'storeOpen':
				case 'storeNextOpen':

					workingHour.workingHourCheck(booking[1], (err, res) => {
						if (err) {
							logger.error('Store Working Hours Event Redis error :', err);
						} else {
							logger.info('Store Working Hours Event result : ', res);
						}
					});
					break;
			}
			break;
	}
}

function expireBooking(bid) {
	bookingsUnassigned.SelectOne({ orderId: bid }, (err, bookingdata) => {
		if (err) {
		} else {
			var updatedata = {
				$set: {
					status: 20,
					statusMsg: "Expired",
					statusText: "Expired",
					"timeStamp.expiredBy": {
						statusUpdatedBy: "central",
						userId: "",
						timeStamp: moment().unix(),
						isoDate: new Date(),
						location: {
							longitude: 0,
							latitude: 0
						},
						message: "expired",
						ip: ""
					}
				},
				$push: {
					activities: {
						bid: bid,
						status: 20,
						msg: "expired",
						time: moment().unix(),
						isoDate: new Date(),
						lat: 0,
						long: 0
					}
				}
			};

			bookingsUnassigned.FINDONEANDUPDATE({ query: { orderId: Number(bid) }, data: updatedata }, (err, updateObj) => {
				if (updateObj.value) {
					bookingExpired.createNewBooking(updateObj.value, (err, insertedObj) => { });

					//need to send notification to customer and store
				}
			});
		}
	});
}

var jsonfile = require("jsonfile");
var file = "cityZone.json";
var citiesListFile = "citiesList.json";

jsonfile.readFile(file, function (err, obj) {
	if (err) logger.warn("read file Error : ", err);
	if (typeof obj != "undefined") {
		cityZone = obj;
	}
});
jsonfile.readFile(citiesListFile, function (err, obj) {
	if (err) logger.warn("read file Error : ", err);
	if (typeof obj != "undefined") {
		cityList = obj;
	}
});
function updateCityZone() {
	zones.readAll({}, function (err, citiesRes) {
		jsonfile.writeFile(file, citiesRes, function (err, obj) {
			if (err) logger.error("write file Error : ", err);
			else {
				jsonfile.readFile(file, function (err, obj) {
					if (err) logger.warn("read file Error : ", err);
					if (typeof obj != "undefined") {
						cityZone = obj;
					}
				});
			}
		});
	});
}
function updateCityList() {
	let cond = [{ $unwind: "$cities" }];
	cities.aggregate(cond, function (err, citieRes) {
		let newCities = [];
		if (citieRes && citieRes.length > 0) {
			for (let i = 0; i < citieRes.length; i++) {
				newCities.push(citieRes[i].cities);
			}
		}
		jsonfile.writeFile(citiesListFile, newCities, function (err, obj) {
			if (err) logger.error("write file Error : ", err);
			else {
				jsonfile.readFile(citiesListFile, function (err, obj) {
					if (err) logger.info("read file Error : ", err);
					if (typeof obj != "undefined") {
						cityList = obj;
					}
				});
			}
		});
	});
}

const isWithinPolygons = (latitude, longitude, callback) => {
	let point = {
		type: "Feature",
		id: " dsfasfasfsaf",
		geometry: {
			type: "Point",
			coordinates: [longitude, latitude]
		}
	};
	let dataObj = null;
	let polygon = {
		type: "Feature",
		geometry: {
			type: "Polygon",
			coordinates: []
		}
	};
	for (var key = 0; key < cityZone.length; key++) {
		polygon.geometry = cityZone[key].polygons;
		if (turf.inside(point, polygon)) {
			dataObj = cityZone[key];
			break;
		}
	}
	return callback(null, dataObj);
};

const isCityWithinPolygons = (latitude, longitude, callback) => {
	let point = {
		type: "Feature",
		id: " dsfasfasfsaf",
		geometry: {
			type: "Point",
			coordinates: [longitude, latitude]
		}
	};
	let dataObj = null;
	let polygon = {
		type: "Feature",
		geometry: {
			type: "Polygon",
			coordinates: []
		}
	};
	for (var key = 0; key < cityList.length; key++) {
		polygon.geometry = cityList[key].polygons;

		if (turf.inside(point, polygon)) {
			dataObj = cityList[key];
			break;
		}
	}
	return callback(null, dataObj);
};

function queExpire(orderId) {
	logger.info("queExpire")
	bookingsUnassigned.SelectOne({ orderId: parseInt(orderId) }, function (err, bookingdata) {
		if (err) {
			logger.error("Error 1 : " + err);
		} else if (bookingdata) {
			if (bookingdata.dispatchSetting.dispatchMode == 1 && bookingdata.CentralDispatchExpriryTime > 0) {
				logger.info("sendBookingToCentralDispatcher")
				sendBookingToCentralDispatcher(bookingdata);
			} else {
				logger.info("expireBookingAction")
				expireBookingAction(orderId);
			}
		} else {

		}
	});
}

function nowBookingExpire(orderId) {
	// orders.patchExpiry({ orderId: parseInt(orderId), status: 20 }, "newOrder", (err, response) => {
	// 	// newOrder.patchExpiry({ orderId: parseInt(orderId), status: 20 }, (err, response) => {
	// 	if (response.value && Object.keys(response.value).length > 0) {
	// 		let data = response.value;

	// 		expiredOrders.saveRecord(response.value, (err, insertedData) => {
	// 			logger.warn("inserted to expry");
	// 			orders.remove({ orderId: parseInt(orderId) }, "newOrder", (err, removedData) => {
	// 				logger.warn("removed expired bokng");
	// 			});

	// 			if (response.value && response.value.claimDetails && response.value.claimDetails.claimId != "") {
	// 				logger.warn("unlock couponcode api called expiring order order");
	// 				superagent
	// 					.post(config.API_URL + "/unlockPromoCode")
	// 					.send({ claimId: response.value.claimDetails.claimId })
	// 					.end(function (err, res) { });
	// 			}

	// 			client.del("storeAcceptExpire_" + Number(orderId), function (err, reply) { });
	// 		});
	// 	}
	// });


	let orderDetails = {};
	let storeData = {};
	let customerData = {};
	let expireOrderData = {};
	const getOrders = () => {
		return new Promise((resolve, reject) => {
			newOrders.isExistsWithOrderId(
				{ orderId: parseInt(orderId) },
				(err, res) => {
					orderDetails = res ? res : orderDetails;
					return err
						? reject({ message: err, code: 500 })
						: resolve(orderDetails);
				}
			);
		});
	};


	const readStore = orderDetails => {
		return new Promise((resolve, reject) => {
			stores.isExistsWithId(
				{ _id: orderDetails.storeId ? new ObjectId(orderDetails.storeId) : "" },
				(err, res) => {
					storeData = res ? res : {};
					return err
						? reject({ message: err, code: 500 })
						: resolve(orderDetails);
				}
			);
		});
	};

	const readCustomer = orderDetails => {
		return new Promise((resolve, reject) => {
			customer.isExistsWithCond(
				{ _id: new ObjectId(orderDetails.customerDetails.customerId) },
				(err, custData) => {
					if (err) {
						logger.error(
							"Error occurred appConfig (get): " + JSON.stringify(err)
						);
					}
					customerData = custData;
					return resolve(orderDetails);
				}
			);
		});
	};

	const paymentRefund = orderDetails => {
		return new Promise((resolve, reject) => {
			if (orderDetails.stripeCharge && orderDetails.paymentType == 1 && orderDetails.paidBy.card > 0) {
				//synchronous stripe code
				stripeTransaction
					.refundCharge(
						orderDetails.stripeCharge.id,
						orderDetails.paidBy.card,
						req
					)
					.then(data => {
						expireOrderData.refundCharge = data;
						return resolve(orderDetails);
					})
					.catch(e => {
						logger.warn("error while refund" + e);
						return reject({ code: 400, message: e });
						// return resolve(orderDetails);
					});
			} else if (orderDetails.payByWallet == 1) {
				// release blocked wallet
				customer.releaseBlockWalletBalance(
					{
						userId: orderDetails.customerDetails.customerId,
						createdBy: "expired",
						amount: orderDetails.paidBy.wallet
					},
					(err, data) => {
						if (err) {
							return reject({ code: 400, message: err });
						} else {
							return resolve(orderDetails);
						}
					}
				);
			} else {
				return resolve(orderDetails);
			}
		});
	};

	const deductCancellationFee = orderDetails => {
		return new Promise((resolve, reject) => {
			if (Object.keys(orderDetails).length > 0) {

				expireOrderData.createdBy = "expired";
				expireOrderData.userId = "expired";
				expireOrderData.driverCommPer = orderDetails.accouting.driverCommPer ? orderDetails.accouting.driverCommPer : 10;
				expireOrderData.storeCommPer = orderDetails.storeCommission;


				if (expireOrderData.status == 16) {
					let fullChargeCustomerArray = [5, 6, 12, 13, 14];

					let CancellationFeeCustomerArray = [1, 4, 8, 10, 40, 21];

					let deliveryFeeCustomerArray = [11];

					var indFullCharge = fullChargeCustomerArray.indexOf(parseInt(orderDetails.status));
					var indCancellationCharge = CancellationFeeCustomerArray.indexOf(parseInt(orderDetails.status));
					var indDeliveryCharge = deliveryFeeCustomerArray.indexOf(parseInt(orderDetails.status));
					if (indFullCharge >= 0) {
						expireOrderData.cancFee = orderDetails.totalAmount;
						expireOrderData.cancCartTotal = parseFloat(orderDetails.cartTotal);
						expireOrderData.cancDeliveryFee = orderDetails.storeFreeDelivery ? orderDetails.storeDeliveryFee : orderDetails.deliveryCharge;
					}
					if (indCancellationCharge >= 0) {
						if (orderDetails.bookingType == 1) {
							// 1 - now booking 2- later or scheduled
							// if (
							//   (parseInt(moment().valueOf()) - orderDetails.orderId) / 1000 <
							//   storeData.onDemandBookingsCancellationFeeAfterMinutes * 60
							// ) {
							//   expireOrderData.cancFee = 0;
							// } else {
							expireOrderData.cancFee = storeData.onDemandBookingsCancellationFee
								? storeData.onDemandBookingsCancellationFee
								: 0;
							// }
						} else {
							// if (
							//   (parseInt(moment().valueOf()) - orderDetails.orderId) / 1000 <
							//   storeData.scheduledBookingsCancellationFeeAfterMinutes * 60
							// ) {
							//   expireOrderData.cancFee = 0;
							// } else {
							expireOrderData.cancFee = storeData.scheduledBookingsCancellationFee
								? storeData.scheduledBookingsCancellationFee
								: 0;
							// }
						}
						expireOrderData.cancCartTotal = parseFloat(0);
						expireOrderData.taxes = parseFloat(0);
						expireOrderData.cancDeliveryFee = parseFloat(expireOrderData.cancFee);

						expireOrderData.storeCommPer = 100;
						expireOrderData.driverCommPer = 100;
					}
					if (indDeliveryCharge >= 0) {
						expireOrderData.cancFee = orderDetails.storeFreeDelivery ? orderDetails.storeDeliveryFee : orderDetails.deliveryCharge;
						expireOrderData.cancCartTotal = parseFloat(0);
						expireOrderData.taxes = parseFloat(0);
						expireOrderData.cancDeliveryFee = parseFloat(expireOrderData.cancFee);
						expireOrderData.storeCommPer = 100;
					}
				}
				if (expireOrderData.status == 17) {
					expireOrderData.cancFee = 0;
					expireOrderData.cancCartTotal = parseFloat(0);
					expireOrderData.taxes = parseFloat(0);
					expireOrderData.cancDeliveryFee = parseFloat(0);
				}
				if (expireOrderData.status == 2) {
					expireOrderData.cancFee = 0;
					expireOrderData.cancCartTotal = parseFloat(0);
					expireOrderData.taxes = parseFloat(0);
					expireOrderData.cancDeliveryFee = parseFloat(0);
				}

				let currentBal = customerData.wallet ? customerData.wallet.balance : 0;
				let walletCharge = 0;
				let cardCharge = 0;
				//charge Cancellation fee
				if (expireOrderData.cancFee > 0) {
					let totalAmountToCharge = expireOrderData.cancFee;
					if (orderDetails.payByWallet == 1) {
						// wallet
						walletCharge = totalAmountToCharge;
						if (currentBal < walletCharge) {
							walletCharge = currentBal;
						}
						totalAmountToCharge = totalAmountToCharge - walletCharge;
					}

					if (orderDetails.paymentType == 1 && totalAmountToCharge > 0 && orderDetails.stripeCharge) {
						cardCharge = totalAmountToCharge;

						stripeTransaction
							.createAndCaptureCharge(
								req,
								orderDetails.customerDetails.customerId,
								orderDetails.stripeCharge.source.id,
								cardCharge,
								orderDetails.currency ? orderDetails.currency : "",
								"Cancellation fee for customer cancel order",
								{
									customerId: orderDetails.customerDetails
										? orderDetails.customerDetails.customerId.toString()
										: "",
									bookingId: orderDetails.orderId,
									customerName: orderDetails.customerDetails
										? orderDetails.customerDetails.name
										: "",
									customerPhone: orderDetails.customerDetails
										? orderDetails.customerDetails.mobile
										: ""
								}
							)
							.then(data => {
								orderDetails.cardCharge = cardCharge;
								return resolve(orderDetails);
							})
							.catch(e => {
								// totalAmountToCharge = totalAmountToCharge - cardCharge;
								walletCharge += cardCharge;

								if (totalAmountToCharge > 0 || walletCharge > 0) {
									walletCharge += totalAmountToCharge;
									//charge From wallet
									let walletData = {
										userId: orderDetails.customerDetails.customerId,
										trigger: "Debit",
										comment: "Cancellation Fee " + expireOrderData.cancFee,
										currency: orderDetails.currency,
										currencyAbbr: 1,
										currencySymbol: orderDetails.currencySymbol,
										txnType: 2,
										wallet: false,
										amount: walletCharge,
										tripId: 0,
										serviceTypeText: orderDetails.serviceTypeText || "",
										bookingTypeText: orderDetails.bookingTypeText || "",
										paymentTypeText: orderDetails.paymentTypeText || "",
										cityName: orderDetails.cityName || "",
										cityId: orderDetails.cityId
											? orderDetails.cityId.toString()
											: "",
										userType: 1,
										initiatedBy: "Customer",
										calculateClosingBalance: 1
									};

									// wallet.walletTransction(walletData, (err, res) => {
									// orderDetails.walletCharge = walletCharge;
									return resolve(orderDetails);
									// });
								}
							});
					} else {
						cardCharge = totalAmountToCharge;

						totalAmountToCharge = totalAmountToCharge - cardCharge;
						walletCharge += cardCharge;

						if (totalAmountToCharge > 0 || walletCharge > 0) {
							walletCharge += totalAmountToCharge;
							//charge From wallet
							let walletData = {
								userId: orderDetails.customerDetails.customerId,
								trigger: "Debit",
								comment: "Cancellation Fee " + expireOrderData.cancFee,
								currency: orderDetails.currency,
								currencyAbbr: 1,
								currencySymbol: orderDetails.currencySymbol,
								txnType: 2,
								wallet: false,
								amount: walletCharge,
								tripId: 0,
								serviceTypeText: orderDetails.serviceTypeText || "",
								bookingTypeText: orderDetails.bookingTypeText || "",
								paymentTypeText: orderDetails.paymentTypeText || "",
								cityName: orderDetails.cityName || "",
								cityId: orderDetails.cityId
									? orderDetails.cityId.toString()
									: "",
								userType: 1,
								initiatedBy: "Customer",
								calculateClosingBalance: 1
							};

							// wallet.walletTransction(walletData, (err, res) => {
							//   orderDetails.walletCharge = walletCharge;
							return resolve(orderDetails);
							// });
						}
					}
				} else {
					return resolve(orderDetails);
				}
			} else {
				logger.warn("bookng nt found");
			}
		});
	};

	getOrders()
		.then(readStore)
		.then(paymentRefund)
		.then(readCustomer)
		// .then(deductCancellationFee)
		.then(dataObj => {
			expireOrderData.orderId = parseInt(orderId);
			expireOrderData.status = 20;
			expireOrderData.statusMsg = i18n.__(i18n.__('bookingStatusMsg')['20'])
			expireOrderData.reason = i18n.__(i18n.__('bookingStatusMsg')['20'])
			// modelName.cancelOrders(expireOrderData, (err, res) => {
			orders.patchExpiry(expireOrderData, "newOrder", (err, res) => {
				if (err) {
					logger.error(
						"Error occurred during driver order cancel (cancelOrders) : " +
						JSON.stringify(err)
					);
					// return reply({
					// 	message: req.i18n.__("genericErrMsg")["500"]
					// }).code(500);
				}
				delete res.value._id;
				if (res.value) {
					// res.value.cartTotal = expireOrderData.cancFee;
					// res.value.deliveryCharge = 0;
					// res.value.storeDeliveryFee = 0;
					res.value.paidBy.card = dataObj.cardCharge || 0;
					res.value.paidBy.wallet = dataObj.walletCharge || 0;
				}

				expiredOrders.saveRecord(res.value, (err, insertedData) => {
					if (err) {
						logger.error(
							"Error occurred during driver order cancel (pushOrder) : " +
							JSON.stringify(err)
						);
						// return reply({
						// 	message: req.i18n.__("genericErrMsg")["500"]
						// }).code(500);
					}
					orders.remove({ orderId: parseInt(orderId) }, "newOrder", (err, removedData) => {
						if (err) {
							logger.error(
								"Error occurred during driver order cancel (remove) : " +
								JSON.stringify(err)
							);
							return reply({
								message: req.i18n.__("genericErrMsg")["500"]
							}).code(500);
						}

						res.value.reason = expireOrderData.reason;
						res.value.fromName = "app";
						res.value.createdBy = "app";

						let inventoryData = [];
						for (let y = 0; y < res.value.Items.length; y++) {
							inventoryData.push({
								orderId: res.value.orderId,
								userId: res.value.customerDetails.customerId,
								unitId: res.value.Items[y].unitId,
								productId: res.value.Items[y].childProductId,
								triggerType: 1,
								quantity: res.value.Items[y].quantity,
								description: "Order cancelled (Refund)"
							});
						}
						sendNotification(res.value);

						// if (res.value && res.value.claimDetails && res.value.claimDetails.claimId != "") {
						//     superagent.post(config.API_URL + '/unlockPromoCode')
						//         .send({ claimId: res.value.claimDetails.claimId })
						//         .end(function (err, res) {
						//         });
						// }
						if (
							res.value.claimData &&
							Object.keys(res.value.claimData).length !== 0 &&
							res.value.claimData != null &&
							res.value.claimData.claimId != ""
						) {
							campaignAndreferral.unlockCouponHandler(
								{ claimId: res.value.claimData.claimId },
								(err, res) => { }
							);
						}

						// accounting
						// 	.cancellation(parseInt(orderId)) // accounting/pickup
						// 	.then(orderAccount => {
						// 		if (orderAccount.data) {
						// 			const rec = {
						// 				cashCollected: 0,
						// 				cardDeduct: 0,
						// 				WalletTransaction:
						// 					orderAccount.dataObj.accouting.cancelationFee,
						// 				pgComm: orderAccount.dataObj.accouting.pgEarningValue,
						// 				appEarning: orderAccount.dataObj.accouting.appEarningValue,
						// 				driverId: orderAccount.dataObj.driverId || "",
						// 				driverEarning:
						// 					orderAccount.dataObj.accouting.driverEarningValue,
						// 				storeId: orderAccount.dataObj.storeId || "",
						// 				storeEarning: orderAccount.dataObj.accouting.storeEarningValue,
						// 				franchiseId: orderAccount.dataObj.franchiseId || "",
						// 				franchiseEarning:
						// 					orderAccount.dataObj.accouting.franchiseEarningValue,
						// 				partnerId: orderAccount.dataObj.partnerId || "",
						// 				partnerEarning:
						// 					orderAccount.dataObj.accouting.partnerEarningValue,
						// 				userId: orderAccount.dataObj.customerDetails.customerId,
						// 				currency: orderAccount.dataObj.currency,
						// 				currencySymbol: orderAccount.dataObj.currencySymbol,
						// 				orderId: orderAccount.dataObj.orderId,
						// 				serviceType: orderAccount.dataObj.serviceType,
						// 				serviceTypeText:
						// 					orderAccount.dataObj.serviceType === 1
						// 						? "delivery"
						// 						: "pickup",
						// 				driverType:
						// 					typeof orderAccount.dataObj.driverDetails != "undefined" &&
						// 						typeof orderAccount.dataObj.driverDetails.driverType !=
						// 						"undefined"
						// 						? orderAccount.dataObj.driverDetails.driverType
						// 						: 1,
						// 				paymentTypeText: orderAccount.dataObj.paymentTypeMsg,
						// 				cityName: orderAccount.dataObj.city,
						// 				cityId: orderAccount.dataObj.cityId
						// 			};
						// 			walletEntryModel.walletEntryForOrdering(
						// 				rec,
						// 				(error, result) => {
						// 					//     if (error) {
						// 					//         logger.error('error : ' + error)
						// 					//     }
						// 				}
						// 			);
						// 			// return reply({
						// 			// 	message: req.i18n.__("bookings")["201"],
						// 			// 	data: res ? res.value : {}
						// 			// }).code(201);
						// 			// })
						// 		}
						// 	})
						// 	.catch(e => {
						// 		logger.error("accounting error : ", e);
						// 	});
					});
				});
			});
		})
		.catch(e => {
			logger.error(
				"Error occurred update order expired (catch): ", e
			);

		});
}
function storeAcceptExpire(orderId) {

	bookingsUnassigned.SelectOne({ orderId: parseInt(orderId) }, function (err, bookingdata) {
		if (err) {
			logger.error("Error 1 : " + err);
		} else if (bookingdata) {
			if (bookingdata.autoDispatch == 1) {

				var updateObj = {
					$set: {
						status: 40,
						statusMsg: i18n.__(i18n.__('bookingStatusMsg')['40s']),
						statusText: i18n.__(i18n.__('bookingStatusMsg')['40s']),
						inDispatch: true
					}
				};
				if (bookingdata.forcedAccept == 1 && bookingdata.autoDispatch == 1) {
					// bookingdata.visiableInAccept = false;
					updateObj["$set"].visiableInAccept = false;
				}

				orders.findOneAndUpdate({ q: { orderId: parseInt(orderId) }, data: updateObj }, "unassignOrders", (err, updated) => {
					serverDispatcher.nowBooking(parseInt(orderId), function (err, bookingdata) { });
					orders.getOrder({ orderId: parseInt(orderId) }, "unassignOrders", (err, orderObj) => {
						managerTopics.sendToWebsocket(orderObj, 2, (err, res) => { });
					});
				});
			} else {
				if (bookingdata.dispatchSetting.dispatchMode == 1 && bookingdata.CentralDispatchExpriryTime > 0) {
					sendBookingToCentralDispatcher(bookingdata);
				} else {
					expireBookingAction(orderId);
				}
			}
		} else {
			nowBookingExpire(orderId);

		}
	});
}
function sendBookingToCentralDispatcher(bookingdata) {
	let data = bookingdata;
	managerTopics.sendToWebsocket(data, 2, (err, res) => { });

	//================set central queue in redis =========>
	client.setex("centralQue_" + bookingdata.orderId, bookingdata.CentralDispatchExpriryTime, moment().unix(), function (
		err,
		result
	) { });

	//================ update booking status =========>
	bookingsUnassigned.FINDONEANDUPDATE(
		{
			query: { _id: new ObjectID(bookingdata._id) },
			data: {
				$set: {
					inDispatch: false
					// expiryDate: bookingdata.expiryDate + parseInt(bookingdata.CentralDispatchExpriryTime)
				}
			}
		},
		() => {
			notifications.notifyFcmTopic(
				{
					action: 5,
					usertype: 1,
					deviceType: 1,
					notification: "",
					msg: i18n.__(i18n.__('bookingStatusMsg')['acceptExpire']),
					fcmTopic: "FCM-STORE-" + data.storeId,
					title: "orden caducada",
					data: {}
				},
				() => { }
			);
			managerTopics.sendToWebsocket(data, 2, (err, res) => { });



		}
	);
}

function expireBookingActionOld(bookingdata) {

	//=================Remove geo location from redis
	geo.removeLocation("location_" + bookingdata.orderId, function (err, reply) {
		if (err) logger.error("Error 1 : " + err);
	});

	//=================Shift Booking to Past Collection
	bookingdata.status = 20;
	bookingdata.statusText = "orden caducada";
	bookingdata.statusMsg = "orden caducada";

	bookingsPast.createNewBooking(bookingdata)
		.then(result => {
			let conditionData = {
				orderId: parseInt(bookingdata.orderId)
			};
			let data = bookingdata;
			if (bookingdata && bookingdata.claimDetails && bookingdata.claimDetails.claimId != "") {
				logger.warn("unlock couponcode api called expiring order order");
				superagent
					.post(config.API_URL + "/unlockPromoCode")
					.send({ claimId: bookingdata.claimDetails.claimId })
					.end(function (err, res) { });
			}
			//send mqtt notification to customer
			let customerDatamqtt = {
				status: parseInt(data.status),
				bid: data.orderId
			};
			notifyi.notifyRealTime({ listner: data.customerDetails.mqttTopic, message: customerDatamqtt });

			//send fcm topic push to customer

			notifications.notifyFcmTopic(
				{
					action: 11,
					usertype: 1,
					deviceType: data.customerDetails.deviceType,
					notification: "",
					// msg: status.bookingStatus(data.status),
					msg: "lo siento, todos los conductores están ocupados en ese momento, intente nuevamente después de algunas veces.",
					fcmTopic: data.customerDetails.fcmTopic || "",
					title: "orden caducada",
					data: customerDatamqtt
				},
				() => { }
			);


			storeManagers.getAll({ storeId: bookingdata.storeId.toString(), status: 2 }, (err, storeManager) => {
				if (err) {
					logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
				}
				if (storeManager.length > 0) {
					for (let s = 0; s < storeManager.length; s++) {
						notifications.notifyFcmTopic(
							{
								action: 5,
								usertype: 1,
								deviceType: storeManager[s].mobileDevices.deviceType ? storeManager[s].mobileDevices.deviceType : 2,
								notification: "",
								msg: "Lo sentimos, acabas de perder un pedido porque no respondiste el pedido",
								fcmTopic: storeManager[s].fcmManagerTopic,
								title: "Orden Expirada",
								data: {}
							},
							() => { }

						);
					}
				}

				storeManagers.getAll({ cityId: bookingData.cityId.toString(), status: 2, userType: 0 }, (err, cityManager) => {
					if (err) {
						logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
					}
					if (cityManager.length > 0) {
						for (let k = 0; k < cityManager.length; k++) {
							notifications.notifyFcmTopic(
								{
									action: 5,
									usertype: 1,
									deviceType: cityManager[k].mobileDevices.deviceType ? cityManager[k].mobileDevices.deviceType : 2,
									notification: "",
									msg: "Lo sentimos, acabas de perder un pedido porque no respondiste el pedido",
									fcmTopic: cityManager[k].fcmManagerTopic,
									title: "Orden Expirada",
									data: {}
								},
								() => { }
							);
						}
					}
				});
			});
			// webSocket.publish('stafforderUpdate/'+ data.storeId+'', data, { qos: 2 }, (mqttErr, mqttRes) => { });

			managerTopics.sendToWebsocket(data, 2, (err, res) => { });
			bookingsUnassigned.Remove(conditionData, function (err, res) {
				if (err) {
					logger.error("Error 2" + err);
				} else {
				}
			});
		})
		.catch(err => {
			logger.error("Error 3 : " + err);
		});
}

function expireBookingAction(orderId) {
	logger.info("-------------expireBookingAction-----------")
	let orderDetails = {};
	let storeData = {};
	let customerData = {};
	let expireOrderData = {};
	const getOrders = () => {
		return new Promise((resolve, reject) => {
			bookingsUnassigned.SelectOne(
				{ orderId: parseInt(orderId) },
				(err, res) => {
					orderDetails = res ? res : orderDetails;
					return err
						? reject({ message: err, code: 500 })
						: resolve(orderDetails);
				}
			);
		});
	};


	const readStore = orderDetails => {
		return new Promise((resolve, reject) => {
			stores.isExistsWithId(
				{ _id: orderDetails.storeId ? new ObjectId(orderDetails.storeId) : "" },
				(err, res) => {
					storeData = res ? res : {};
					return err
						? reject({ message: err, code: 500 })
						: resolve(orderDetails);
				}
			);
		});
	};

	const readCustomer = orderDetails => {
		return new Promise((resolve, reject) => {
			customer.isExistsWithCond(
				{ _id: new ObjectId(orderDetails.customerDetails.customerId) },
				(err, custData) => {
					if (err) {
						logger.error(
							"Error occurred appConfig (get): " + JSON.stringify(err)
						);
					}
					customerData = custData;
					return resolve(orderDetails);
				}
			);
		});
	};

	const paymentRefund = orderDetails => {
		return new Promise((resolve, reject) => {
			if (orderDetails.stripeCharge && orderDetails.paymentType == 1 && orderDetails.paidBy.card > 0) {
				//synchronous stripe code
				stripeTransaction
					.refundCharge(
						orderDetails.stripeCharge.id,
						orderDetails.paidBy.card,
						req
					)
					.then(data => {
						expireOrderData.refundCharge = data;
						return resolve(orderDetails);
					})
					.catch(e => {
						logger.warn("error while refund" + e);
						return reject({ code: 400, message: e });
						// return resolve(orderDetails);
					});
			} else if (orderDetails.payByWallet == 1) {
				// release blocked wallet
				customer.releaseBlockWalletBalance(
					{
						userId: orderDetails.customerDetails.customerId,
						createdBy: "expired",
						amount: orderDetails.paidBy.wallet
					},
					(err, data) => {
						if (err) {
							return reject({ code: 400, message: err });
						} else {
							return resolve(orderDetails);
						}
					}
				);
			} else {
				return resolve(orderDetails);
			}
		});
	};

	const deductCancellationFee = orderDetails => {
		return new Promise((resolve, reject) => {
			if (Object.keys(orderDetails).length > 0) {

				expireOrderData.createdBy = "expired";
				expireOrderData.userId = "expired";
				expireOrderData.driverCommPer = orderDetails.accouting.driverCommPer ? orderDetails.accouting.driverCommPer : 10;
				expireOrderData.storeCommPer = orderDetails.storeCommission;


				if (expireOrderData.status == 16) {
					let fullChargeCustomerArray = [5, 6, 12, 13, 14];

					let CancellationFeeCustomerArray = [1, 4, 8, 10, 40, 21];

					let deliveryFeeCustomerArray = [11];

					var indFullCharge = fullChargeCustomerArray.indexOf(parseInt(orderDetails.status));
					var indCancellationCharge = CancellationFeeCustomerArray.indexOf(parseInt(orderDetails.status));
					var indDeliveryCharge = deliveryFeeCustomerArray.indexOf(parseInt(orderDetails.status));
					if (indFullCharge >= 0) {
						expireOrderData.cancFee = orderDetails.totalAmount;
						expireOrderData.cancCartTotal = parseFloat(orderDetails.cartTotal);
						expireOrderData.cancDeliveryFee = orderDetails.storeFreeDelivery ? orderDetails.storeDeliveryFee : orderDetails.deliveryCharge;
					}
					if (indCancellationCharge >= 0) {
						if (orderDetails.bookingType == 1) {
							// 1 - now booking 2- later or scheduled
							// if (
							//   (parseInt(moment().valueOf()) - orderDetails.orderId) / 1000 <
							//   storeData.onDemandBookingsCancellationFeeAfterMinutes * 60
							// ) {
							//   expireOrderData.cancFee = 0;
							// } else {
							expireOrderData.cancFee = storeData.onDemandBookingsCancellationFee
								? storeData.onDemandBookingsCancellationFee
								: 0;
							// }
						} else {
							// if (
							//   (parseInt(moment().valueOf()) - orderDetails.orderId) / 1000 <
							//   storeData.scheduledBookingsCancellationFeeAfterMinutes * 60
							// ) {
							//   expireOrderData.cancFee = 0;
							// } else {
							expireOrderData.cancFee = storeData.scheduledBookingsCancellationFee
								? storeData.scheduledBookingsCancellationFee
								: 0;
							// }
						}
						expireOrderData.cancCartTotal = parseFloat(0);
						expireOrderData.taxes = parseFloat(0);
						expireOrderData.cancDeliveryFee = parseFloat(expireOrderData.cancFee);

						expireOrderData.storeCommPer = 100;
						expireOrderData.driverCommPer = 100;
					}
					if (indDeliveryCharge >= 0) {
						expireOrderData.cancFee = orderDetails.storeFreeDelivery ? orderDetails.storeDeliveryFee : orderDetails.deliveryCharge;
						expireOrderData.cancCartTotal = parseFloat(0);
						expireOrderData.taxes = parseFloat(0);
						expireOrderData.cancDeliveryFee = parseFloat(expireOrderData.cancFee);
						expireOrderData.storeCommPer = 100;
					}
				}
				if (expireOrderData.status == 17) {
					expireOrderData.cancFee = 0;
					expireOrderData.cancCartTotal = parseFloat(0);
					expireOrderData.taxes = parseFloat(0);
					expireOrderData.cancDeliveryFee = parseFloat(0);
				}
				if (expireOrderData.status == 2) {
					expireOrderData.cancFee = 0;
					expireOrderData.cancCartTotal = parseFloat(0);
					expireOrderData.taxes = parseFloat(0);
					expireOrderData.cancDeliveryFee = parseFloat(0);
				}

				let currentBal = customerData.wallet ? customerData.wallet.balance : 0;
				let walletCharge = 0;
				let cardCharge = 0;
				//charge Cancellation fee
				if (expireOrderData.cancFee > 0) {
					let totalAmountToCharge = expireOrderData.cancFee;
					if (orderDetails.payByWallet == 1) {
						// wallet
						walletCharge = totalAmountToCharge;
						if (currentBal < walletCharge) {
							walletCharge = currentBal;
						}
						totalAmountToCharge = totalAmountToCharge - walletCharge;
					}

					if (orderDetails.paymentType == 1 && totalAmountToCharge > 0 && orderDetails.stripeCharge) {
						cardCharge = totalAmountToCharge;

						stripeTransaction
							.createAndCaptureCharge(
								req,
								orderDetails.customerDetails.customerId,
								orderDetails.stripeCharge.source.id,
								cardCharge,
								orderDetails.currency ? orderDetails.currency : "",
								"Cancellation fee for customer cancel order",
								{
									customerId: orderDetails.customerDetails
										? orderDetails.customerDetails.customerId.toString()
										: "",
									bookingId: orderDetails.orderId,
									customerName: orderDetails.customerDetails
										? orderDetails.customerDetails.name
										: "",
									customerPhone: orderDetails.customerDetails
										? orderDetails.customerDetails.mobile
										: ""
								}
							)
							.then(data => {
								orderDetails.cardCharge = cardCharge;
								return resolve(orderDetails);
							})
							.catch(e => {
								// totalAmountToCharge = totalAmountToCharge - cardCharge;
								walletCharge += cardCharge;

								if (totalAmountToCharge > 0 || walletCharge > 0) {
									walletCharge += totalAmountToCharge;
									//charge From wallet
									let walletData = {
										userId: orderDetails.customerDetails.customerId,
										trigger: "Debit",
										comment: "Cancellation Fee " + expireOrderData.cancFee,
										currency: orderDetails.currency,
										currencyAbbr: 1,
										currencySymbol: orderDetails.currencySymbol,
										txnType: 2,
										wallet: false,
										amount: walletCharge,
										tripId: 0,
										serviceTypeText: orderDetails.serviceTypeText || "",
										bookingTypeText: orderDetails.bookingTypeText || "",
										paymentTypeText: orderDetails.paymentTypeText || "",
										cityName: orderDetails.cityName || "",
										cityId: orderDetails.cityId
											? orderDetails.cityId.toString()
											: "",
										userType: 1,
										initiatedBy: "Customer",
										calculateClosingBalance: 1
									};

									// wallet.walletTransction(walletData, (err, res) => {
									// orderDetails.walletCharge = walletCharge;
									return resolve(orderDetails);
									// });
								}
							});
					} else {
						cardCharge = totalAmountToCharge;

						totalAmountToCharge = totalAmountToCharge - cardCharge;
						walletCharge += cardCharge;

						if (totalAmountToCharge > 0 || walletCharge > 0) {
							walletCharge += totalAmountToCharge;
							//charge From wallet
							let walletData = {
								userId: orderDetails.customerDetails.customerId,
								trigger: "Debit",
								comment: "Cancellation Fee " + expireOrderData.cancFee,
								currency: orderDetails.currency,
								currencyAbbr: 1,
								currencySymbol: orderDetails.currencySymbol,
								txnType: 2,
								wallet: false,
								amount: walletCharge,
								tripId: 0,
								serviceTypeText: orderDetails.serviceTypeText || "",
								bookingTypeText: orderDetails.bookingTypeText || "",
								paymentTypeText: orderDetails.paymentTypeText || "",
								cityName: orderDetails.cityName || "",
								cityId: orderDetails.cityId
									? orderDetails.cityId.toString()
									: "",
								userType: 1,
								initiatedBy: "Customer",
								calculateClosingBalance: 1
							};

							// wallet.walletTransction(walletData, (err, res) => {
							//   orderDetails.walletCharge = walletCharge;
							return resolve(orderDetails);
							// });
						}
					}
				} else {
					return resolve(orderDetails);
				}
			} else {
				logger.warn("bookng nt found");
			}
		});
	};

	getOrders()
		.then(readStore)
		.then(paymentRefund)
		.then(readCustomer)
		// .then(deductCancellationFee)
		.then(dataObj => {
			expireOrderData.orderId = parseInt(orderId);
			expireOrderData.status = 20;
			expireOrderData.statusMsg = i18n.__(i18n.__('bookingStatusMsg')['20'])
			expireOrderData.reason = i18n.__(i18n.__('bookingStatusMsg')['20'])
			// modelName.cancelOrders(expireOrderData, (err, res) => {
			orders.patchExpiry(expireOrderData, "unassignOrders", (err, res) => {
				if (err) {
					logger.error(
						"Error occurred during driver order cancel (cancelOrders) : " +
						JSON.stringify(err)
					);
					// return reply({
					// 	message: req.i18n.__("genericErrMsg")["500"]
					// }).code(500);
				}
				delete res.value._id;
				if (res.value) {
					// res.value.cartTotal = expireOrderData.cancFee;
					// res.value.deliveryCharge = 0;
					// res.value.storeDeliveryFee = 0;
					res.value.paidBy.card = dataObj.cardCharge || 0;
					res.value.paidBy.wallet = dataObj.walletCharge || 0;
				}

				expiredOrders.saveRecord(res.value, (err, insertedData) => {
					if (err) {
						logger.error(
							"Error occurred during driver order cancel (pushOrder) : " +
							JSON.stringify(err)
						);
						// return reply({
						// 	message: req.i18n.__("genericErrMsg")["500"]
						// }).code(500);
					}
					orders.remove({ orderId: parseInt(orderId) }, "unassignOrders", (err, removedData) => {
						if (err) {
							logger.error(
								"Error occurred during driver order cancel (remove) : " +
								JSON.stringify(err)
							);
							return reply({
								message: req.i18n.__("genericErrMsg")["500"]
							}).code(500);
						}

						res.value.reason = expireOrderData.reason;
						res.value.fromName = "app";
						res.value.createdBy = "app";

						let inventoryData = [];
						for (let y = 0; y < res.value.Items.length; y++) {
							inventoryData.push({
								orderId: res.value.orderId,
								userId: res.value.customerDetails.customerId,
								unitId: res.value.Items[y].unitId,
								productId: res.value.Items[y].childProductId,
								triggerType: 1,
								quantity: res.value.Items[y].quantity,
								description: "Order cancelled (Refund)"
							});
						}
						sendNotificationDispatch(res.value);

						// if (res.value && res.value.claimDetails && res.value.claimDetails.claimId != "") {
						//     superagent.post(config.API_URL + '/unlockPromoCode')
						//         .send({ claimId: res.value.claimDetails.claimId })
						//         .end(function (err, res) {
						//         });
						// }
						if (
							res.value.claimData &&
							Object.keys(res.value.claimData).length !== 0 &&
							res.value.claimData != null &&
							res.value.claimData.claimId != ""
						) {
							campaignAndreferral.unlockCouponHandler(
								{ claimId: res.value.claimData.claimId },
								(err, res) => { }
							);
						}

						// accounting
						// 	.cancellation(parseInt(orderId)) // accounting/pickup
						// 	.then(orderAccount => {
						// 		if (orderAccount.data) {
						// 			const rec = {
						// 				cashCollected: 0,
						// 				cardDeduct: 0,
						// 				WalletTransaction:
						// 					orderAccount.dataObj.accouting.cancelationFee,
						// 				pgComm: orderAccount.dataObj.accouting.pgEarningValue,
						// 				appEarning: orderAccount.dataObj.accouting.appEarningValue,
						// 				driverId: orderAccount.dataObj.driverId || "",
						// 				driverEarning:
						// 					orderAccount.dataObj.accouting.driverEarningValue,
						// 				storeId: orderAccount.dataObj.storeId || "",
						// 				storeEarning: orderAccount.dataObj.accouting.storeEarningValue,
						// 				franchiseId: orderAccount.dataObj.franchiseId || "",
						// 				franchiseEarning:
						// 					orderAccount.dataObj.accouting.franchiseEarningValue,
						// 				partnerId: orderAccount.dataObj.partnerId || "",
						// 				partnerEarning:
						// 					orderAccount.dataObj.accouting.partnerEarningValue,
						// 				userId: orderAccount.dataObj.customerDetails.customerId,
						// 				currency: orderAccount.dataObj.currency,
						// 				currencySymbol: orderAccount.dataObj.currencySymbol,
						// 				orderId: orderAccount.dataObj.orderId,
						// 				serviceType: orderAccount.dataObj.serviceType,
						// 				serviceTypeText:
						// 					orderAccount.dataObj.serviceType === 1
						// 						? "delivery"
						// 						: "pickup",
						// 				driverType:
						// 					typeof orderAccount.dataObj.driverDetails != "undefined" &&
						// 						typeof orderAccount.dataObj.driverDetails.driverType !=
						// 						"undefined"
						// 						? orderAccount.dataObj.driverDetails.driverType
						// 						: 1,
						// 				paymentTypeText: orderAccount.dataObj.paymentTypeMsg,
						// 				cityName: orderAccount.dataObj.city,
						// 				cityId: orderAccount.dataObj.cityId
						// 			};
						// 			walletEntryModel.walletEntryForOrdering(
						// 				rec,
						// 				(error, result) => {
						// 					//     if (error) {
						// 					//         logger.error('error : ' + error)
						// 					//     }
						// 				}
						// 			);
						// 			// return reply({
						// 			// 	message: req.i18n.__("bookings")["201"],
						// 			// 	data: res ? res.value : {}
						// 			// }).code(201);
						// 			// })
						// 		}
						// 	})
						// 	.catch(e => {
						// 		logger.error("accounting error : ", e);
						// 	});
					});
				});
			});
		})
		.catch(e => {
			logger.error(
				"Error occurred update order expired (catch): ", e
			);

		});
}

function centralQueExpire(orderId) {
	logger.info("centralQueExpire")
	bookingsUnassigned.SelectOne({ orderId: parseInt(orderId) }, function (err, bookingdata) {
		if (err) {
			logger.error("Error 2 : " + err);
		} else if (bookingdata) {
			logger.info("expireBookingAction")
			expireBookingAction(orderId);
		} else {
			logger.info("Nothing")
		}
	});
}

function sendNotification(data) {
	//send mqtt notification to customer
	let customerDatamqtt = {
		status: parseInt(data.status),
		bid: data.orderId
	};

	notifyi.notifyRealTime({ listner: data.customerDetails.mqttTopic, message: customerDatamqtt });

	//send fcm topic push to customer

	notifications.notifyFcmTopic(
		{
			action: 11,
			usertype: 1,
			deviceType: data.customerDetails.deviceType,
			notification: "",
			// msg: status.bookingStatus(data.status),
			msg: "lo siento, " + data.storeName + " no aceptó su pedido",
			fcmTopic: data.customerDetails.fcmTopic || "",
			title: "orden caducada",
			data: customerDatamqtt
		},
		() => { }
	);

	storeManagers.getAll({ storeId: data.storeId.toString(), status: 2 }, (err, storeManager) => {
		if (err) {
			logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
		}
		if (storeManager.length > 0) {
			for (let s = 0; s < storeManager.length; s++) {
				notifications.notifyFcmTopic(
					{
						action: 5,
						usertype: 1,
						deviceType: storeManager[s].mobileDevices.deviceType ? storeManager[s].mobileDevices.deviceType : 2,
						notification: "",
						msg: "Lo sentimos, acabas de perder un pedido porque no respondiste el pedido",
						fcmTopic: storeManager[s].fcmManagerTopic,
						title: "Orden Expirada",
						data: {}
					},
					() => { }

				);
			}
		}

		storeManagers.getAll({ cityId: data.cityId.toString(), status: 2, userType: 0 }, (err, cityManager) => {
			if (err) {
				logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
			}
			if (cityManager.length > 0) {
				for (let k = 0; k < cityManager.length; k++) {
					notifications.notifyFcmTopic(
						{
							action: 5,
							usertype: 1,
							deviceType: cityManager[k].mobileDevices.deviceType ? cityManager[k].mobileDevices.deviceType : 2,
							notification: "",
							msg: "Lo sentimos, acabas de perder un pedido porque no respondiste el pedido",
							fcmTopic: cityManager[k].fcmManagerTopic,
							title: "Orden Expirada",
							data: {}
						},
						() => { }
					);
				}
			}
		});
	});
	// webSocket.publish('stafforderUpdate/'+ data.storeId+'', data, { qos: 2 }, (mqttErr, mqttRes) => { });

	managerTopics.sendToWebsocket(data, 2, (err, res) => { });
}
function sendNotificationDispatch(data) {
	//send mqtt notification to customer
	if (data && data.claimDetails && data.claimDetails.claimId != "") {
		logger.warn("unlock couponcode api called expiring order order");
		superagent
			.post(config.API_URL + "/unlockPromoCode")
			.send({ claimId: data.claimDetails.claimId })
			.end(function (err, res) { });
	}
	//send mqtt notification to customer
	let customerDatamqtt = {
		status: parseInt(data.status),
		bid: data.orderId
	};
	notifyi.notifyRealTime({ listner: data.customerDetails.mqttTopic, message: customerDatamqtt });

	//send fcm topic push to customer

	notifications.notifyFcmTopic(
		{
			action: 11,
			usertype: 1,
			deviceType: data.customerDetails.deviceType,
			notification: "",
			// msg: status.bookingStatus(data.status),
			msg: i18n.__(i18n.__('bookingStatusMsg')['dispatchExpire']),
			fcmTopic: data.customerDetails.fcmTopic || "",
			title: "orden caducada",
			data: customerDatamqtt
		},
		() => { }
	);

	storeManagers.getAll({ storeId: data.storeId.toString(), status: 2 }, (err, storeManager) => {
		if (err) {
			logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
		}
		if (storeManager.length > 0) {
			for (let s = 0; s < storeManager.length; s++) {
				notifications.notifyFcmTopic(
					{
						action: 5,
						usertype: 1,
						deviceType: storeManager[s].mobileDevices.deviceType ? storeManager[s].mobileDevices.deviceType : 2,
						notification: "",
						msg: i18n.__(i18n.__('bookingStatusMsg')['acceptExpire']),
						fcmTopic: storeManager[s].fcmManagerTopic,
						title: "Orden Expirada",
						data: {}
					},
					() => { }

				);
			}
		}

		storeManagers.getAll({ cityId: data.cityId.toString(), status: 2, userType: 0 }, (err, cityManager) => {
			if (err) {
				logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
			}
			if (cityManager.length > 0) {
				for (let k = 0; k < cityManager.length; k++) {
					notifications.notifyFcmTopic(
						{
							action: 5,
							usertype: 1,
							deviceType: cityManager[k].mobileDevices.deviceType ? cityManager[k].mobileDevices.deviceType : 2,
							notification: "",
							msg: i18n.__(i18n.__('bookingStatusMsg')['acceptExpire']),
							fcmTopic: cityManager[k].fcmManagerTopic,
							title: "Orden Expirada",
							data: {}
						},
						() => { }
					);
				}
			}
		});
	});
	// webSocket.publish('stafforderUpdate/'+ data.storeId+'', data, { qos: 2 }, (mqttErr, mqttRes) => { });

	managerTopics.sendToWebsocket(data, 2, (err, res) => { });

}
module.exports = { payloadValidator, APIHandler, isWithinPolygons, isCityWithinPolygons };
