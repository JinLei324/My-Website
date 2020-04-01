'use strict'
const orders = require('../../../../../models/order');
const customer = require('../../../../../models/customer');
const appConfig = require('../../../../../models/appConfig');
const stores = require('../../../../../models/stores');
const childProducts = require('../../../../../models/childProducts');
const storeManagers = require('../../../../../models/storeManagers');
const cartModel = require('../../../../../models/cart');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const serverDispatcher = require('../../../../commonModels/serverDispatch.js');
const moment = require('moment');
const webSocket = require('../../../../../library/websocket/websocket');
const ObjectID = require('mongodb').ObjectID;
const request = require('request');
const async = require('async');
const mqttModule = require('../../../../../library/mqttModule/mqtt.js');
// const promoCodeHandler = require('../../../promoCode/post');
const email = require('../../../../commonModels/email/email');
// Reverse Geocoding
let geocodder = require('node-geocoder');
const superagent = require('superagent');
const notifications = require('../../../../../library/fcm');
const notifyi = require('../../../../../library/mqttModule');

const managerTopics = require('../../../../commonModels/managerTopics');
var options = {
    provider: 'google',
    // Optionnal depending of the providers
    httpAdapter: 'https', // Default
    apiKey: config.GoogleMapsApiKEy, // for Mapquest, OpenCage, Google Premier
    formatter: null        // 'gpx', 'string', ...
};
let geo = geocodder(options);
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
    let condition = {};
    let createdBy = "";
    switch (req.payload.customerPOSId == null ? req.auth.credentials.sub : req.payload.customerPOSId) {
        case 'customer':
            createdBy = req.auth.credentials.sub;
            condition = { _id: new ObjectID(req.auth.credentials._id.toString()) }
            break;
        case 'manager':
            createdBy = req.auth.credentials.sub;
            condition = { _id: new ObjectID(req.payload.customerId) }
            break;
        default:
            createdBy = "pos";
            condition = { customerPOSId: parseInt(req.payload.customerPOSId) }
    }
    req.payload.coordinates = {
        longitude: req.payload.longitude,
        latitude: req.payload.latitude
    };
    let cart = [];
    let payload = req.payload;
    cart = req.payload.cart.length > 0 ? req.payload.cart : [];
    let appConfigData = {};
    let dataToInsert = {};
    const readConfig = (data) => {
        return new Promise((resolve, reject) => {
            appConfig.get({}, (err, appConfig) => {
                if (err) {
                    logger.error('Error occurred place order (get): ' + JSON.stringify(err));
                }
                appConfigData.dispatchSetting = appConfig.dispatch_settings;
                resolve(appConfigData);
            });
        });
    };
    const fetchAddress = (lat, long) => {
        return new Promise((resolve, reject) => {
            geo.reverse({ lat: lat, lon: long }, (err, data) => {
                if (err) {
                    logger.error('Error occurred place order (reverse): ' + JSON.stringify(err));
                }
                if (data && data[0]) {
                    appConfigData.googleData = {
                        placeId: data[0]['extra']['googlePlaceId'] ? data[0]['extra']['googlePlaceId'] : "",
                        placeName: data[0]['extra']['neighborhood'] ? data[0]['extra']['neighborhood'] : "",
                        addressLine1: req.payload.address1 ? req.payload.address1 : data[0]['formattedAddress'] ? data[0]['formattedAddress'] : "",
                        addressLine2: req.payload.address2 ? req.payload.address2 : "",
                        city: data[0]['city'] ? data[0]['city'] : "",
                        area: data[0]['extra']['neighborhood'] ? data[0]['extra']['neighborhood'] : "",
                        state: data[0]['administrativeLevels']['level1long'] ? data[0]['administrativeLevels']['level1long'] : "",
                        postalCode: data[0]['zipcode'] ? data[0]['zipcode'] : "",
                        country: data[0]['country'] ? data[0]['country'] : "",
                        location: {
                            "longitude": long,
                            "latitude": lat
                        },
                        dropZone: 0
                    }
                } else {
                    appConfigData.googleData = {
                        placeId: "",
                        placeName: "",
                        addressLine1: req.payload.address1 ? req.payload.address1 : "",
                        addressLine2: req.payload.address2 ? req.payload.address2 : "",
                        city: "",
                        area: "",
                        state: "",
                        postalCode: "",
                        country: "",
                        location: {
                            "longitude": long,
                            "latitude": lat
                        },
                        dropZone: 0
                    }
                }
                return resolve(appConfigData);
            });
        });
    };
    customer.isExistsWithIdPos(condition, (err, customerData) => {
        if (err) {
            logger.error('Error occurred place order (isExistsWithId): ' + JSON.stringify(err));
            return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
        }
        if (customerData) {
            // if (req.payload.customerPOSId == null) {
            //     if (customerData.status == 0)
            //         return reply({ message: error['genericErrMsg']['401'][req.headers.language] }).code(401);
            //     if ((customerData.identityCard.verified == false) && customerData.status != 2 || (customerData.identityCard.verified == true) && customerData.status != 2)
            //         return reply({ message: error['verifyId']['401'][req.headers.language] }).code(401);
            //     if ((customerData.mmjCard.verified == false) && customerData.status != 2 ||
            //         (customerData.mmjCard.verified == true) && customerData.status != 2)
            //         return reply({ message: error['verifyId']['402'][req.headers.language] }).code(402);
            // }
            for (let g = 0; g < cart.length; g++) {
                if (cart[g].storeId.length != 24) {
                    return reply({ message: "StoreId must be an mongoId" }).code(400);
                }
            }

            fetchAddress(req.payload.latitude, req.payload.longitude).then(readConfig)
                .then(appConfig => {
                    async.each(cart, (item, callback) => {
                        getProducts(item.products).then((readStore(item.storeId))).then(storeData => {
                            logger.error('Error occurred storeData (reverse): ' + JSON.stringify(storeData));
                            geo.reverse({ lat: storeData.coordinates ? storeData.coordinates.latitude : item.storeLatitude, lon: storeData.coordinates ? storeData.coordinates.longitude : item.storeLongitude }, (err, data) => {
                                if (err)
                                    logger.error('Error occurred place order (reverse): ' + JSON.stringify(err));
                                appConfig.googlePickupData = {};
                                if (data && data[0]) {
                                    appConfig.googlePickupData = {
                                        placeId: data[0]['extra']['googlePlaceId'] ? data[0]['extra']['googlePlaceId'] : "",
                                        placeName: data[0]['extra']['neighborhood'] ? data[0]['extra']['neighborhood'] : "",
                                        addressLine1: storeData.businessAddress ? storeData.businessAddress[req.headers.language] : item.storeAddress ? data[0]['formattedAddress'] ? data[0]['formattedAddress'] : "" : "",
                                        addressLine2: "",
                                        city: data[0]['city'] ? data[0]['city'] : "",
                                        area: data[0]['extra']['neighborhood'] ? data[0]['extra']['neighborhood'] : "",
                                        state: data[0]['administrativeLevels']['level1long'] ? data[0]['administrativeLevels']['level1long'] : "",
                                        postalCode: data[0]['zipcode'] ? data[0]['zipcode'] : "",
                                        country: data[0]['country'] ? data[0]['country'] : "",
                                        location: {
                                            longitude: storeData.coordinates ? storeData.coordinates.longitude : item.storeLongitude,
                                            latitude: storeData.coordinates ? storeData.coordinates.latitude : item.storeLatitude,
                                        },
                                        pickUpZone: 0
                                    };
                                } else {
                                    appConfig.googlePickupData = {
                                        placeId: "",
                                        placeName: "",
                                        addressLine1: item.storeAddress ? item.storeAddress : "",
                                        addressLine2: "",
                                        city: "",
                                        area: "",
                                        state: "",
                                        postalCode: "",
                                        country: "",
                                        location: {
                                            longitude: storeData.coordinates ? storeData.coordinates.longitude : item.storeLongitude,
                                            latitude: storeData.coordinates ? storeData.coordinates.latitude : item.storeLatitude,
                                        },
                                        pickUpZone: 0
                                    };
                                }
                                dataToInsert = {
                                    storeId: item.storeId,
                                    storeCoordinates: {
                                        longitude: storeData.coordinates ? storeData.coordinates.longitude : item.storeLongitude,
                                        latitude: storeData.coordinates ? storeData.coordinates.latitude : item.storeLatitude,
                                    },
                                    storeLogo: storeData.profileLogos ? storeData.profileLogos.logoImage : item.storeLogo,
                                    storeName: storeData.name ? storeData.name[req.headers.language] : item.storeName,
                                    forcedAccept: storeData.forcedAccept ? storeData.forcedAccept : 1,
                                    driverType: storeData.driverType ? storeData.driverType : 1,
                                    storeAddress: storeData.businessAddress ? storeData.businessAddress[req.headers.language] : item.storeAddress,
                                    orderId: parseInt(moment().valueOf()),
                                    cartId: req.payload.cartId ? req.payload.cartId : "",
                                    deliveryCharge: parseFloat(item.storeDeliveryFee),
                                    subTotalAmount: parseFloat(item.storeTotalPrice),
                                    discount: req.payload.discount ? req.payload.discount : 0,
                                    totalAmount: parseFloat(item.storeTotalPrice) - (req.payload.discount ? req.payload.discount : 0) + parseFloat(item.storeDeliveryFee),
                                    couponCode: req.payload.couponCode ? req.payload.couponCode : "",
                                    Items: item.products,
                                    paymentType: req.payload.paymentType ? req.payload.paymentType : 0,
                                    customerCoordinates: req.payload.coordinates,
                                    bookingDate: req.payload.bookingDate,
                                    dueDatetime: req.payload.dueDatetime,
                                    city: req.payload.city ? req.payload.city : "",
                                    cityId: req.payload.cityId ? req.payload.cityId : "",
                                    status: 1,
                                    statusMsg: 'New Order',
                                    serviceType: req.payload.serviceType ? req.payload.serviceType : "",
                                    bookingType: req.payload.bookingType ? req.payload.bookingType : 0,
                                    pricingModel: req.payload.pricingModel ? req.payload.pricingModel : 0,
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
                                        deviceType: req.payload.deviceType,//device type 1-ios, 2-android
                                        deviceId: req.payload.deviceId, // slave device id
                                        mqttTopic: customerData.mqttTopic ? customerData.mqttTopic : "", // MQTT channel
                                        mmjCard: customerData.mmjCard ? customerData.mmjCard.url : "",
                                        identityCard: customerData.identityCard ? customerData.identityCard.url : ""
                                    },
                                    dispatchSetting: appConfig.dispatchSetting,
                                    pickup: appConfig.googlePickupData,
                                    drop: appConfig.googleData, timeStamp: {
                                        created: {
                                            statusUpdatedBy: createdBy,//dispatcher / driver / customer
                                            userId: customerData._id.toString(),
                                            timeStamp: moment().unix(),
                                            isoDate: new Date(),
                                            location: {
                                                longitude: req.payload.longitude,
                                                latitude: req.payload.latitude
                                            },
                                            message: req.payload.extraNote,
                                            ip: req.payload.ipAddress
                                        }
                                    },
                                    "currency": req.payload.currency ? req.payload.currency : "",
                                    "currencySymbol": req.payload.currencySymbol ? req.payload.currencySymbol : "",
                                    "mileageMetric": req.payload.mileageMetric ? (req.payload.mileageMetric == 1) ? "Miles" : "Km" : ""
                                }

                                orders.postOrdersNew(dataToInsert, (err, response) => {
                                    if (err) {
                                        logger.error('Error occurred place order (postOrders): ' + JSON.stringify(err));
                                        callback({ code: 500 });
                                    } else {
                                        cartModel.clearCart({
                                            customerName: customerData.name,
                                            createdBy: createdBy,
                                            cartId: req.payload.cartId ? req.payload.cartId : "5a8ae00aecf9111111111111",
                                            userId: customerData._id.toString(), orderId: response.ops[0].orderId,
                                            storeId: response.ops[0].storeId
                                        }, (err, isCleared) => {
                                            if (req.payload.customerPOSId == null) {
                                                let childProductIds = [];
                                                for (let s = 0; s < item.products.length; s++) {
                                                    childProductIds.push(new ObjectID(item.products[s].childProductId));
                                                }

                                                childProducts.pushToOrdered({ orderId: response.ops[0].orderId, userId: customerData._id.toString(), childProductId: childProductIds, createdBy: createdBy }, (err, data) => {
                                                });
                                            }
                                            // if (response.ops[0].couponCode != '') {
                                            //     promoCodeHandler.lockCouponCodeHandler({
                                            //         cartId: response.ops[0].cartId,
                                            //         bookingId: response.ops[0].orderId,
                                            //         deliveryFee: response.ops[0].deliveryCharge,
                                            //         userId: customerData._id.toString(),
                                            //         userName: customerData.name,
                                            //         userEmail: customerData.email,
                                            //         userCountryCode: customerData.countryCode,
                                            //         userPhone: customerData.phone,
                                            //         couponCode: response.ops[0].couponCode,
                                            //         "cityId": req.payload.cityId ? req.payload.cityId : "",
                                            //         "currency": response.ops[0].currency,
                                            //         "currencySymbol": response.ops[0].currencySymbol,
                                            //         "finalPayableAmount": response.ops[0].totalAmount,
                                            //         "zoneId": "string",
                                            //         "paymentMethod": 3,
                                            //         "vehicleType": 4,
                                            //         "amount": response.ops[0].subTotalAmount,
                                            //         "cartValue": response.ops[0].subTotalAmount
                                            //     }, (err, response) => {
                                            //     });
                                            // }
                                            if (response.ops[0].forcedAccept == 2) {
                                                //disable2
                                                // if (response.ops[0].bookingType == 1) {
                                                orders.setExPresence({
                                                    time: appConfig.storeAcceptExpireTime ? appConfig.storeAcceptExpireTime : 60,
                                                    key: 'nowBooking_' + response.ops[0].orderId + ''
                                                }, (err, data) => {
                                                });
                                                // }
                                            } else { // driect driver
                                                logger.warn("enabled force accept");
                                                superagent.post(config.dispatchUrl)
                                                    .send({ orderId: response.ops[0].orderId, timestamp: moment().unix() })
                                                    .end(function (err, res) {
                                                    });
                                            }
                                            sendNotification(response.ops[0]);
                                            callback({ code: 200 });
                                        });
                                    }
                                });
                            });
                        }).catch(e => {
                            logger.error('Error occurred place order get store (catch): ' + JSON.stringify(e));
                            return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                        });
                    },
                        (err) => {
                            if (err.code == 500) {
                                return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                            }

                            return reply({ message: error['orders']['200'][req.headers.language] }).code(200);
                        });
                }).catch(e => {
                    logger.error('Error occurred place order (catch): ' + JSON.stringify(e));
                    return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
                });
        } else
            return reply({ message: error['slaveSignIn']['404'][req.headers.language] }).code(404);
    });
    const readStore = (itemId) => {
        return new Promise((resolve, reject) => {
            stores.isExist({ id: itemId }, (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    }
    const getProducts = (products) => {
        return new Promise((resolve, reject) => {
            async.each(products, (item, callback) => {
                childProducts.isExistsWithIdPos({ productPosId: parseInt(item.childProductId) }, (err, data) => {
                    if (err) {
                        return callback({ code: 500 });
                    }
                    logger.error(JSON.stringify(data));
                    if (data) {
                        item.childProductId = data._id ? data._id.toString() : item.childProductId
                        logger.error(data._id);

                        logger.warn(JSON.stringify(item.childProductId))
                        logger.warn('item.childProductId')

                        return callback({ code: 200 });
                    }
                });
            }, (err) => {
                if (err.code == 500) {
                    return reject(err);
                }
                return resolve(true);
            });
        });

    }
    function sendNotification(data) {
        //send to mqtt app store dispatch
        // notifyi.notifyRealTime({ 'listner': 'newOrders/' + data.storeId, message: data });

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
                            msg: req.i18n.__(req.i18n.__('bookingStatusMsg')[data.status], data.orderId),
                            fcmTopic: storeManager[s].fcmManagerTopic,
                            title: req.i18n.__(req.i18n.__('bookingStatusTitle')[data.status]),
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
                                action: 1,
                                usertype: 1,
                                deviceType: cityManager[k].mobileDevices.deviceType ? cityManager[k].mobileDevices.deviceType : 2,
                                notification: "",
                                msg: req.i18n.__(req.i18n.__('bookingStatusMsg')[data.status], data.orderId),
                                fcmTopic: cityManager[k].fcmManagerTopic,
                                title: req.i18n.__(req.i18n.__('bookingStatusTitle')[data.status]),
                                data: {}
                            },
                            () => { }
                        );
                    }
                }
            });
        });
        //send to web socket store dispatch
        // webSocket.publish('stafforderUpdate/' + data.storeId, data, { qos: 2 }, (mqttErr, mqttRes) => { });
        managerTopics.sendToWebsocket(data, 2, (err, res) => {
        });
        // customer.updateOrderCount({ userId: data.customerDetails.customerId, createdBy: createdBy, amount: data.totalAmount }, (err, data) => {
        // });
        let itms = data.Items ? data.Items : [];
        var dynamicItems = [];
        if (config.mailGunService == "true") {
            for (let i = 0; i < itms.length; i++) {
                dynamicItems.push('<tr style="border-bottom: 2px solid grey;"><td style="width:20%;padding-top: 15px;text-align:center"><img src=' + itms[i].itemImageURL + ' style="max-width: 100px;max-height: 100px;"></td><td style="width:60%;    padding-top: 15px;"><p style="margin:0;font-size: 14px;    font-weight: 600;">' + itms[i].itemName + '</p><p style="margin:0;font-size: 12px;    color: #666;    line-height: 1.6;">Vaporizers  <br> Category Indica  <br> Sold by: ' + data.storeName + '  </p></td><td style="width:20%;font-size: 13px;text-align: center;padding-top: 15px;">' + itms[i].quantity + '</td><td style="width:20%;text-align: right;font-size: 13px;padding-top: 15px;">' + data.currencySymbol + '' + itms[i].unitPrice + '</td></tr>');
            }
            email.getTemplateAndSendEmail({
                templateName: 'orderPlaced.html',
                toEmail: data.customerDetails.email,
                trigger: 'Order placed',
                subject: 'Order placed successfully',
                keysToReplace: {
                    userName: data.customerDetails.name || '',
                    appName: config.appName,
                    orderPlacedDate: moment(moment.unix(data.bookingDateTimeStamp)).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                    addressLine1: (data.drop.flatNumber != "" ? data.drop.flatNumber + "," : "") + (data.drop.landmark != "" ? data.drop.landmark + "," : "") + (data.drop.addressLine1 != "" ? data.drop.addressLine1 + "," : "") + (data.drop.addressLine2 != "" ? data.drop.addressLine2 : ""),
                    addressLine2: (data.drop.city != "" ? data.drop.city + "," : "") + (data.drop.state != "" ? data.drop.state : "") + (data.drop.postalCode != "" ? "-" + data.drop.postalCode : ""),
                    country: data.drop.country,
                    orderCreationDate: moment(moment.unix(data.bookingDateTimeStamp)).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
                    itemsCount: data.Items.length,
                    subTotalAmount: data.currencySymbol + '' + data.subTotalAmount,
                    deliveryCharge: data.currencySymbol + '' + data.deliveryCharge,
                    discount: data.currencySymbol + '' + data.discount,
                    tax: data.currencySymbol + '' + data.tax ? data.tax : 0,
                    totalAmount: data.currencySymbol + '' + data.totalAmount,
                    pendingAmount: (data.paymentType === 2) ? data.currencySymbol + '' + data.totalAmount : data.currencySymbol + '' + 0,
                    orderId: data.orderId,
                    storeName: data.storeName,
                    webUrl: data.webUrl,
                    dynamicItems: dynamicItems
                }
            }, () => {
            });
        }

    }
}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    orderIdPOS: Joi.string().required().description('orderIdPOS'),
    customerName: Joi.string().required().description('string').default('Fredi pos'),
    customerEmail: Joi.string().required().description('string').default('nissanpos.fredi@gmail.com'),
    customerIdPOS: Joi.string().required().min(24).max(24).description('customerIdPOS userid').default('5a6879f17f8166ed56a83206'),
    countryCode: Joi.string().required().description('string').default('+1'),
    customerPhoneNumber: Joi.string().required().description('string').default('9876543210'),
    customerAddressLine1: Joi.string().required().description('string').default('2305 Historic Decatur Rd'),
    customerAddressLine2: Joi.string().required().description('string').default('Liberty Station'),
    customerCity: Joi.string().required().description('string').default('San Diego'),
    customerState: Joi.string().required().description('string').default('CA'),
    customerCountry: Joi.string().required().description('string').default('United States'),
    customerPlaceId: Joi.string().required().description('string').default('dsasafdsfsafwrarfa'),
    customerPlaceName: Joi.string().required().description('string').default('Historic Decatur'),
    customerPincode: Joi.string().required().description('string').default('92106'),
    customerLatitude: Joi.number().required().description("Customer Latitude is required").default(32.73434),
    customerLongitude: Joi.number().required().description("Customer Longitude is required").default(-117.2164),

    // customerAddressLine2: Joi.string().description('string').allow(""),
    // city: Joi.string().description('string').allow(""),
    // state: Joi.string().description('string').allow(""),
    // country: Joi.string().description('string').allow(""),
    // pincode: Joi.string().description('string').allow(""),
    // placeId: Joi.string().description('string').allow(""),
    // placeName: Joi.string().description('string').allow(""),
    paymentType: Joi.number().min(1).max(2).required().description(' 1 is Card, 2 - Cash, 3 - QuickCard'),
    customerQuickcardId: Joi.string().description('Incase QuickCard is used ').allow(""),
    cart: Joi.array().items().required().description('array structure should be in this format : ').not("[]").error(new Error('cart is missing')).default(JSON.stringify([{ "products": [{ "productId": "5a2bea43e0dc3f40c23e5fb2", "itemImageURL": "https://static.eazeup.com/images/public/f87eb536-eeac-4ad3-8c5a-e9f9d98ff20d_Neutron_Genetics_Mars_OG_Menu_preview.jpeg", "itemName": "Sour Diesel", "quantity": 1, "unitPrice": 750 }], "storePlaceId": "ChIJ_dk-T7kXrjsRtb52SCCzp6w", "storePlaceName": "Vishveshvaraiah Nagar", "storeCity": "Bengaluru", "storeCountry": "India", "storePostalCode": "560024", "storeState": "Karnataka", "storeAddress": "3225 N Harbor Dr, San Diego, CA 92101, USA", "storeDeliveryFee": 0, "storeId": "5a1974a0e0dc3f28f46dd4df", "storeLatitude": "32.7303662", "storeLogo": "http://gfarma.news/wp-content/uploads/2017/10/o-WEED-facebook.jpg", "storeLongitude": "-117.1916241", "storeName": "Nisan Weeds", "storeTotalPrice": 1628 }])),
    //cartId: Joi.string().required().description('cart Id').error(new Error('cart id missing')),
    // deviceId: Joi.string().description('device id'),
    // appVersion: Joi.string().description('app version'),
    // deviceMake: Joi.string().description('Device Make'),
    // deviceModel: Joi.string().description('Device model'),
    // deviceType: Joi.number().required().integer().min(1).max(4).description('1- IOS , 2- Android, 3- Web 4-pos'),

    bookingDate: Joi.string().required().description("Order dateTime is required").default("2018-01-24T06:31:40.513Z"),
    dueDatetime: Joi.string().required().description("Due dateTime(ISO format) is required").default("2018-01-24T06:31:40.513Z"),
    serviceType: Joi.number().integer().min(1).max(2).required().description('1 for delivery ,2 for pickup'),
    bookingType: Joi.number().integer().min(1).max(2).required().description('1 for now booking, 2 for later booking').default(1),
    // zoneType: Joi.number().integer().min(1).max(2).description('1 for short zone ride booking, 2 for long zone'),
    extraNote: Joi.string().description('extraNote').allow(""),
    ipAddress: Joi.string().description('Ip Address')
}
/**
* A module that exports customer place order!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }



