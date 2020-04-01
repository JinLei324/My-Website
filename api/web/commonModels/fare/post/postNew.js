"use strict";
const zones = require("../../../../models/zones");
const stores = require("../../../../models/stores");
const childProducts = require("../../../../models/childProducts");
const cities = require("../../../../models/cities");
const estimationFare = require("../../../../models/estimationFare");
const googleDistance = require("../../../commonModels/googleApi");
const error = require("../../../../statusMessages/responseMessage"); // response messages based on language
const cart = require("../../../../models/cart");
const config = process.env;
const Joi = require("joi");
const logger = require("winston");
const async = require("async");
const distance = require("google-distance");
const ObjectID = require("mongodb").ObjectID;
const _ = require("underscore-node");
const turfLibrary = require("../../../routes/driver/redisEvent/postRedisEvent");
/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {


  //  request.headers.language = "en"; // remove in last
  switch (request.auth.credentials.sub) {
    case "customer":
      request.auth.credentials._id = request.auth.credentials._id;
      break;
    case "manager":
      request.auth.credentials._id = request.payload.customerId;
      break;
    case "guest":
      request.auth.credentials._id = request.auth.credentials._id;
      break;
    case "dispatcher":
      request.auth.credentials._id = request.payload.customerId;
      break;
    default:
      return reply({
        message: request.i18n.__("genericErrMsg")["500"]
      }).code(500);
  }
  request.user = request.user ? request.user : {};
  let zoneData = {};
  let cartData = {};
  let cityData = {};
  let zoneIds = [];
  let cartId = "";
  let pickUpZoneData = {}
  let pickUpZoneIds = []



  const readZone = () => {
    return new Promise((resolve, reject) => {
      zones.inZoneAll({ lat: request.payload.latitude, long: request.payload.longitude }, (err, data) => {
        if (err) {
          logger.error("Error occurred during get fare (inZoneAll): " + JSON.stringify(err));
          reject({ code: 500 });
        }
        if (request.payload.status == 2 || data.length > 0) {
          if (request.payload.status == 1) {
            for (let j = 0; j < data.length; j++) {
              zoneIds.push(data[j]._id.toString());
            }
          }
          zoneData = zoneIds;
          resolve(zoneData);
        } else {
          reject({ code: 400 });
        }
      });
    });
    // turfLibrary.isWithinPolygons(request.payload.latitude, request.payload.longitude, (err, res) => {
    //     if (res) {
    //         zoneData = res;
    //         resolve(_.pick(zoneData, "_id", "city_ID", "city", "currency", "currencySymbol", "title", "mileageMetric", "cityId", "weightMetric", "zoneId"));

    //     }

    // });
  };
  const readPickUpZone = () => {
    return new Promise((resolve, reject) => {
      zones.inZoneAll({
        lat: request.payload.pickUpLat,
        long: request.payload.pickUpLong
      }, (err, data) => {
        if (err) {
          logger.error("Error occurred during get fare (inZoneAll): 3" + JSON.stringify(err));
          reject({
            code: 500
          });
        }
        if (request.payload.status == 2 || data.length > 0) {
          if (request.payload.status == 1) {
            for (let j = 0; j < data.length; j++) {
              pickUpZoneIds.push(data[j]._id.toString());
            }
          }
          pickUpZoneData = zoneIds;
          resolve(zoneData);
        } else {
          reject({
            code: 400
          });
        }
      });
    });
  };

  const readCity = () => {
    return new Promise((resolve, reject) => {
      cities.inZone({ lat: request.payload.latitude, long: request.payload.longitude }, (err, data) => {
        if (err) {
          logger.error("Error occurred during get fare (inZoneAll): " + JSON.stringify(err));
          reject({ code: 500 });
        }
        if (request.payload.status == 2 || (data && data.cities)) {
          if (request.payload.status == 2) {
            cityData = {};
          } else {
            data = data.cities[0];
            cityData = data;
          }

          resolve(cityData);
        } else {
          reject({ code: 400 });
        }
      });
      // turfLibrary.isCityWithinPolygons(request.payload.latitude, request.payload.longitude, (err, res) => {
      //     if (res) {
      //         cityData = res;
      //         resolve(_.pick(cityData, "_id", "city_ID", "city", "currency", "currencySymbol", "title", "mileageMetric", "cityId", "weightMetric", "zoneId"));

      //     }

      // });
    });
  };
  const readCart = () => {
    return new Promise((resolve, reject) => {

      cart.getAll({
        userId: request.auth.credentials._id
      }, (err, data) => {

        if (err) {
          logger.error("Error occurred while getting cart : " + err);
          return reply({
            message: request.i18n.__("genericErrMsg")["500"]
          }).code(500);
        } else if (data.length > 0) {
          cartData = data;
          resolve(cartData);
        } else {
          reject({ code: 404 });
        }
      });
    });
  };

  if (request.payload.pickUpLat && request.payload.pickUpLong) {

    readCity()
      .then(readZone)
      .then(readPickUpZone)
      .then(readCart)
      .then(res => {
        let responseArray = [];
        let estimateArray = [];
        if (pickUpZoneData[0] === zoneData[0]) {

          let timFeeCalculate = 0;
          let distanceMiles = 0;
          let distanceKm = 0;
          let estimatedTime = 0;
          if (request.payload.status == 1) {
            let deliveryPrice = 0;
            let origin = request.payload.pickUpLat + "," + request.payload.pickUpLong;
            let dest = request.payload.latitude + "," + request.payload.longitude;
            googleDistance
              .calculateDistance(origin, dest)
              .then(distanceMeasured => {
                // distanceMeasured.distance =50;
                let baseFare = parseFloat(cityData.baseFare) ? parseFloat(cityData.baseFare) : 0;
                let minimunFare = parseFloat(cityData.minimumFare) ? parseFloat(cityData.minimumFare) : 0;
                let milageFare = parseFloat(cityData.mileagePrice) ? parseFloat(cityData.mileagePrice) : 0;
                let mileagePriceAfterDistance = parseFloat(cityData.mileagePriceAfterDistance) ? parseFloat(cityData.mileagePriceAfterDistance) : 0;
                let timeFare = parseFloat(cityData.timeFee) ? parseFloat(cityData.timeFee) : 0;
                let timeFeeAfterMinutes = parseFloat(cityData.timeFeeAfterMinutes) ? parseFloat(cityData.timeFeeAfterMinutes) : 0;

                let result = distanceMeasured.distance;
                result *= 0.000621371192;

                timFeeCalculate = parseInt(parseFloat(parseFloat(distanceMeasured.duration).toFixed(2)) / 60); // timefee for 5 mins;
                timFeeCalculate = parseFloat(parseFloat(timFeeCalculate - timeFeeAfterMinutes) * parseFloat(timeFare));

                distanceMeasured.distanceMiles = result;
                distanceMiles = result;
                distanceKm = Math.ceil(distanceMeasured.distance / 1000);

                estimatedTime = distanceMeasured.duration;
                let logic = 0;
                let totalDeliveryFee = 0;
                if (cityData.mileageMetric == 1) {
                  // miles
                  let chargeMiles = distanceMiles - mileagePriceAfterDistance;
                  if (chargeMiles > 0)
                    logic = parseFloat(parseFloat(parseFloat(chargeMiles) * parseFloat(milageFare)).toFixed(2));
                } else {
                  // km
                  let chargeKM = distanceKm - mileagePriceAfterDistance;
                  if (chargeKM > 0)
                    logic = parseFloat(parseFloat(parseFloat(chargeKM) * parseFloat(milageFare)).toFixed(2));
                }
                totalDeliveryFee = baseFare + logic + timFeeCalculate;
                deliveryPrice =
                  parseFloat(minimunFare) > totalDeliveryFee ? parseFloat(minimunFare) : totalDeliveryFee;

                responseArray.push({
                  storeDeliveryFee: parseFloat(parseFloat(deliveryPrice).toFixed(2)),
                  isDelivery: true,
                  currency: cityData.currency,
                  currencySymbol: cityData.currencySymbol,
                  distanceKm: distanceKm,
                  // estimatedTime: estimatedTime,

                });
                estimateArray.push({
                  userId: request.auth.credentials._id.toString(),
                  storeId: "",
                  orderValue: deliveryPrice,
                  currency: cityData.currency,
                  currencySymbol: cityData.currencySymbol,
                  customerName: request.user.name || "",
                  mileageMetric: cityData.mileageMetric,
                  mileageMetricText: cityData.mileageMetricText,
                  storeDeliveryFee: parseFloat(parseFloat(deliveryPrice).toFixed(2)),
                  deliveryPrice: parseFloat(parseFloat(deliveryPrice).toFixed(2)),
                  distanceMiles: distanceMiles,
                  distanceKm: distanceKm,
                  estimatedTime: estimatedTime,
                  estimateId: Math.floor(100000000 + Math.random() * 900000000),
                  timeFee: cityData.timeFee,
                  timFeeCalculate: timFeeCalculate,
                  mileagePrice: cityData.mileagePrice,
                  minimumFare: cityData.minimumFare,
                  isDelivery: true
                });

                if (request.payload.status == 1) {
                  estimationFare.save({
                    userId: request.auth.credentials._id,
                    createdBy: request.auth.credentials.sub,
                    actions: [{
                      userId: request.auth.credentials._id,
                      createdBy: request.auth.credentials.sub,
                      createdISO: new Date(),
                      timestamp: new Date().getTime()
                    }],
                    storeWiseFare: estimateArray
                  },
                    (err, data) => {
                    }
                  );
                  cart.updateEstimates({
                    _id: new ObjectID(cartData[0].cartId),
                    createdBy: request.auth.credentials.sub,
                    estimates: estimateArray
                  },
                    (err, data) => {
                      if (err) {
                        return reply({
                          message: request.i18n.__("genericErrMsg")["500"]
                        }).code(500);
                      }
                      return reply({
                        message: request.i18n.__("fare")["200"],
                        data: responseArray
                      }).code(200);
                    }
                  );
                } else {
                  return reply({
                    message: request.i18n.__("fare")["200"],
                    data: responseArray
                  }).code(200);
                }
              })
              .catch(err => {
                logger.error(
                  "Error occurred during fare calculate get (calculateDistance): 5" + JSON.stringify(err)
                );
                return reply({
                  message: request.i18n.__("checkOperationZone")["400"]
                }).code(400);
              });

          } else {
            return reply({
              message: request.i18n.__("checkOperationZone")["400"]
            }).code(400);
          }



        } else {

          return reply({
            message: request.i18n.__("checkOperationZone")["400"]
          }).code(400);
        }

      }).catch(err => {
        logger.error(
          "Error while calculating fare : " + JSON.stringify(err)
        );
        return reply({
          message: request.i18n.__("checkOperationZone")["400"]
        }).code(400);
      });
  } else {

    readCity()
      .then(readZone)
      .then(readCart)
      .then(res => {
        let responseArray = [];
        let estimateArray = [];
        let count = 0;
        async.each(
          cartData,
          (item, callback) => {
            // multiple stores
            cartId = item.cartId;
            logger.error(JSON.stringify(zoneIds));
            readStore(item.storeId, request.payload.status == 1 ? zoneIds : null)
              .then(store => {
                if (store) {
                  let timFeeCalculate = 0;
                  let distanceMiles = 0;
                  let distanceKm = 0;
                  let estimatedTime = 0;
                  if (request.payload.status == 1) {
                    let deliveryPrice = 0;
                    //     150 < 1000

                    let sTotalPrice = 0;
                    async.eachSeries(
                      item.products,
                      (subItem, callbackSub) => {
                        readProduct(
                          subItem.childProductId.toString(),
                          subItem.unitId.toString(),
                          subItem.quantity,
                          item["storeType"]
                        )
                          .then(productData => {
                            if (productData) {
                              for (let s = 0; s < productData.units.length; s++) {
                                productData.units[s].appliedDiscount = 0;
                                productData.units[s].offerId = "";
                                productData.units[s].title = productData.units[s].name[request.headers.language]
                                  ? productData.units[s].name[request.headers.language]
                                  : "";
                                productData.units[s].value = productData.units[s].price["en"]
                                  ? parseFloat(productData.units[s].price["en"])
                                  : 0;
                                productData.units[s].finalPrice = productData.units[s].value
                                  ? parseFloat(productData.units[s].value)
                                  : 0;
                                subItem.addOnsPrice = 0;
                                if (productData.units[s].addOns && productData.units[s].addOns.length > 0) {
                                  subItem.allAddOnsData = productData.units[s].addOns || [];
                                  subItem.addOnAvailable = 1;

                                  /*
                                                    Get the add on details from add ons collection and set it
                                                */
                                  let allAddOns = productData.units[s].addOns || [];
                                  let addOnData = [];

                                  let cartItems = subItem.addOns || [];
                                  let allProductAddOns = [];
                                  let cartAddOns = [];

                                  if (productData.units[s].unitId == subItem.unitId) {
                                    for (let l = 0; l < allAddOns.length; l++) {
                                      for (let m = 0; m < allAddOns[l].addOns.length; m++) {
                                        allProductAddOns.push(allAddOns[l].addOns[m]);
                                      }
                                    }
                                    for (let n = 0; n < cartItems.length; n++) {
                                      for (let o = 0; o < cartItems[n].addOnGroup.length; o++) {
                                        cartAddOns.push(cartItems[n].addOnGroup[o]);
                                      }
                                    }
                                    async.each(cartAddOns, (cartAddOnsData, callbackSub2) => {
                                      async.each(allProductAddOns, (allProductAddOn, callbackSub2) => {
                                        if (allProductAddOn.id == cartAddOnsData) {
                                          addOnData.push({
                                            name: allProductAddOn.name[request.headers.language],
                                            price: allProductAddOn.price,
                                            id: allProductAddOn.id
                                          });
                                        }
                                      });
                                    });

                                    if (addOnData.length > 0) {
                                      for (var a = 0; a < addOnData.length; a++) {
                                        subItem.addOnsPrice += parseFloat(addOnData[a].price) * parseInt(subItem.quantity);
                                      }
                                    }
                                  }
                                } else {
                                  subItem.addOnAvailable = 0;
                                }
                              }
                              sTotalPrice += subItem.finalPrice * subItem.quantity + subItem.addOnsPrice;
                              callbackSub();
                            }
                          })
                          .catch(e => {
                            logger.error("err during get cart111(catch) " + e);
                            return callbackSub("err");
                            // return reply({
                            //     message: request.i18n.__('genericErrMsg')['500']
                            // }).code(500);
                          });
                      },
                      function (err) {
                        if (err) {
                          callback("err");
                        } else {
                          item.storeTotalPrice = sTotalPrice;
                          if (parseFloat(item.storeTotalPrice) >= parseFloat(store.minimumOrder)) {
                            let origin = store.coordinates.latitude + "," + store.coordinates.longitude;
                            let dest = request.payload.latitude + "," + request.payload.longitude;
                            googleDistance
                              .calculateDistance(origin, dest)
                              .then(distanceMeasured => {
                                // distanceMeasured.distance =50;
                                let baseFare = parseFloat(cityData.baseFare) ? parseFloat(cityData.baseFare) : 0;
                                let minimunFare = parseFloat(cityData.minimumFare) ? parseFloat(cityData.minimumFare) : 0;
                                let milageFare = parseFloat(cityData.mileagePrice) ? parseFloat(cityData.mileagePrice) : 0;
                                let mileagePriceAfterDistance = parseFloat(cityData.mileagePriceAfterDistance) ? parseFloat(cityData.mileagePriceAfterDistance) : 0;
                                let timeFare = parseFloat(cityData.timeFee) ? parseFloat(cityData.timeFee) : 0;
                                let timeFeeAfterMinutes = parseFloat(cityData.timeFeeAfterMinutes) ? parseFloat(cityData.timeFeeAfterMinutes) : 0;

                                let result = distanceMeasured.distance;
                                result *= 0.000621371192;

                                timFeeCalculate = parseInt(parseFloat(parseFloat(distanceMeasured.duration).toFixed(2)) / 60); // timefee for 5 mins;
                                timFeeCalculate = parseFloat(parseFloat(timFeeCalculate - timeFeeAfterMinutes) * parseFloat(timeFare));

                                distanceMeasured.distanceMiles = result;
                                distanceMiles = result;
                                distanceKm = Math.ceil(distanceMeasured.distance / 1000);

                                estimatedTime = distanceMeasured.duration;
                                let logic = 0;
                                let totalDeliveryFee = 0;
                                if (cityData.mileageMetric == 1) {
                                  // miles
                                  let chargeMiles = distanceMiles - mileagePriceAfterDistance;
                                  if (chargeMiles > 0)
                                    logic = parseFloat(parseFloat(parseFloat(chargeMiles) * parseFloat(milageFare)).toFixed(2));
                                } else {
                                  // km
                                  let chargeKM = distanceKm - mileagePriceAfterDistance;
                                  if (chargeKM > 0)
                                    logic = parseFloat(parseFloat(parseFloat(chargeKM) * parseFloat(milageFare)).toFixed(2));
                                }
                                totalDeliveryFee = baseFare + logic + timFeeCalculate;
                                deliveryPrice =
                                  parseFloat(minimunFare) > totalDeliveryFee ? parseFloat(minimunFare) : totalDeliveryFee;
                                console.log("parseFloat(store.freeDeliveryAbove)", parseFloat(store.freeDeliveryAbove))
                                if (parseFloat(store.freeDeliveryAbove) > 0) {
                                  console.log("1111111-")
                                  if (parseFloat(item.storeTotalPrice) <= parseFloat(store.freeDeliveryAbove)) {
                                    responseArray.push({
                                      storeId: item.storeId,
                                      storeDeliveryFee: parseFloat(parseFloat(deliveryPrice).toFixed(2)),
                                      isDelivery: true,
                                      minimumOrderSatisfied: true
                                    });
                                    estimateArray.push({
                                      userId: request.auth.credentials._id.toString(),
                                      storeId: item.storeId,
                                      cartId: item.cartId,
                                      orderValue: item.storeTotalPrice,
                                      currency: cityData.currency,
                                      currencySymbol: cityData.currencySymbol,
                                      customerName: request.user.name,
                                      mileageMetric: cityData.mileageMetric,
                                      mileageMetricText: cityData.mileageMetricText,
                                      storeDeliveryFee: parseFloat(parseFloat(deliveryPrice).toFixed(2)),
                                      deliveryPrice: parseFloat(parseFloat(deliveryPrice).toFixed(2)),
                                      distanceMiles: distanceMiles,
                                      distanceKm: distanceKm,
                                      estimatedTime: estimatedTime,
                                      estimateId: Math.floor(100000000 + Math.random() * 900000000),
                                      timeFee: store.timeFee,
                                      timFeeCalculate: timFeeCalculate,
                                      mileagePrice: store.mileagePrice,
                                      minimumFare: store.minimumFare,
                                      isDelivery: true,
                                      minimumOrderSatisfied: true,
                                      minimumOrder: parseFloat(store.minimumOrder),
                                      freeDeliveryAbove: parseFloat(store.freeDeliveryAbove),
                                      storeFreeDelivery: false
                                    });
                                  } else {
                                    estimateArray.push({
                                      userId: request.auth.credentials._id.toString(),
                                      storeId: item.storeId,
                                      cartId: item.cartId,
                                      orderValue: item.storeTotalPrice,
                                      currency: cityData.currency,
                                      currencySymbol: cityData.currencySymbol,
                                      customerName: request.user.name,
                                      mileageMetric: cityData.mileageMetric,
                                      mileageMetricText: cityData.mileageMetricText,
                                      storeDeliveryFee: parseFloat(parseFloat(deliveryPrice).toFixed(2)),
                                      deliveryPrice: parseFloat(parseFloat(deliveryPrice).toFixed(2)),
                                      distanceMiles: distanceMiles,
                                      distanceKm: distanceKm,
                                      estimatedTime: estimatedTime,
                                      estimateId: Math.floor(100000000 + Math.random() * 900000000),
                                      timeFee: store.timeFee,
                                      timFeeCalculate: timFeeCalculate,
                                      mileagePrice: store.mileagePrice,
                                      minimumFare: store.minimumFare,
                                      isDelivery: true,
                                      minimumOrderSatisfied: true,
                                      minimumOrder: parseFloat(store.minimumOrder),
                                      freeDeliveryAbove: parseFloat(store.freeDeliveryAbove),
                                      storeFreeDelivery: true
                                    });
                                    responseArray.push({
                                      storeId: item.storeId,
                                      storeDeliveryFee: 0,
                                      isDelivery: true,
                                      minimumOrderSatisfied: true
                                    });
                                  }
                                } else {
                                  console.log("2222222-")
                                  responseArray.push({
                                    storeId: item.storeId,
                                    storeDeliveryFee: parseFloat(parseFloat(deliveryPrice).toFixed(2)),
                                    isDelivery: true,
                                    minimumOrderSatisfied: true
                                  });
                                  estimateArray.push({
                                    userId: request.auth.credentials._id.toString(),
                                    storeId: item.storeId,
                                    cartId: item.cartId,
                                    orderValue: item.storeTotalPrice,
                                    currency: cityData.currency,
                                    currencySymbol: cityData.currencySymbol,
                                    customerName: request.user.name,
                                    mileageMetric: cityData.mileageMetric,
                                    mileageMetricText: cityData.mileageMetricText,
                                    storeDeliveryFee: parseFloat(parseFloat(deliveryPrice).toFixed(2)),
                                    deliveryPrice: parseFloat(parseFloat(deliveryPrice).toFixed(2)),
                                    distanceMiles: distanceMiles,
                                    distanceKm: distanceKm,
                                    estimatedTime: estimatedTime,
                                    estimateId: Math.floor(100000000 + Math.random() * 900000000),
                                    timeFee: store.timeFee,
                                    timFeeCalculate: timFeeCalculate,
                                    mileagePrice: store.mileagePrice,
                                    minimumFare: store.minimumFare,
                                    isDelivery: true,
                                    minimumOrderSatisfied: true,
                                    minimumOrder: parseFloat(store.minimumOrder),
                                    freeDeliveryAbove: parseFloat(store.freeDeliveryAbove),
                                    storeFreeDelivery: false
                                  });
                                }

                                callback();
                              })
                              .catch(err => {
                                logger.error(
                                  "Error occurred during fare calculate get (calculateDistance): " + JSON.stringify(err)
                                );
                                return reply({ message: request.i18n.__("checkOperationZone")["400"] }).code(400);
                              });
                          } else {
                            estimateArray.push({
                              userId: request.auth.credentials._id.toString(),
                              storeId: item.storeId,
                              cartId: item.cartId,
                              orderValue: item.storeTotalPrice,
                              currency: cityData.currency,
                              currencySymbol: cityData.currencySymbol,
                              customerName: request.user.name,
                              mileageMetric: cityData.mileageMetric,
                              mileageMetricText: cityData.mileageMetricText,
                              storeDeliveryFee: parseFloat(parseFloat(deliveryPrice).toFixed(2)),
                              deliveryPrice: parseFloat(parseFloat(deliveryPrice).toFixed(2)),
                              distanceMiles: distanceMiles,
                              distanceKm: distanceKm,
                              estimatedTime: estimatedTime,
                              estimateId: Math.floor(100000000 + Math.random() * 900000000),
                              timeFee: store.timeFee,
                              timFeeCalculate: timFeeCalculate,
                              mileagePrice: store.mileagePrice,
                              minimumFare: store.minimumFare,
                              isDelivery: true,
                              minimumOrderSatisfied: false,
                              minimumOrder: parseFloat(store.minimumOrder),
                              freeDeliveryAbove: parseFloat(store.freeDeliveryAbove)
                            });
                            responseArray.push({
                              storeId: item.storeId,
                              storeDeliveryFee: 0,
                              isDelivery: true,
                              minimumOrderSatisfied: false
                            });
                            callback();
                          }
                        }
                      }
                    );

                  } else {
                    // check type
                    if (store.orderType == "3") {
                      callback();
                    } else if (store.orderType == request.payload.type) {
                      callback();
                    } else {
                      count++;
                      responseArray.push(store.sName[request.headers.language]);
                      callback();
                    }
                  }
                } else {
                  logger.warn("seems like store latlongs misssing");
                  // responseArray.push({
                  //     storeId: item.storeId,
                  //     //     storeDeliveryFee: deliveryPrice,
                  //     isDelivery: false
                  // });
                  // estimateArray.push({
                  //     storeId: item.storeId,
                  //     isDelivery: false
                  // })
                  // callback();
                  // return reply({ message: request.i18n.__('fareMsg')['400'], data: responseArray }).code(400);
                  return reply({ message: request.i18n.__("checkOperationZone")["400"] }).code(400);
                }
              })
              .catch(e => {
                logger.error("err during get fare(catch) ", e);
                return reply({ message: request.i18n.__("genericErrMsg")["500"] }).code(500);
              });
          },
          function (err) {
            let serviceTypeErrMsg = "Pickup/Delivery";
            if (request.payload.type == 1) {
              serviceTypeErrMsg = "Delivery"
            }
            if (request.payload.type == 2) {
              serviceTypeErrMsg = "Pickup"
            }
            if (count > 0) {
              return reply({ message: request.i18n.__(request.i18n.__('fare')["400"], serviceTypeErrMsg), data: responseArray }).code(400);
            } else {
              if (request.payload.status == 1) {
                estimationFare.save(
                  {
                    userId: request.auth.credentials._id,
                    createdBy: request.auth.credentials.sub,
                    actions: [
                      {
                        userId: request.auth.credentials._id,
                        createdBy: request.auth.credentials.sub,
                        createdISO: new Date(),
                        timestamp: new Date().getTime()
                      }
                    ],
                    storeWiseFare: estimateArray
                  },
                  (err, data) => { }
                );
                cart.updateEstimates(
                  { _id: new ObjectID(cartId), createdBy: request.auth.credentials.sub, estimates: estimateArray },
                  (err, data) => {
                    if (err) {
                      return reply({ message: request.i18n.__("genericErrMsg")["500"] }).code(500);
                    }
                    return reply({ message: request.i18n.__("fare")["200"], data: responseArray }).code(200);
                  }
                );
              } else {
                return reply({ message: request.i18n.__("fare")["200"], data: responseArray }).code(200);
              }
            }
          }
        );
      })
      .catch(e => {
        logger.error("err during 1st promis " + JSON.stringify(e));
        logger.error(e);
        switch (e.code) {
          case 400:
            return reply({ message: request.i18n.__("checkOperationZone")["400"] }).code(400);
            break;
          case 404:
            return reply({ message: request.i18n.__("cart")["404"] }).code(404);
            break;
          default:
            return reply({ message: request.i18n.__("genericErrMsg")["500"] }).code(500);
        }
      });
  }
}

