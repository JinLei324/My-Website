"use strict";
const stores = require("../../../../models/stores");
const storeCategory = require("../../../../models/storeCategory");
const customer = require("../../../../models/customer");
const offers = require("../../../../models/offers");
const zones = require("../../../../models/zones");
const error = require("../../../../statusMessages/responseMessage"); // response messages based on language
const config = process.env;
const googleDistance = require("../../../commonModels/googleApi");
const workingHour = require("../../../commonModels/workingHour");
const Joi = require("joi");
const logger = require("winston");
const async = require("async");
const ObjectId = require("mongodb").ObjectID;
const moment = require("moment");

/**
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const paramsValidator = {
  type: Joi.number()
    .required()
    .description("Store type. Ex : 1 (For restaurant"),
  lat: Joi.number()
    .required()
    .description("Latitude Ex: 13.0286"),
  long: Joi.number()
    .required()
    .description("Longitude Ex: 77.5895"),
  offset: Joi.number()
    .required()
    .description("Required field. Offset to start index . Ex : 0"),
  limit: Joi.number()
    .required()
    .description("Required field. Limit to end index. Ex : 20")
};

/**
 * @function
 * @name storeCategoryHandlerById
 * @return {object} Reply to the user.
 * @param {data} 0 - name, 1 - email, 2 - mobile
 */
const APIHandler = (request, reply) => {
  var storeData = [];
  zones.inZoneAll({ lat: request.params.lat, long: request.params.long }, (err, zoneData) => {
    if (err) {
      return reply({
        message: request.i18n.__("genericErrMsg")["500"]
      }).code(500);
    }
    var storeParams = {
      type: request.params.type,
      long: request.params.long,
      lat: request.params.lat,
      zoneId: zoneData[0]._id,
      offset: request.params.offset * request.params.limit,
      limit: request.params.limit
    };
    stores.getAllByLocation(storeParams, (err, result) => {
      if (err) {
        logger.error("Error occurred during get categories (getStoreCategoriesById): " + JSON.stringify(err));
        return reply({
          message: request.i18n.__("genericErrMsg")["500"]
        }).code(500);
      }

      if (result.length > 0) {
        async.eachSeries(
          result,
          (item, callback) => {
            offers.getStoreOffersByStoreId(
              {
                storeId: item._id.toString()
              },
              (error, response) => {
                item.distanceMiles = 0;
                item.distanceKm = 0;
                item.estimatedTime = 0;
                let dest = item.coordinates.latitude + "," + item.coordinates.longitude;
                let origin = request.params.lat + "," + request.params.long;

                // resolve(true);

                googleDistance
                  .calculateDistance(origin, dest)
                  .then(distanceMeasured => {
                    let result = distanceMeasured.distance;
                    result *= 0.000621371192;
                    distanceMeasured.distanceMiles = result;
                    item.distanceMiles = result;
                    item.distanceKm = distanceMeasured.distance / 1000;
                    item.estimatedTime = distanceMeasured.durationMins;
                    delete item.coordinates;

                    //  item.distance *= 0.000621371192

                    storeData.push({
                      storeName: item.sName ? item.sName[request.headers.language] : "",
                      storeDescription: item.storedescription ? item.storedescription[request.headers.language] : "",
                      bannerImage: item.bannerLogos ? item.bannerLogos.bannerimage : "",
                      logoImage: item.profileLogos ? item.profileLogos.logoImage : "",
                      type: item.type ? item.type : 1,
                      typeMsg: item.typeMsg ? item.typeMsg : "",
                      storeId: item._id ? item._id.toString() : "",
                      franchiseId: item.franchiseId ? item.franchiseId : "",
                      franchiseName: item.franchiseName ? item.franchiseName : "",
                      distance: item.distanceKm,
                      distanceMiles: item.distanceMiles,
                      storeTypeMsg: item.storeTypeMsg,
                      storeType: item.storeType,
                      freeDeliveryAbove: item.freeDeliveryAbove,
                      minimumOrder: item.minimumOrder,
                      storeBillingAddr: item.storeBillingAddr,
                      storeAddr: item.storeAddr,
                      addressCompo: item.addressCompo ? item.addressCompo : {},
                      foodType: item.foodType ? item.foodType : 0,
                      foodTypeName: item.foodTypeName ? item.foodTypeName : "",
                      costForTwo: item.costForTwo ? item.costForTwo : 0,
                      averageRating: item.averageRating ? item.averageRating : 0
                    });

                    callback(null);
                  })
                  .catch(err => {
                    storeData.push({
                      storeName: item.sName ? item.sName[request.headers.language] : "",
                      storeDescription: item.storedescription ? item.storedescription[request.headers.language] : "",
                      bannerImage: item.bannerLogos ? item.bannerLogos.bannerimage : "",
                      logoImage: item.profileLogos ? item.profileLogos.logoImage : "",
                      type: item.type ? item.type : 1,
                      typeMsg: item.typeMsg ? item.typeMsg : "",
                      storeId: item._id ? item._id.toString() : "",
                      franchiseId: item.franchiseId ? item.franchiseId : "",
                      franchiseName: item.franchiseName ? item.franchiseName : "",
                      distance: item.distance,
                      distanceMiles: item.distanceMiles,
                      storeTypeMsg: item.storeTypeMsg,
                      storeType: item.storeType,
                      freeDeliveryAbove: item.freeDeliveryAbove,
                      minimumOrder: item.minimumOrder,
                      storeBillingAddr: item.storeBillingAddr,
                      storeAddr: item.storeAddr,
                      addressCompo: item.addressCompo ? item.addressCompo : {},

                      foodType: item.foodType ? item.foodType : 0,
                      foodTypeName: item.foodTypeName ? item.foodTypeName : "",
                      costForTwo: item.costForTwo ? item.costForTwo : 0,
                      averageRating: item.averageRating ? item.averageRating : 0
                    });
                    logger.error(
                      "Error occurred during view all stores get (calculateDistance): " + JSON.stringify(err)
                    );
                    // return reply({ message: error['stores']['200'][request.headers.language], data: data }).code(200);
                    callback(null);
                  });
              }
            );
            // stores.getStoreOffersByStoreId()
          },
          function(error2) {
            if (error2) {
            }
            return reply({
              message: request.i18n.__("stores")["200"],
              data: storeData
            }).code(200);
          }
        );
      } else {
        return reply({
          message: request.i18n.__("stores")["404"]
        }).code(404);
      }
    });
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
}; //swagger response code

module.exports = {
  paramsValidator,
  APIHandler,
  responseCode
};
