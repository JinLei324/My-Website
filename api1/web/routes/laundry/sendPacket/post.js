'use strict'
const customer = require('../../../../models/customer');
const cities = require('../../../../models/cities');
const zones = require('../../../../models/zones');
const appConfig = require('../../../../models/appConfig');
const orders = require('../../../../models/order');
const cart = require('../../../../models/cart/cart');
const storeManagers = require('../../../../models/storeManagers');
const stores = require('../../../../models/stores');
const configuration = require('../../../../config');
const city = require('../../../../models/promoCampaigns/city');
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment-timezone');
const managerTopics = require('../../../commonModels/managerTopics');
const ObjectID = require('mongodb').ObjectID;
const notifications = require('../../../../library/fcm')
const email = require('../../../commonModels/email/email');
// Reverse Geocoding
const superagent = require('superagent');
const notifyi = require('../../../../library/mqttModule');
const googleDistance = require('../../../commonModels/googleApi');
const stripeTransaction = require('../../../commonModels/stripe/stripeTransaction');
const zonesDeliverySlots = require('../../../../models/zonesDeliverySlots');

const payloadValidator = Joi.object({
    paymentType: Joi.number().min(0).max(2).required().description('1-card, 2 cash'),// 3 -wallet 4-ideal  13- card+wallet 12-card+cash 23-cash+wallet'),
    payByWallet: Joi.any().allow([0, 1]).default(0).description('1-Use Wallet, 0- dont use wallet'),
    laundryType: Joi.any().allow([1, 2]).default(1).description('1- Normal Wash, 2 - Express'),
    cardId: Joi.string().description('incase of card transaction').allow(""),
    cartId: Joi.string().required().description('cart Id'),
    pickupLatitude: Joi.number().required().description("Customer PickUp Latitude is required").default(13.0195677),
    pickupLongitude: Joi.number().required().description("Customer PickUp Longitude is required").default(77.5968131),
    dropLatitude: Joi.number().required().description("Customer Drop Latitude is required").default(13.0195677),
    dropLongitude: Joi.number().required().description("Customer Drop Longitude is required").default(77.5968131),
    pickupSlotId: Joi.string().required().description('pickup slot selected Id'),
    dropSlotId: Joi.string().required().description('drop slot selected Id'),
    bookingDate: Joi.string().required().description("Order dateTime is required").default("2019-02-13 20:33:53"),
    dueDatetime: Joi.string().required().description("Due dateTime is required").default("2019-02-13 20:33:53"),
    serviceType: Joi.number().integer().min(1).max(3).required().description('1 for delivery ,2 for pickup, 3 for laundry'),
    bookingType: Joi.number().integer().min(1).max(2).required().description('1 for now booking, 2 for later booking'),
    extraNote: Joi.string().description('extra note').allow(""),
    deviceTime: Joi.any().description('device time').error(new Error('deviceTime is missing')),
    storeCategoryId: Joi.string().required().description("ex : 5a281337005a4e3b65bf12a8").example("5a281337005a4e3b65bf12a8").max(24).min(24).error(new Error('store category Id is missing or incorrect it must be 24 char || digit only')),
    storeType: Joi.number().required().description("store type")
}).required();


