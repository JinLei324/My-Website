"use strict";
const config = process.env;

const Joi = require("joi");
const Async = require("async");
const logger = require("winston");
const orders = require("../../../../models/orders");
const stores = require("../../../../models/stores");
const moment = require("moment");

const validator = {
	cityId: Joi.string()
		.required()
		.description("cityId"),
	index: Joi.number()
		.integer()
		.required()
		.description("pageIndex"),
	franchiseId: Joi.string()
		.required()
		.description("franchiseId"),
	storeId: Joi.string()
		.required()
		.description("storeId"),
	fromDate: Joi.string()
		.required()
		.description("fromDate"),
	toDate: Joi.string()
		.required()
		.description("toDate"),
	search: Joi.string()
		.required()
		.description("serach")
};

/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */

const handler = (req, reply) => {
	let fromDate = req.params.fromDate + " 00:00:00";
	let toDate = req.params.toDate + " 23:59:59";

	var filter = {};
	var isForcedAccept = 0;
	var isAutoDispatch = 2;
	var driverType = 1;
	var isPackageEnable = 0;
	var timeStampFilter = {};
	if (fromDate && toDate) {
		filter = {
			$gte: fromDate,
			$lte: new Date(toDate).toISOString()
		};
		timeStampFilter = {
			$gte: new Date(fromDate).getTime() / 1000,
			$lte: new Date(toDate).getTime() / 1000
		};
	}

	if (fromDate && !toDate) {
		filter = {
			$gte: fromDate,
			$lte: new Date().toISOString()
		};
		timeStampFilter = {
			$gte: new Date(fromDate).getTime() / 1000,
			$lte: new Date().getTime() / 1000
		};
	}

	if (!fromDate && toDate) {
		filter = {
			$lte: new Date(toDate).toISOString()
		};
		timeStampFilter = {
			$lte: new Date(toDate).getTime() / 1000
		};
	}

	let pageIndex = req.params.index;
	let skip = pageIndex * 50;
	let limit = 50;
	let userType = req.auth.credentials.userType;


	let acceptedBooking = {};
	let acceptedPickUpBooking = {};
	let pickupReady = {};
	let acceptedAssignBooking = {};
	let OrderPickedUp = {};
	let inDispatchBooking = {};
	let inProgressBooking = {};
	let newBooking = {};
	let orderAcceptedBooking = {};
	let packageBooking = {};



	let newOrder = [];
	let orderAccepted = [];
	let pickedUpOrder = [];
	let inDispatchOrder = [];
	let inProgress = [];
	let pickUpReadyOrder = [];
	let packageOrder = [];
	let unassignacceptedOrder = [];
	let assignacceptedOrder = [];
	let pickupacceptedOrder = [];

	let storeData = {};

	const getStoreData = () => {
		return new Promise((resolve, reject) => {
			if (req.params.storeId != 0) {
				storeData = {};
				stores.getById({
					id: req.params.storeId,
				}, (err, store) => {
					if (err) {
						return reject();
					}
					if (store) {
						storeData = store;
						isForcedAccept = storeData.forcedAccept;
						isAutoDispatch = storeData.autoDispatch;
						driverType = storeData.driverType;
						isPackageEnable = storeData.isPackageEnable;
						return resolve(true);
					} else {
						return reject();
					}
				});
			} else {
				storeData = {};
				return resolve(true);
			}


		});
	};
	const setCondition = () => {
		return new Promise((resolve, reject) => {
			switch (userType) {
				case 0:

					newBooking = {
						status: 1
					};
					orderAcceptedBooking = {
						status: 4
					};
					acceptedBooking = {
						status: {
							$in: [4, 21, 40]
						},
						inDispatch: false,
						// visiableInAccept: true
					};
					acceptedPickUpBooking = {
						status: {
							$in: [0]
						}
					};
					pickupReady = {
						status: {
							$in: [4, 5, 6]
						}
					};
					//assignBooking
					acceptedAssignBooking = {
						status: {
							$in: [0]
						}
					};
					inDispatchBooking = {
						status: {
							$in: [40]
						},
						inDispatch: true
					};
					inProgressBooking = {
						inDispatch: false,
						status: 25
					};
					break;
				case 1:
				case 2:
					if (driverType == 2) {
						newBooking = {
							status: 1
						};
						acceptedBooking = {
							status: 4
						};
						acceptedPickUpBooking = {
							status: 4
						};
						pickupReady = {
							status: {
								$in: [5, 6]
							}
						};
						//assignBooking
						acceptedAssignBooking = {
							status: {
								$in: [0]
							}
						};
						OrderPickedUp = {
							status: {
								$in: [8, 10, 11, 12, 13, 14]
							}
						};
						inDispatchBooking = {
							status: {
								$in: [21, 40]
							}
						};

						inProgressBooking = {
							inDispatch: false,
							status: 25
						};
					} else {
						if (isAutoDispatch != 2 && isForcedAccept != 0) {
							newBooking = {
								status: 1
							};
							acceptedBooking = {
								status: {
									$in: [4, 21, 40]
								},
								visiableInAccept: true
							};
							acceptedPickUpBooking = {
								status: {
									$in: [4]
								}
							};
							pickupReady = {
								status: {
									$in: [5, 6]
								}
							};
							//assignBooking
							acceptedAssignBooking = {
								status: {
									$in: [8, 10, 11]
								}
							};
							OrderPickedUp = {
								status: {
									$in: [12, 13, 14]
								}
							};
							inDispatchBooking = {
								status: {
									$in: [40]
								}
							};

							inProgressBooking = {
								inDispatch: false,
								status: 25
							};
						} else if (isAutoDispatch != 2 && isForcedAccept != 1) {

							newBooking = {
								status: 1
							};

							acceptedBooking = {
								status: {
									$in: [4, 21, 40]
								},
								visiableInAccept: true
							};
							acceptedPickUpBooking = {
								status: {
									$in: [4]
								}
							};

							pickupReady = {
								status: {
									$in: [5, 6]
								}
							};
							//assignBooking
							acceptedAssignBooking = {
								status: {
									$in: [8, 10, 11]
								}
							};
							OrderPickedUp = {
								status: {
									$in: [12, 13, 14]
								}
							};
							inDispatchBooking = {
								status: {
									$in: [0]
								}
							};

							inProgressBooking = {
								inDispatch: false,
								status: 25
							};
						} else if (isAutoDispatch != 1 && isForcedAccept != 0) {

							newBooking = {
								status: 1
							};

							acceptedBooking = {
								status: {
									$in: [4, 21, 40]
								},
								visiableInAccept: true
							};
							acceptedPickUpBooking = {
								status: {
									$in: [4]
								}
							};

							pickupReady = {
								status: {
									$in: [5, 6]
								}
							};
							//assignBooking
							acceptedAssignBooking = {
								status: {
									$in: [8, 10, 11]
								}
							};
							OrderPickedUp = {
								status: {
									$in: [12, 13, 14]
								}
							};
							inDispatchBooking = {
								status: {
									$in: [40]
								}
							};

							inProgressBooking = {
								inDispatch: false,
								status: 25
							};
						} else if (isAutoDispatch != 1 && isForcedAccept != 1) {

							newBooking = {
								status: 1
							};

							acceptedBooking = {
								status: {
									$in: [4, 21, 40]
								},
								visiableInAccept: true
							};
							acceptedPickUpBooking = {
								status: {
									$in: [4]
								}
							};

							pickupReady = {
								status: {
									$in: [5, 6]
								}
							};
							//assignBooking
							acceptedAssignBooking = {
								status: {
									$in: [8, 10, 11]
								}
							};
							OrderPickedUp = {
								status: {
									$in: [12, 13, 14]
								}
							};
							inDispatchBooking = {
								status: {
									$in: [0]
								}
							};

							inProgressBooking = {
								inDispatch: false,
								status: 25
							};
						} else {

							newBooking = {
								status: 1
							};

							acceptedBooking = {
								status: {
									$in: [4, 21, 40]
								},
								visiableInAccept: true
							};
							acceptedPickUpBooking = {
								status: {
									$in: [4]
								}
							};

							pickupReady = {
								status: {
									$in: [5, 6]
								}
							};
							//assignBooking
							acceptedAssignBooking = {
								status: {
									$in: [8, 10, 11]
								}
							};
							OrderPickedUp = {
								status: {
									$in: [12, 13, 14]
								}
							};
							inDispatchBooking = {
								status: {
									$in: [40]
								}
							};

							inProgressBooking = {
								inDispatch: false,
								status: 25
							};
						}
					}

					break;
				default:

			}

			if (req.params.search != "0" && req.params.search != "") {
				newBooking["$or"] = [{
					"orderIdString": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.name": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.email": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.mobile": {
						$regex: req.params.search,
						$options: "i"
					}
				}];
				acceptedBooking["$or"] = [{
					"orderIdString": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.name": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.email": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.mobile": {
						$regex: req.params.search,
						$options: "i"
					}
				}];
				acceptedAssignBooking["$or"] = [{
					"orderIdString": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.name": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.email": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.mobile": {
						$regex: req.params.search,
						$options: "i"
					}
				}];
				acceptedPickUpBooking["$or"] = [{
					"orderIdString": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.name": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.email": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.mobile": {
						$regex: req.params.search,
						$options: "i"
					}
				}];
				pickupReady["$or"] = [{
					"orderIdString": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.name": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.email": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.mobile": {
						$regex: req.params.search,
						$options: "i"
					}
				}];
				OrderPickedUp["$or"] = [{
					"orderIdString": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.name": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.email": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.mobile": {
						$regex: req.params.search,
						$options: "i"
					}
				}];
				inDispatchBooking["$or"] = [{
					"orderIdString": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.name": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.email": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.mobile": {
						$regex: req.params.search,
						$options: "i"
					}
				}];
				inProgressBooking["$or"] = [{
					"orderIdString": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.name": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.email": {
						$regex: req.params.search,
						$options: "i"
					}
				}, {
					"customerDetails.mobile": {
						$regex: req.params.search,
						$options: "i"
					}
				}];
			}
			if (req.params.cityId != "0") {
				newBooking.cityId = req.params.cityId;
				acceptedBooking.cityId = req.params.cityId;
				acceptedAssignBooking.cityId = req.params.cityId;
				acceptedPickUpBooking.cityId = req.params.cityId;
				pickupReady.cityId = req.params.cityId;
				OrderPickedUp.cityId = req.params.cityId;
				inDispatchBooking.cityId = req.params.cityId;
				inProgressBooking.cityId = req.params.cityId;
			}

			if (req.params.fromDate != "0" && req.params.toDate != "0") {
				newBooking.bookingDateTimeStamp = timeStampFilter;
				acceptedBooking.bookingDateTimeStamp = timeStampFilter;
				acceptedAssignBooking.bookingDateTimeStamp = timeStampFilter;
				acceptedPickUpBooking.bookingDateTimeStamp = timeStampFilter;
				pickupReady.bookingDateTimeStamp = timeStampFilter;
				OrderPickedUp.bookingDateTimeStamp = timeStampFilter;
				inDispatchBooking.bookingDateTimeStamp = timeStampFilter;
				inProgressBooking.bookingDateTimeStamp = timeStampFilter;
			}

			switch (userType) {
				case 0: //city
					newBooking.cityId = req.auth.credentials.cityId;
					acceptedBooking.cityId = req.auth.credentials.cityId;
					acceptedAssignBooking.cityId = req.auth.credentials.cityId;
					acceptedPickUpBooking.cityId = req.auth.credentials.cityId;
					pickupReady.cityId = req.auth.credentials.cityId;
					OrderPickedUp.cityId = req.auth.credentials.cityId;
					inDispatchBooking.cityId = req.auth.credentials.cityId;
					inProgressBooking.cityId = req.auth.credentials.cityId;
					if (req.params.storeId != "0") {
						newBooking.storeId = req.params.storeId;
						acceptedBooking.storeId = req.params.storeId;
						acceptedAssignBooking.storeId = req.params.storeId;
						acceptedPickUpBooking.storeId = req.params.storeId;
						pickupReady.storeId = req.params.storeId;
						OrderPickedUp.storeId = req.params.storeId;
						inDispatchBooking.storeId = req.params.storeId;
						inProgressBooking.storeId = req.params.storeId;
					}
					break;
				case 1: //franchies
					newBooking.franchiseId = req.auth.credentials.franchiseId;
					acceptedBooking.franchiseId = req.auth.credentials.franchiseId;
					acceptedAssignBooking.franchiseId = req.auth.credentials.franchiseId;
					acceptedPickUpBooking.franchiseId = req.auth.credentials.franchiseId;
					pickupReady.franchiseId = req.auth.credentials.franchiseId;
					OrderPickedUp.franchiseId = req.auth.credentials.franchiseId;
					inDispatchBooking.franchiseId = req.auth.credentials.franchiseId;
					inProgressBooking.franchiseId = req.auth.credentials.franchiseId;

					if (req.params.storeId != "0") {
						newBooking.storeId = req.params.storeId;
						acceptedBooking.storeId = req.params.storeId;
						acceptedAssignBooking.storeId = req.params.storeId;
						acceptedPickUpBooking.storeId = req.params.storeId;
						pickupReady.storeId = req.params.storeId;
						OrderPickedUp.storeId = req.params.storeId;
						inDispatchBooking.storeId = req.params.storeId;
						inProgressBooking.storeId = req.params.storeId;
					}
					break;
				case 2: //store
					newBooking.storeId = req.auth.credentials.storeId;
					acceptedBooking.storeId = req.auth.credentials.storeId;
					acceptedAssignBooking.storeId = req.auth.credentials.storeId;
					acceptedPickUpBooking.storeId = req.auth.credentials.storeId;
					pickupReady.storeId = req.auth.credentials.storeId;
					OrderPickedUp.storeId = req.auth.credentials.storeId;
					inDispatchBooking.storeId = req.auth.credentials.storeId;
					inProgressBooking.storeId = req.auth.credentials.storeId;

					break;
				default:
			}
			return resolve(true);
		});
	};
	const getnewOrder = () => {
		return new Promise((resolve, reject) => {
			orders.getAllOrders({
				q: newBooking,
				options: {
					skip: skip,
					limit: limit
				}
			},
				"newOrder",
				(err, newBookingObj) => {
					newOrder = newBookingObj;
					return resolve(true)
				}
			);;
		});
	};
	const getOrderAccepted = () => {
		return new Promise((resolve, reject) => {
			orders.getAllOrders({
				q: orderAcceptedBooking,
				options: {
					skip: skip,
					limit: limit
				}
			},
				"orderAccepted",
				(err, newBookingObj) => {
					orderAccepted = newBookingObj;
					return resolve(true)
				}
			);;
		});
	};
	const getunassignacceptedOrder = () => {
		return new Promise((resolve, reject) => {
			orders.getAllOrders({
				q: acceptedBooking,
				options: {
					skip: skip,
					limit: limit
				}
			},
				"unassignOrders",
				(err, acceptedBookingObj) => {
					unassignacceptedOrder = acceptedBookingObj;
					return resolve(true);
				}
			);
		});
	};
	const getassignacceptedOrder = () => {
		return new Promise((resolve, reject) => {
			orders.getAllOrders({
				q: acceptedAssignBooking,
				options: {
					skip: skip,
					limit: limit
				}
			},
				"assignOrders",
				(err, acceptedAssignBookingObj) => {
					assignacceptedOrder = acceptedAssignBookingObj;
					return resolve(true);
				}
			);
		});
	};
	const getpickupacceptedOrder = () => {
		return new Promise((resolve, reject) => {
			orders.getAllOrders({
				q: acceptedPickUpBooking,
				options: {
					skip: skip,
					limit: limit
				}
			},
				"pickupOrders",
				(err, acceptedPickUpBookingObj) => {
					pickupacceptedOrder = acceptedPickUpBookingObj;
					return resolve(true);
				}
			);
		});
	};
	const getpickedUpOrder = () => {
		return new Promise((resolve, reject) => {
			orders.getAllOrders({
				q: OrderPickedUp,
				options: {
					skip: skip,
					limit: limit
				}
			},
				"assignOrders",
				(err, OrderPickedUpObj) => {
					pickedUpOrder = OrderPickedUpObj;
					return resolve(true);
				}
			);
		});
	};
	const getpackageOrder = () => {
		return new Promise((resolve, reject) => {
			orders.getAllOrders({
				q: packageBooking,
				options: {
					skip: skip,
					limit: limit
				}
			},
				"assignOrders",
				(err, packageBookingObj) => {
					packageOrder = packageBookingObj;
					return resolve(true);
				}
			);
		});
	};
	const getinDispatchOrder = () => {
		return new Promise((resolve, reject) => {
			orders.getAllOrders({
				q: inDispatchBooking,
				options: {
					skip: skip,
					limit: limit
				}
			},
				"unassignOrders",
				(err, inDispatchBookingObj) => {

					inDispatchOrder = inDispatchBookingObj;
					return resolve(true);
				}
			);
		});
	};
	const getinProgress = () => {
		return new Promise((resolve, reject) => {
			orders.getAllOrders({
				q: inProgressBooking,
				options: {
					skip: skip,
					limit: limit
				}
			},
				"unassignOrders",
				(err, inProgressBookingObj) => {
					inProgress = inProgressBookingObj;
					return resolve(true);
				}
			);
		});
	};
	const getpickUpReadyOrder = () => {
		return new Promise((resolve, reject) => {
			orders.getAllOrders({
				q: pickupReady,
				options: {
					skip: skip,
					limit: limit
				}
			},
				"pickupOrders",
				(err, pickupReadyObj) => {
					pickUpReadyOrder = pickupReadyObj;
					return resolve(true);
				}
			);
		});
	};
	getStoreData()
		.then(setCondition)
		.then(getnewOrder)
		.then(getOrderAccepted)
		.then(getunassignacceptedOrder)
		.then(getassignacceptedOrder)
		.then(getpickupacceptedOrder)
		.then(getpickedUpOrder)
		.then(getinDispatchOrder)
		.then(getpackageOrder)
		.then(getinProgress)
		.then(getpickUpReadyOrder)
		.then((response) => {

			function reOrderSeq(b, a) {
				return a.dueDatetimeTimeStamp - b.dueDatetimeTimeStamp;
			}
			let acceptedOrder = unassignacceptedOrder.concat(assignacceptedOrder);
			acceptedOrder = acceptedOrder.concat(pickupacceptedOrder);


			newOrder.sort(reOrderSeq);
			orderAccepted.sort(reOrderSeq);
			acceptedOrder.sort(reOrderSeq);
			pickedUpOrder.sort(reOrderSeq);
			inDispatchOrder.sort(reOrderSeq);
			inProgress.sort(reOrderSeq);
			pickUpReadyOrder.sort(reOrderSeq);

			let data = {
				newOrder: newOrder,
				newOrderCount: newOrder.length,
				acceptedOrder: orderAccepted,
				acceptedOrderCount: orderAccepted.length,
				orderReady: acceptedOrder,
				orderReadyCount: acceptedOrder.length,
				pickedUpOrder: pickedUpOrder,
				pickedUpOrderCount: pickedUpOrder.length,
				inDispatchOrder: inDispatchOrder,
				inDispatchOrderCount: inDispatchOrder.length,
				inProgress: inProgress,
				inProgressCount: inProgress.length,
				pickUpReadyOrder: pickUpReadyOrder,
				pickUpReadyOrderCount: pickUpReadyOrder.length,
				packageOrder: packageOrder,
				packageOrderCount: packageOrder.length
			}

			return reply({
				message: req.i18n.__("ordersList")["200"],
				data: data
			}).code(200);

		}).catch((err) => {
			logger.error("Post referral new user referral code error: ", err);
			return reply({
				message: req.i18n.__("genericErrMsg")["500"]
			}).code(500)
		});


}

const responseCode = {}; //swagger response code
module.exports = {
	handler,
	validator,
	responseCode,
};