const readStore = (itemId, zoneId) => {
  return new Promise((resolve, reject) => {
    let zoneCond = {};
    if (zoneId) {
      zoneCond = {
        _id: new ObjectID(itemId),
        serviceZones: { $in: zoneId }
      };
    } else {
      zoneCond = { _id: new ObjectID(itemId) };
    }
    stores.isExistsWithId(zoneCond, (err, store) => {
      if (err) {
        reject(err);
      }
      resolve(store);
    });
  });
};
const readProduct = (itemId, unitId, quantity, storeType) => {
  return new Promise((resolve, reject) => {
    // if (storeType == 2) {
    //   childProducts.checkAvailableStock(
    //     { _id: new ObjectID(itemId), unitId: unitId, quantity: quantity },
    //     (err, data) => {
    //       if (err) {
    //         reject(err);
    //       }
    //       resolve(data);
    //     }
    //   );
    // } else {
    childProducts.checkStock({ _id: new ObjectID(itemId), unitId: unitId, quantity: quantity }, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
    // }
    // childProducts.checkStock({
    //     _id: new ObjectID(itemId),
    //     unitId: unitId
    // }, (err, data) => {
    //     if (err) {
    //         reject(err);
    //     }
    //     resolve(data);
    // });
  });
};
/**
 * A module that exports customer send otp handler, send otp validator!
 * @exports validator
 * @exports handler
 */
module.exports = { handler };