const APIHandler = (req, reply) => {
    // req.headers.language = "en";
    let condition = {};
    let createdBy = "";
    let orderId = parseInt(moment().valueOf());
    switch (req.payload.customerPOSId == null ? req.auth.credentials.sub : req.payload.customerPOSId) {
        case 'customer':
            createdBy = req.auth.credentials.sub;
            condition = { _id: new ObjectID(req.auth.credentials._id.toString()) };
            break;
        case 'manager':
            createdBy = req.auth.credentials.sub;
            condition = { _id: new ObjectID(req.payload.customerId) };
            break;
        case 'dispatcher':
            createdBy = req.auth.credentials.sub;
            condition = { _id: new ObjectID(req.payload.customerId) };
            break;
        default:
            createdBy = "pos";
            condition = { customerPOSId: parseInt(req.payload.customerPOSId) };
    }
    req.payload.coordinates = {
        longitude: req.payload.pickupLongitude,
        latitude: req.payload.pickupLatitude
    };
    let customerData = {};
    let orderData = {};
    let pickUpCityData = {};
    let dropCityData = {};
    let pickUpZoneData = {};
    let dropZoneData = {};
    let cartDetailsData = {};
    let cartDetailsDataLaundry = {};
    let appConfigData = {};
    let dataToInsert = {};
    let responseData = {};
    let laundryDetails = [];
    let cityData = [];
    let nearestStoreLatLong = {};
    let deliveryPricePickup = 0;
    let deliveryPriceDrop = 0;


    const getCustomerData = (data) => {
        return new Promise((resolve, reject) => {
            customer.isExistsWithIdPos(condition, (err, customerDataDB) => {
                if (err) {
                    reject({ code: 500 });
                }
                customerData = customerDataDB;
                resolve(true);

            });

        });
    }

    const checkCityForPickup = () => {
        return new Promise((resolve, reject) => {
            cities.inZone({ lat: req.payload.pickupLatitude, long: req.payload.pickupLongitude }, (err, data) => {
                if (err) {
                    logger.error('Error occurred during get fare (inZoneAll): ' + JSON.stringify(err));
                    reject({ code: 500 });
                }
                if (data && data.cities) {
                    pickUpCityData = data.cities[0];
                    resolve(true);
                } else {
                    logger.error('pickup city not found');
                    reject({ code: 404 });
                }
            });
        });
    }

    const checkCityForDrop = () => {
        return new Promise((resolve, reject) => {
            cities.inZone({ lat: req.payload.dropLatitude, long: req.payload.dropLongitude }, (err, data) => {
                if (err) {
                    logger.error('Error occurred during get fare (inZoneAll): ' + JSON.stringify(err));
                    reject({ code: 500 });
                }
                if (data && data.cities) {
                    dropCityData = data.cities[0];
                    resolve(true);
                } else {
                    logger.error('drop city not found');
                    reject({ code: 404 });
                }
            });
        });
    }

    let checkOperationZoneForThisBooking = () => {
        return new Promise((resolve, reject) => {
            if (pickUpCityData.cityId.toString() == dropCityData.cityId.toString()) {
                city.cityDetails(pickUpCityData.cityId.toString(), (cityDetailsError, cityDetailsResponse) => {
                    cityData = cityDetailsResponse;
                    if (cityDetailsError) {
                        reject({ code: 500 })
                    }
                    laundryDetails = cityDetailsResponse[0].cities.laundry;
                    responseData.estimateAmount = 0;
                    responseData.expressDeliveryCharge = 0;
                    responseData.deliveryPriceFromCustomerToLaundromat = 0;
                    responseData.deliveryPriceFromLaundromatToCustomer = 0;
                    if (req.payload.laundryType == 2) {
                        responseData.estimateAmount += laundryDetails[0].extraFeeForExpressDelivery;
                        responseData.expressDeliveryCharge = laundryDetails[0].extraFeeForExpressDelivery;
                    }
                    resolve(true)
                })
            }
            else {
                reject({ message: req.i18n.__('customerPostBooking')['419'], code: 419 });
            }
        });
    };

    let getPickupAreaZone = () => {
        return new Promise((resolve, reject) => {
            zones.inZoneAll({ lat: req.payload.pickupLatitude, long: req.payload.pickupLongitude }, (err, data) => {
                if (err) {
                    reject({ code: 500 });
                }
                if (data) {
                    pickUpZoneData = data;

                } else {
                    pickUpZoneData = {};
                }
                resolve(true);
            });
        });
    };

    let getDropAreaZone = () => {
        return new Promise((resolve, reject) => {
            zones.inZoneAll({ lat: req.payload.dropLatitude, long: req.payload.dropLongitude }, (err, data) => {
                if (err) {
                    reject({ code: 500 });
                }
                if (data) {
                    dropZoneData = data;
                } else {
                    dropZoneData = {};
                }
                resolve(true);
            });
        });
    };

    let cartDetails = () => {
        return new Promise((resolve, reject) => {
            cart.getCart({ cartId: req.payload.cartId }, (err, data) => {
                if (err) {
                    reject({ code: 500 });
                }
                if (data) {
                    cartDetailsData = data;
                } else {
                    cartDetailsData = {};
                }
                resolve(true);
            });
        });
    };

    let removeCart = () => {
        return new Promise((resolve, reject) => {
            cart.clearCartLaundry({ cartId: req.payload.cartId, orderId: orderId }, (err, data) => {
                if (err) {
                    reject({ code: 500 });
                }
                if (data) {
                    cartDetailsDataLaundry = data;
                } else {
                    cartDetailsDataLaundry = {};
                }
                resolve(true);
            });
        });
    };

    const dropFetchAddress = () => {
        return new Promise((resolve, reject) => {
            appConfigData.googleData = {};
            googleDistance.fetchAddress(req.payload.dropLatitude, req.payload.dropLongitude, [])
                .then((data) => {
                    if (data) {
                        appConfigData.googleData = {
                            placeId: data.placeId ? data.placeId : "",
                            placeName: data.placeName ? data.placeName : "",
                            addressLine1: data.address ? data.address : "",
                            addressLine2: "",
                            city: data['city'] ? data['city'] : "",
                            area: data['area'] ? data['area'] : "",
                            state: data['state'] ? data['state'] : "",
                            postalCode: data['postalCode'] ? data['postalCode'] : "",
                            country: data['country'] ? data['country'] : "",
                            location: {
                                longitude: req.payload.dropLongitude,
                                latitude: req.payload.dropLatitude,
                            },
                            pickUpZone: 0
                        };
                    } else {
                        appConfigData.googleData = {
                            placeId: "",
                            placeName: "",
                            addressLine1: "",
                            addressLine2: "",
                            city: "",
                            area: "",
                            state: "",
                            postalCode: "",
                            country: "",
                            location: {
                                longitude: req.payload.dropLongitude,
                                latitude: req.payload.dropLatitude,
                            },
                            pickUpZone: 0
                        };
                    }
                    return resolve(true);
                });
        });
    };

    const pickUpFetchAddress = () => {
        return new Promise((resolve, reject) => {
            appConfigData.googlePickupData = {};
            googleDistance.fetchAddress(req.payload.pickupLatitude, req.payload.pickupLongitude, [])
                .then((data) => {
                    if (data) {
                        appConfigData.googlePickupData = {
                            placeId: data.placeId ? data.placeId : "",
                            placeName: data.placeName ? data.placeName : "",
                            addressLine1: data.address ? data.address : "",
                            addressLine2: "",
                            city: data['city'] ? data['city'] : "",
                            area: data['area'] ? data['area'] : "",
                            state: data['state'] ? data['state'] : "",
                            postalCode: data['postalCode'] ? data['postalCode'] : "",
                            country: data['country'] ? data['country'] : "",
                            location: {
                                longitude: req.payload.pickupLongitude,
                                latitude: req.payload.pickupLatitude,
                            },
                            pickUpZone: 0
                        };
                    } else {
                        appConfigData.googlePickupData = {
                            placeId: "",
                            placeName: "",
                            addressLine1: "",
                            addressLine2: "",
                            city: "",
                            area: "",
                            state: "",
                            postalCode: "",
                            country: "",
                            location: {
                                longitude: req.payload.pickupLongitude,
                                latitude: req.payload.pickupLatitude,
                            },
                            pickUpZone: 0
                        };
                    }
                    return resolve(true);
                });
        });
    };

    const getAppConfig = (data) => {
        return new Promise((resolve, reject) => {
            appConfig.get({}, (err, appConfig) => {
                if (err) {
                    logger.error('Error occurred appConfig (get): ' + JSON.stringify(err));
                }

                appConfigData.dispatchSetting = appConfig.dispatch_settings;
                resolve(true);
            });
        });
    };
    const updatePickupSlots = (data) => {
        return new Promise((resolve, reject) => {
            zonesDeliverySlots.update({ "_id": new ObjectID(req.payload.pickupSlotId) }, {
                $inc: {
                    'bookedDelivery': 1,
                    'availableDelivery': -1
                }
            }, (err, slotData) => {
                if (err) {
                    logger.error('Error occurred appConfig (get): ' + JSON.stringify(err));
                    reject({ code: 500 });
                }
                resolve(true);
            });
        });
    };

    const updateDropSlots = () => {
        return new Promise((resolve, reject) => {
            zonesDeliverySlots.update({ "_id": new ObjectID(req.payload.dropSlotId) }, {
                $inc: {
                    'bookedDelivery': 1,
                    'availableDelivery': -1
                }
            }, (err, slotData) => {
                if (err) {
                    logger.error('Error occurred appConfig (get): ' + JSON.stringify(err));
                    reject({ code: 500 });
                }
                resolve(true);
            });
        });
    };



    let prepareBookingData = () => {
        return new Promise((resolve, reject) => {
            let totalAmount = 0;
            let subTotalAmount = 0;
            let discount = 0;
            let deliveryCharge = 0;
            let storeFreeDelivery = 0;
            let storeDeliveryFee = 0;
            let excTax = 0;
            let exclusiveTaxes = [];

            for (var i = 0; i < cartDetailsData.items.length; i++) {
                delete cartDetailsData.items[i].actions;
            }
            totalAmount = subTotalAmount;
            dataToInsert = {
                estimateId: '',
                storeId: 0,
                storeCoordinates: {
                    longitude: 0,
                    latitude: 0
                },
                Items: cartDetailsData.items ? cartDetailsData.items : [],
                orderId: orderId,
                isCominigFromStore: false,
                laundryBookingType: 1,
                weightMetric: cityData[0].cities.weightMetric,
                weightMetricText: cityData[0].cities.weightMetricText,
                qrCode: '',
                cartTotal: '',
                cartDiscount: '',
                bookingType: 1,
                bookingTypeMsg: "pickup",
                storeLogo: '',
                storeName: '',
                forcedAccept: 1,
                autoDispatch: 1,
                storeCommission: 0,
                storeCommissionType: 1,
                storeType: 5,
                storeTypeMsg: 'laundry',
                storeCommissionTypeMsg: "",
                driverType: 1,
                storeAddress: '',
                subTotalAmountWithExcTax: '',
                cartId: 0,
                deliveryCharge: responseData.estimateAmount,
                deliveryChargeSplit: responseData,
                storeFreeDelivery: storeFreeDelivery,
                storeDeliveryFee: storeDeliveryFee,
                subTotalAmount: subTotalAmount,
                excTax: excTax,
                exclusiveTaxes: exclusiveTaxes,
                orderType: 0,
                orderTypeMsg: 0,
                discount: discount,
                totalAmount: totalAmount,
                pickupSlotId: req.payload.pickupSlotId,
                dropSlotId: req.payload.dropSlotId,
                couponCode: '',
                paymentType: req.payload.paymentType ? req.payload.paymentType : 0,
                payByWallet: req.payload.payByWallet ? req.payload.payByWallet : 0,
                paymentTypeMsg: (((req.payload.paymentType == 1) ? 'Card' : (req.payload.paymentType == 2) ? 'Cash' : '') + ((req.payload.payByWallet == 1) ? " + Wallet" : "")),
                coinpayTransaction: {},
                customerCoordinates: req.payload.coordinates,
                bookingDate: req.payload.bookingDate,
                bookingDateTimeStamp: moment().unix(),
                dueDatetime: moment().format("YYYY-MM-DD HH:mm:ss"),
                dueDatetimeTimeStamp: moment().unix(),
                dueDatetimeDateFull: moment().format("YYYY-MM-DD HH:mm:ss"),
                dueDatetimeDate: moment().format("DD-MM-YYYY"),
                city: "",
                cityId: pickUpCityData.cityId ? pickUpCityData.cityId.toString() : "",
                status: 1,
                statusMsg: 'New Order',
                // serviceType: req.payload.serviceType ? req.payload.serviceType : "",
                serviceType: 2,
                bookingType: req.payload.bookingType ? req.payload.bookingType : 0,
                pricingModel: 0,
                zoneType: req.payload.zoneType ? req.payload.zoneType : "", // short zone ride booking
                extraNote: req.payload.extraNote ? req.payload.extraNote : "",
                customerDetails: {
                    customerId: customerData._id.toString(),
                    name: customerData.name ? customerData.name : "",
                    email: customerData.email ? customerData.email : "",
                    mobile: customerData.phone ? customerData.phone : "",
                    countryCode: customerData.countryCode ? customerData.countryCode : "",
                    profilePic: customerData.profilePic ? customerData.profilePic : "",
                    fcmTopic: customerData.fcmTopic ? customerData.fcmTopic : "", // FCM Push Topic
                    deviceType: customerData.mobileDevices ? customerData.mobileDevices.deviceType : 1,//device type 1-ios, 2-android
                    deviceId: customerData.mobileDevices ? customerData.mobileDevices.deviceId : "", // slave device id
                    mqttTopic: customerData.mqttTopic ? customerData.mqttTopic : "", // MQTT channel
                    mmjCard: customerData.mmjCard ? customerData.mmjCard.url : "",
                    identityCard: customerData.identityCard ? customerData.identityCard.url : ""
                },
                dispatchSetting: appConfigData.dispatchSetting,
                pickup: appConfigData.googlePickupData,
                drop: appConfigData.googleData,
                timeStamp: {
                    created: {
                        statusUpdatedBy: createdBy,//dispatcher / driver / customer
                        userId: customerData._id.toString(),
                        timeStamp: moment().unix(),
                        isoDate: new Date(),
                        location: {
                            longitude: req.payload.pickupLongitude,
                            latitude: req.payload.pickupLatitude
                        },
                        message: req.payload.extraNote,
                    }
                },
                activityLogs: [{
                    state: 'created',
                    statusUpdatedBy: createdBy,//dispatcher / driver / customer
                    userId: customerData._id.toString(),
                    timeStamp: moment().unix(),
                    isoDate: new Date(),
                    location: {
                        longitude: req.payload.pickupLongitude,
                        latitude: req.payload.pickupLatitude
                    },
                    message: req.payload.extraNote,
                }],
                "abbrevation": pickUpCityData.abbrevation ? pickUpCityData.abbrevation : "",
                "abbrevationText": pickUpCityData.abbrevationText ? pickUpCityData.abbrevationText : "",
                "currency": pickUpCityData.currency ? pickUpCityData.currency : "",
                "currencySymbol": pickUpCityData.currencySymbol ? pickUpCityData.currencySymbol : "",
                "mileageMetric": pickUpCityData.mileageMetric ? (pickUpCityData.mileageMetric == 1) ? "Miles" : "Km" : "",
                // paidBy: {
                //     card: (req.payload.paymentType == 1) ? (Number(Math.round(totAmountFee + 'e2') + 'e-2') + delFee) - discnt : 0,
                //     cash: (req.payload.paymentType == 2) ? (Number(Math.round(totAmountFee + 'e2') + 'e-2') + delFee) - discnt : 0,
                //     wallet: (req.payload.payByWallet == 1) ? (Number(Math.round(totAmountFee + 'e2') + 'e-2') + delFee) - discnt : 0
                // },
                paidBy: {
                    cash: 0,
                    wallet: 0,
                    card: 0,
                    cardChargeId: ""
                },
                "accouting": {
                    "driverType": 0,
                    "driverTypeMsg": "",
                    "taxes": 0,
                    "storeCommPer": 0,
                    "storeCommissionType": 0,
                    "storeCommissionTypeMsg": 0,
                    "driverCommPer": 0,
                    "driverCommType": 0,
                    "driverCommTypeMsg": "",
                    "appEarningValue": 0,
                    "driverEarningValue": 0,
                    "driverCommissionToAppValue": 0,
                    "storeEarningValue": 0,
                    "storeCommissionToAppValue": 0,
                    "cashCollected": 0,
                    "pgComm": 0,
                    "pgCommName": '',
                    "tollFee": 0,
                    "driverTip": 0,
                    "driverTotalEarningValue": 0,
                    "handlingFee": 0,
                    "appProfitLoss": 0
                },
                inDispatch: false
            }
            resolve(true);
        });
    };
    let getNearByStore = () => {
        return new Promise((resolve, reject) => {

            stores.getNearbyLaundry({
                lat: req.payload.pickupLatitude,
                long: req.payload.pickupLongitude,
                zoneId: pickUpZoneData[0]._id.toString(),
                storeCategoryId: req.payload.storeCategoryId,
                storeType: req.payload.storeType
            }, (err, store) => {
                if (err) {
                    reject({ code: 500 });
                }
                if (store) {
                    nearestStoreLatLong = store.coordinates;
                    nearestStoreLatLong.storeId = store._id.toString();

                } else {
                    nearestStoreLatLong = {};
                    nearestStoreLatLong.storeId = "";
                }
                resolve(true)
            })
        })
    }
    let getDistanceFromStoreToCustomer = () => {
        return new Promise((resolve, reject) => {
            let destDelivery = req.payload.dropLatitude + ',' + req.payload.dropLongitude;
            let originDelivery = nearestStoreLatLong.latitude + ',' + nearestStoreLatLong.longitude;
            googleDistance.calculateDistance(originDelivery, destDelivery).then(distanceMeasuredDelivery => {

                let distanceMilesDel = 0;
                let distanceKmDel = 0;
                let estimatedTimeDel = 0;
                let resultDel = distanceMeasuredDelivery.distance;
                resultDel *= 0.000621371192;
                distanceMeasuredDelivery.distanceMiles = resultDel;
                distanceMilesDel = resultDel;
                distanceKmDel = distanceMeasuredDelivery.distance;
                estimatedTimeDel = distanceMeasuredDelivery.duration;
                deliveryPriceDrop = (distanceMeasuredDelivery.distanceMiles > 0) ? parseFloat(parseFloat(parseFloat(distanceMeasuredDelivery.distanceMiles) * parseFloat(cityData[0].cities.mileagePrice)).toFixed(2)) : parseFloat(cityData[0].cities.mileagePrice);
                responseData.estimateAmount += deliveryPriceDrop;
                responseData.deliveryPriceFromLaundromatToCustomer = deliveryPriceDrop;
                resolve(true);
            }).catch((err) => {
                logger.error('Error occurred during fare calculate get (calculateDistance): ' + JSON.stringify(err));
                reject({ code: 500 });
            });

        })

    }

    let getDistanceFromCustomerToStore = () => {
        return new Promise((resolve, reject) => {
            let origin = req.payload.pickupLatitude + ',' + req.payload.pickupLongitude;
            let dest = nearestStoreLatLong.latitude + ',' + nearestStoreLatLong.longitude;
            googleDistance.calculateDistance(origin, dest).then(distanceMeasured => {

                let distanceMiles = 0;
                let distanceKm = 0;
                let estimatedTime = 0;
                let result = distanceMeasured.distance;
                result *= 0.000621371192;
                distanceMeasured.distanceMiles = result;
                distanceMiles = result;
                distanceKm = distanceMeasured.distance;
                estimatedTime = distanceMeasured.duration;
                deliveryPricePickup = (distanceMeasured.distanceMiles > 0) ? parseFloat(parseFloat(parseFloat(distanceMeasured.distanceMiles) * parseFloat(cityData[0].cities.mileagePrice)).toFixed(2)) : parseFloat(cityData[0].cities.mileagePrice);

                responseData.estimateAmount += deliveryPricePickup;
                responseData.pickupStoreEstimate
                responseData.deliveryPriceFromCustomerToLaundromat = deliveryPricePickup;
                resolve(true)
            }).catch((err) => {
                logger.error('Error occurred during fare calculate get (calculateDistance): ' + JSON.stringify(err));
                reject({ code: 500 });
            });
        })
    }

    let insertBooking = () => {
        return new Promise((resolve, reject) => {
            orders.postOrdersNew(dataToInsert, (err, response) => {
                if (err) {
                    logger.error('Error occurred appConfig (get): ' + JSON.stringify(err));
                    reject({ code: 500 })
                }
                orderData = response.ops[0];
                resolve(true);
            });
        });
    };

    let dispatchBooking = () => {
        return new Promise((resolve, reject) => {
            superagent.post(config.dispatchUrl)
                .send({ orderId: orderData.orderId, timestamp: moment().unix() })
                .end(function (err, res) {
                });
            resolve(true);
        });
    };

    function sendNotification(data) {
        //send to mqtt app store dispatch
        //  notifyi.notifyRealTime({ 'listner': 'newOrders/' + data.storeId, message: data });

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
                            msg: 'You’ve received a new order ' + data.orderId + ' from ' + data.customerDetails.name + '.',
                            fcmTopic: storeManager[s].fcmManagerTopic,
                            title: 'New Order.',
                            data: { orderId: data.orderId || '' }
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
                                action: 1,
                                usertype: 1,
                                deviceType: cityManager[k].mobileDevices.deviceType ? cityManager[k].mobileDevices.deviceType : 2,
                                notification: "",
                                msg: 'You’ve received a new order ' + data.orderId + ' from ' + data.customerDetails.name + '.',
                                fcmTopic: cityManager[k].fcmManagerTopic,
                                title: 'New Order.',
                                data: { orderId: data.orderId || '' }
                            },
                            () => { }
                        );
                    }
                }
            });
        });
        //send fcm topic push to central

        //send to web socket store dispatch
        // webSocket.publish('stafforderUpdate/' + data.storeId, data, { qos: 2 }, function (mqttErr, mqttRes) {
        // });

        managerTopics.sendToWebsocket(data, 2, (err, res) => {
        });
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
                dynamicItems.push('<tr style="border-bottom: 2px solid grey;"><td style="width:20%;padding-top: 15px;text-align:center"><img src=' + itms[i].itemImageURL + ' style="max-width: 100px;"></td><td style="width:60%;    padding-top: 15px;"><p style="margin:0;font-size: 14px;    font-weight: 600;">' + itms[i].itemName + '</p><p style="margin:0;font-size: 12px;    color: #666;    line-height: 1.6;">' + itms[i].catName + '  <br> ' + itms[i].subCatName + '  <br> Sold by: ' + data.storeName + '  </p></td><td style="width:20%;font-size: 13px;text-align: center;padding-top: 15px;">' + itms[i].quantity + '</td><td style="width:20%;text-align: right;font-size: 13px;padding-top: 15px;">' + data.currencySymbol + '' + itms[i].unitPrice + '</td></tr>');
            }
            email.getTemplateAndSendEmail({
                templateName: 'orderPlaced.html',
                toEmail: data.customerDetails.email,
                trigger: 'Order placed',
                subject: 'Order placed successfully.',
                keysToReplace: {
                    userName: data.customerDetails.name || '',
                    appName: config.appName,
                    orderPlacedDate: moment(moment.unix(data.bookingDateTimeStamp)).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                    addressLine1: (data.drop.flatNumber != "" ? data.drop.flatNumber + "," : "") + (data.drop.landmark != "" ? data.drop.landmark + "," : "") + (data.drop.addressLine1 != "" ? data.drop.addressLine1 + "," : "") + (data.drop.addressLine2 != "" ? data.drop.addressLine2 : ""),
                    addressLine2: (data.drop.city != "" ? data.drop.city + "," : "") + (data.drop.state != "" ? data.drop.state : "") + (data.drop.postalCode != "" ? "-" + data.drop.postalCode : ""),
                    country: data.drop.country,
                    orderCreationDate: moment(moment.unix(data.bookingDateTimeStamp)).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                    itemsCount: String(data.Items.length),
                    subTotalAmount: data.currencySymbol + '' + data.subTotalAmount,
                    deliveryCharge: data.currencySymbol + '' + data.deliveryCharge,
                    discount: data.currencySymbol + '' + data.discount,
                    tax: data.currencySymbol + '' + data.excTax ? data.excTax : 0,
                    totalAmount: data.currencySymbol + '' + data.totalAmount,
                    pendingAmount: (data.paymentType === 2) ? data.currencySymbol + '' + data.totalAmount : data.currencySymbol + '' + 0,
                    orderId: String(data.orderId),
                    storeName: data.storeName,
                    webUrl: data.webUrl,
                    dynamicItems: dynamicItems
                }
            }, () => {
            });
        }


        let customerData = {
            status: parseInt(data.status),
            statusMessage: data.statusMsg,
            statusMsg: data.statusMsg,
            bid: data.orderId
        };

        notifyi.notifyRealTime({ 'listner': data.customerDetails.mqttTopic, message: customerData });


        notifications.notifyFcmTopic({
            action: 11,
            usertype: 1,
            deviceType: data.customerDetails.deviceType,
            notification: "",
            msg: 'Order placed successfully.',
            fcmTopic: data.customerDetails.fcmTopic,
            title: 'Order Placed.',
            data: customerData
        }, () => {
        });
    }

    getCustomerData()
        .then(checkCityForPickup)
        .then(checkCityForDrop)
        .then(checkOperationZoneForThisBooking)
        .then(getPickupAreaZone)
        .then(getDropAreaZone)
        .then(getNearByStore)
        .then(getDistanceFromCustomerToStore)
        .then(getDistanceFromStoreToCustomer)
        .then(getAppConfig)
        .then(pickUpFetchAddress)
        .then(dropFetchAddress)
        .then(cartDetails)
        .then(prepareBookingData)
        .then(insertBooking)
        .then(updatePickupSlots)
        .then(updateDropSlots)
        .then(removeCart)
        .then(dispatchBooking)
        .then(data => {

            return reply({
                message: req.i18n.__('customerPostBooking')['200'],
                data: {}
            }).code(200);
        }).catch(e => {
            logger.error("Customer ride live booking API error =>", e)
            return reply({
                message: e.message
            }).code(e.code);
        });

};

const responseCode = {
    status: {
        // 500: {
        //     message: Joi.any().default(errorMsg['genericErrMsg']['500'])
        // },
        // 200: {
        //     message: Joi.any().default(errorMsg['customerPostBooking']['200']),
        //     data: Joi.any()
        // },
        // 402: {
        //     message: Joi.any().default(errorMsg['customerPostBooking']['402'])
        // },
        // 403: {
        //     message: Joi.any().default(errorMsg['customerPostBooking']['403'])
        // },
        // 405: {
        //     message: Joi.any().default(errorMsg['customerPostBooking']['405'])
        // },
        // 406: {
        //     message: Joi.any().default(errorMsg['customerPostBooking']['406'])
        // },
        // 410: {
        //     message: Joi.any().default(errorMsg['customerPostBooking']['410'])
        // },
        // 409: {
        //     message: Joi.any().default(errorMsg['customerPostBooking']['409'])
        // }
    }
} //swagger response code

module.exports = {
    payloadValidator,
    APIHandler,
    responseCode
};