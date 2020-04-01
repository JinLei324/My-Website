"use strict";

const Joi = require("joi");
const logger = require("winston");
const moment = require("moment");
const async = require("async");
const zones = require("../../../../models/zones");
const storeElastic = require("../../../../models/storeElastic");
var jsonfile = require("jsonfile");
var turf = require("turf");
const _ = require("underscore-node");
const cartModel = require("../../../../models/cart");
const storeCategory = require("../../../../models/storeCategory");
const turfLibrary = require("../../driver/redisEvent/postRedisEvent");
/** @namespace */
const error = require("../../../../statusMessages/responseMessage");

var file = "cityZone.json";

const validator = {
  storeType: Joi.number().description("storeaType 0 for all categories"),
  latitude: Joi.any()
    .required()
    .description("Mandatory Field. latitude. Ex. 13.046644 "),
  longitude: Joi.any()
    .required()
    .description("Mandatory Field. longitude. Ex. 77.553567")
};

var jsonObj = [];
// let cityZone = [];
// jsonfile.readFile(file, function (err, obj) {
//     if (err)
//         logger.error(err);

//     if (typeof obj != 'undefined') {
//         cityZone = obj;
//     }
// });

const APIHandler = (req, reply) => {
  if (typeof req.params.storeType == "undefined") {
    req.params.storeType = 0;
  }
  let timeStamp = moment().unix();

  let dataObj = {};
  let zoneData = {};
  let categoryData = [];
  let storeData = [];

  var storeResponce = [];
  const readFile = () => {
    return new Promise((resolve, reject) => {
      zones.inZone({ lat: req.params.latitude, long: req.params.longitude }, (err, data) => {
        if (data) {
          zoneData = data;
          resolve(true);
        } else {
          return reply({ message: req.i18n.__("checkOperationZone")["400"] }).code(400);
        }
      });
    });
  };
  const readCategory = () => {
    return new Promise((resolve, reject) => {
      // req.headers.language = 'en';
      let condition = {
        visibility: 1,
        availableInCities: { $in: [zoneData.city_ID] }
      };
      if (req.params.storeType != 0) {
        condition["type"] = req.params.storeType;
      }
      storeCategory.getStoreCategories(condition, (err, result) => {
        if (err) {
          logger.error("Error occurred during get categories (getStoreCategoriesById): " + JSON.stringify(err));
          reject({ code: 500 });
        }

        if (result.length > 0) {
          for (var j = 0; j < result.length; j++) {
            result[j].categoryName = result[j].storeCategoryName
              ? result[j].storeCategoryName[req.headers.language]
              : "";
            result[j].description = result[j].storeCategoryDescription
              ? result[j].storeCategoryDescription[req.headers.language]
              : "";
            result[j].bannerImage = result[j].bannerImage ? result[j].bannerImage : "";
            result[j].logoImage = result[j].logoImage ? result[j].logoImage : "";
            result[j].type = result[j].type ? result[j].type : 1;
            result[j].typeMsg = result[j].typeMsg ? result[j].typeMsg : "";
            result[j].catTypeGif = result[j].catTypeGif ? result[j].catTypeGif : "";
            result[j].colorCode = result[j].colorCode ? result[j].colorCode : "";

            // delete result[j]._id;
            delete result[j].storeCategoryName;
            delete result[j].storeCategoryDescription;
            delete result[j].name;
          }

          // return reply({
          //     message: req.i18n.__('stores')['200'],
          //     data: result
          // }).code(200);
          categoryData = result;
          resolve(true);
        } else {
          // return reply({
          //     message: req.i18n.__('stores')['404']
          // }).code(404);
          // reject({ code: 404 });
          resolve(true);
        }
      });
    });
  };
  const readStore = () => {
    return new Promise((resolve, reject) => {
      if (req.params.storeType != 0) {
        var storeParams = {
          type: req.params.storeType,
          long: parseFloat(req.params.longitude),
          lat: parseFloat(req.params.latitude),
          // categoryId: req.params.categoryId,
          zoneId: zoneData._id,
          offset: 0,
          limit: 10
        };
        storeElastic.getAllByZoneId(storeParams, (err, result) => {
          if (err) {
            logger.error("Error occurred during get categories (getStoreCategoriesById): " + JSON.stringify(err));
            resolve(true);
          }

          if (result.length > 0) {
            async.each(
              result,
              (item, callback) => {
                let storeOffer = 0;
                let offerId = "";
                let offerTitle = "";
                let offerBanner = {};
                if (typeof item["_source"].offer != "undefined") {
                  for (var k = 0; k < item["_source"].offer.length; k++) {
                    if (parseInt(item["_source"].offer[k].status) == 1) {
                      offerTitle = item["_source"].offer[k].offerName
                        ? item["_source"].offer[k].offerName[req.headers.language]
                        : "";
                      offerBanner = item["_source"].offer[k].images ? item["_source"].offer[k].images["image"] : "";
                      offerId = item["_source"].offer[k].offerId ? item["_source"].offer[k].offerId.toString() : "";
                      storeOffer = 1;
                    }
                  }
                }
                storeData.push({
                  storeName: item["_source"].sName ? item["_source"].sName[req.headers.language] : "",
                  storeDescription: item["_source"].storedescription
                    ? item["_source"].storedescription[req.headers.language]
                    : "",
                  bannerImage: item["_source"].bannerLogos ? item["_source"].bannerLogos.bannerimage : "",
                  logoImage: item["_source"].profileLogos ? item["_source"].profileLogos.logoImage : "",
                  type: item["_source"].type ? item["_source"].type : 1,
                  typeMsg: item["_source"].typeMsg ? item["_source"].typeMsg : "",
                  storeId: item._id ? item._id.toString() : "",
                  storeCategory: item.storeCategory ? item.storeCategory : [],
                  currency: item["_source"].currency,
                  currencySymbol: item["_source"].currencySymbol,
                  franchiseId: item["_source"].franchiseId ? item["_source"].franchiseId : "",
                  franchiseName: item["_source"].franchiseName ? item["_source"].franchiseName : "",
                  distanceMiles: parseFloat(parseFloat(parseFloat(item.sort[1]) * 0.621371).toFixed(2)),
                  distanceKm: parseFloat(parseFloat(item.sort[1]).toFixed(2)),
                  distance: parseFloat(parseFloat(item.sort[1]).toFixed(2)),
                  storeTypeMsg: item["_source"].storeTypeMsg,
                  storeType: item["_source"].storeType,
                  cartsAllowed: item["_source"].cartsAllowed,
                  cartsAllowedMsg: item["_source"].cartsAllowedMsg,
                  freeDeliveryAbove: item["_source"].freeDeliveryAbove,
                  minimumOrder: item["_source"].minimumOrder,
                  storeBillingAddr: item["_source"].storeBillingAddr,
                  storeAddr: item["_source"].storeAddr,
                  streetName: item["_source"].streetName ? item["_source"].streetName : "",
                  localityName: item["_source"].localityName ? item["_source"].localityName : "",
                  areaName: item["_source"].areaName ? item["_source"].areaName : "",
                  addressCompo: item["_source"].addressCompo ? item["_source"].addressCompo : {},
                  storeOffer: storeOffer,
                  offerId: offerId,
                  offerTitle: offerTitle,
                  offerBanner: offerBanner,
                  foodType: item["_source"].foodType ? item["_source"].foodType : 0,
                  foodTypeName: item["_source"].foodTypeName ? item["_source"].foodTypeName : "",
                  costForTwo: item["_source"].costForTwo ? item["_source"].costForTwo : 0,
                  avgDeliveryTime: item["_source"].avgDeliveryTime ? item["_source"].avgDeliveryTime : 0,
                  averageRating: item["_source"].averageRating ? item["_source"].averageRating : 0,
                  storeSubCats: [],
                  nextCloseTime: item["_source"].nextCloseTime || 0,
                  nextOpenTime: item["_source"].nextOpenTime || 0,
                  storeIsOpen: item["_source"].storeIsOpen || false
                });
                callback();
              },
              function (err) {
                if (req.params.storeType == 2) {
                  storeResponce.push(storeData[0]);
                } else {
                  storeResponce = storeData;
                }

                resolve(true);
              }
            );
          } else {
            resolve(true);
          }
        });
      } else {
        storeResponce = storeData;
        resolve(true);
      }
    });
  };

  readFile()
    .then(readCategory)
    .then(readStore)
    .then(data => {
      if (Object.keys(zoneData).length > 0) {
        zoneData["zoneId"] = zoneData._id;
        zoneData["currency"] = zoneData.currency ? zoneData.currency : "USD";
        zoneData["currencySymbol"] = zoneData.currencySymbol ? zoneData.currencySymbol : "$";
        zoneData["city"] = zoneData.city ? zoneData.city : "";
        zoneData["cityId"] = zoneData.city_ID ? zoneData.city_ID : "";
        zoneData["mileageMetric"] = zoneData.mileageMetric ? zoneData.mileageMetric : "0";
        delete zoneData.city_ID;
        return reply({
          message: req.i18n.__("checkOperationZone")["200"],
          data: zoneData,
          categoryData: categoryData,
          storeData: storeResponce
        }).code(200);
        // return reply({ message: req.i18n.__('checkOperationZone')['200'], data: zoneData, categoryData: categoryData }).code(200);
        // cartModel.clearCartZoneChange({
        //     createdBy: req.auth.credentials.sub,
        //     customerName: '', userId: req.auth.credentials._id.toString()
        // }, (err, isCleared) => {
        //     return reply({ message: req.i18n.__('checkOperationZone')['200'], data: zoneData, categoryData: categoryData }).code(200);
        // });
      } else {
        return reply({ message: req.i18n.__("checkOperationZone")["400"] }).code(400);
      }
    })
    .catch(err => {
      logger.error("Error occurred duringget zones (catch): " + JSON.stringify(err));
      return reply({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
    });
};

module.exports = { validator, APIHandler };
