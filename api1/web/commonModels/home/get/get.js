"use strict";
const zones = require("../../../../models/zones");
const childProducts = require("../../../../models/childProducts");
const firstCategory = require("../../../../models/firstCategory");
const secondCategory = require("../../../../models/secondCategory");
const PythonOffersTest = require("../../../../models/PythonOffersTest");
const stores = require("../../../../models/stores");
const ObjectID = require("mongodb").ObjectID;
const error = require("../../../../statusMessages/responseMessage"); // response messages based on language
const config = process.env;
const googleDistance = require("../../../commonModels/googleApi");
const customer = require("../../../../models/customer");
const Joi = require("joi");
const logger = require("winston");
const async = require("async");
const underscore = require("underscore");
const symptom = require("../../../../models/symptom");
const brands = require("../../../../models/brands");
const dailyLowestPrice = require("../../../../models/dailyLowestPrice");
const workingHour = require("../../../../models/workingHour");
const moment = require("moment"); //date-time
/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 * @param {integer} 1 - preferred store with categories, sub categories; 2 - all stores belonging to that zone
 */

const handler = (request, reply) => {
  request.params.latitude = request.params.latitude ? request.params.latitude : 0;
  request.params.longitude = request.params.longitude ? request.params.longitude : 0;
  request.params.zoneId = request.params.zoneId ? request.params.zoneId : 0;

  let storeData = {};
  let data = {};
  data.lowestPrice = [];
  data.offers = [];
  data.symptoms = [];
  data.brands = [];
  data.favProducts = [];
  data.categories = [];
  data.products = [];
  data.store = {};
  let category = [];
  let subCategories = [];
  let count = 0;

  let getNearbyStores = () => {
    return new Promise((resolve, reject) => {
      data.store = {};
      stores.getNearby(
        {
          lat: request.params.latitude,
          long: request.params.longitude,
          zoneId: request.params.zoneId,
          storeId: request.params.storeId
        },
        (err, store) => {
          if (err) {
            logger.error("Error occurred during get producst home page(getNearby): " + JSON.stringify(err));
            reject({ code: 500 });
          }
          if (store) {
            store.businessName = store.sName
              ? store.sName[request.headers.language]
                ? store.sName[request.headers.language]
                : store.sName["en"]
              : "";
            store.businessAddress = store.storeAddr ? store.storeAddr : "";
            store.description = store.storedescription ? store.storedescription[request.headers.language] : "";
            store.businessImage = store.profileLogos ? store.profileLogos.logoImage : "";
            store.bannerImage = store.bannerLogos ? store.bannerLogos.bannerimage : "";
            store.businessLatitude = store.coordinates.latitude ? store.coordinates.latitude : 0;
            store.businessLongitude = store.coordinates.longitude ? store.coordinates.longitude : 0;
            store.businessId = store._id ? store._id.toString() : "";
            store.businessRating = store.averageRating ? store.averageRating : 0;
            store.storeTypeMsg = store.storeTypeMsg ? store.storeTypeMsg : "";
            store.storeType = store.storeType ? parseInt(store.storeType) : 0;
            store.cartsAllowed = store.cartsAllowed ? parseInt(store.cartsAllowed) : 0;
            store.cartsAllowedMsg = store.cartsAllowedMsg || "";
            store.isFavorite = false;

            store.favorites = store.favorites ? store.favorites : [];
            for (let h = 0; h < store.favorites.length; h++) {
              if (store.favorites[h].userId == request.auth.credentials._id.toString()) {
                store.isFavorite = true;
              }
            }
            delete store.profileLogos;
            delete store.bannerLogos;
            delete store.name;
            delete store.sName;
            storeData.storeId = store._id.toString();
            const getDistance = itemCoords => {
              return new Promise((resolve, reject) => {
                let origin = itemCoords.latitude + "," + itemCoords.longitude;
                let dest = request.params.latitude + "," + request.params.longitude;
                if (err)
                  logger.error(
                    "Error occurred during business products get (calculateDistance): " + JSON.stringify(err)
                  );
                store.distanceMiles = 0;
                store.distanceKm = 0;
                store.estimatedTime = 0;
                if (data) {
                  let result = data.distance;
                  result *= 0.000621371192;
                  store.distanceMiles = result;
                  store.distanceKm = data.distance / 1000;
                  store.distanceKmString = data.distanceKm;
                  store.estimatedTime = data.durationMins;
                }
                resolve(true);
              });
            };
            let workingHours = [];
            /**
             * function : readWorkinghours
             * @param {*} itemId
             * @param {*} workinghours
             */
            const readWorkinghours = (itemId, workinghours) => {
              return new Promise((resolve, reject) => {
                workingHour.readById(
                  { storeId: store.businessId, status: 1, endDateTimestamp: { $gt: moment().unix() } },
                  (err, workHours) => {
                    if (err) {
                      reject(err);
                    }
                    workingHours = workHours;
                    resolve(store);
                  }
                );
              });
            };
            getDistance(store.coordinates)
              .then(readWorkinghours)
              .then(store => {
                store.storeAvailability = false;
                store.startTime = "";
                store.endTime = "";

                store.availableSlots = [];
                if (workingHours.length > 0) {
                  let todayDay = moment().format("dddd"); // eg: Wednesday
                  for (let i = 0; i < workingHours.length; i++) {
                    let mergeStartSlot =
                      moment
                        .unix(moment().unix())
                        .format("YYYY-MM-DD")
                        .toString() +
                      " " +
                      workingHours[i].startTime +
                      ":00";
                    let mergeEndSlot =
                      moment
                        .unix(moment().unix())
                        .format("YYYY-MM-DD")
                        .toString() +
                      " " +
                      workingHours[i].endTime +
                      ":00";
                    let startDateSlot = moment(mergeStartSlot).format();
                    let startSloTimestamp = moment(startDateSlot).format("X");
                    let endDateSlot = moment(mergeEndSlot).format();
                    let endSloTimestamp = moment(endDateSlot).format("X");
                    if (
                      workingHours[i].day.length > 0 &&
                      workingHours[i].day.indexOf(todayDay.substr(0, 3)) >= 0 &&
                      workingHours[i].date[
                      moment
                        .unix(moment().unix())
                        .format("YYYY-MM-DD")
                        .toString()
                      ] &&
                      workingHours[i].date[
                        moment
                          .unix(moment().unix())
                          .format("YYYY-MM-DD")
                          .toString()
                      ].length > 0
                    ) {
                      let key = moment
                        .unix(moment().unix())
                        .format("YYYY-MM-DD")
                        .toString();
                      for (let j = 0; j < workingHours[i].date[key].length; j++) {
                        if (
                          workingHours[i].date[key][j].startDateTimestamp > moment().unix() &&
                          moment().unix() < workingHours[i].date[key][j].endDateTimestamp
                        ) {
                          // to match slotdate
                          store.storeAvailability = true;
                          store.startTime = workingHours[i].date[key][j].startTimeDate;
                          store.endTime = workingHours[i].date[key][j].endTimeDate;
                          store.availableSlots.push(workingHours[i].date[key][j]);
                        }
                      }
                    } else {
                      logger.warn("no slot today taking global one");
                      store.storeAvailability = true;
                      store.startTime = mergeStartSlot;
                      store.endTime = mergeEndSlot;

                      workingHours[i].startTime = mergeStartSlot;
                      workingHours[i].endTime = mergeEndSlot;
                      store.availableSlots.push({
                        startTime: mergeStartSlot,
                        endTime: mergeEndSlot,
                        startDateTimestamp: workingHours[i].startDateTimestamp
                      });
                    }
                  }
                  function sortNumber(a, b) {
                    return a.startDateTimestamp - b.startDateTimestamp;
                  }
                  store.availableSlots.sort(sortNumber);
                }
                data.store = store;
                if (typeof store.firstCategory != "undefined") {
                  for (var j = 0; j < store.firstCategory.length; j++) {
                    let categoryData = {};
                    if (store.firstCategory[j].status == 1) {
                      categoryData.categoryName = store.firstCategory[j].categoryName ? store.firstCategory[j].categoryName[request.headers.language] ? store.firstCategory[j].categoryName[request.headers.language] : store.firstCategory[j].categoryName["en"] : "";
                      categoryData.description = store.firstCategory[j].categoryDesc ? store.firstCategory[j].categoryDesc[request.headers.language] ? store.firstCategory[j].categoryDesc[request.headers.language] : store.firstCategory[j].categoryDesc["en"] : "";
                      categoryData.imageUrl = store.firstCategory[j].imageUrl ? store.firstCategory[j].imageUrl : "";
                      categoryData.categoryId = store.firstCategory[j].id.toString()
                        ? store.firstCategory[j].id.toString()
                        : "";
                      categoryData.seqID = store.firstCategory[j].seqID ? store.firstCategory[j].seqID : "";
                      count = 0;
                      subCategories = [];
                      if (typeof store.secondCategory != "undefined") {
                        for (var i = 0; i < store.secondCategory.length; i++) {
                          if (parseInt(store.secondCategory[i].status) == 1) {
                            if (count >= 49) {
                              break;
                            } else {
                              let subCategoryData = {};

                              if (store.firstCategory[j].id.toString() === store.secondCategory[i].categoryId.toString() && parseInt(store.secondCategory[i].status) == 1) {
                                subCategoryData.subCategoryName = store.secondCategory[i].subCategoryName
                                  ? store.secondCategory[i].subCategoryName[request.headers.language]
                                  : "";
                                subCategoryData.description = store.secondCategory[i].subCategoryDesc
                                  ? store.secondCategory[i].subCategoryDesc[request.headers.language]
                                  : "";
                                subCategoryData.imageUrl = store.secondCategory[i].imageUrl
                                  ? store.secondCategory[i].imageUrl
                                  : "";
                                subCategoryData.subCategoryId = store.secondCategory[i].id.toString()
                                  ? store.secondCategory[i].id.toString()
                                  : "";
                                count++;
                                subCategories.push(subCategoryData);
                              }
                            }
                          }

                        }
                        if (typeof subCategories != "undefined" && subCategories.length > 0) {
                          subCategories = subCategories.sort(function (a, b) {
                            return a.seqId - b.seqId;
                          });
                        }
                        categoryData.subCategories = subCategories;
                      }
                      category.push(categoryData);
                    }
                  }
                }
                let offers = [];
                if (typeof store.offer != "undefined") {
                  for (var k = 0; k < store.offer.length; k++) {
                    if (store.offer[k].status == 1) {
                      store.offer[k].offerName = store.offer[k].offerName
                        ? store.offer[k].offerName[request.headers.language]
                        : "";
                      offers.push(store.offer[k]);
                    }
                  }
                }
                if (store.Symptoms > 0) {
                  for (let ii = 0; ii < store.Symptoms; ii++) {
                    store.Symptoms[ii].name = store.Symptoms[ii].name
                      ? store.Symptoms[ii].name[request.headers.language]
                      : "";
                    store.Symptoms[ii].description = store.Symptoms[ii].description
                      ? store.Symptoms[ii].description[request.headers.language]
                      : "";
                    store.Symptoms[ii].bannerImage = store.Symptoms[ii].bannerImage
                      ? store.Symptoms[ii].bannerImage
                      : "";
                    store.Symptoms[ii].logoImage = store.Symptoms[ii].bannerImage ? store.Symptoms[ii].bannerImage : "";
                  }
                }

                if (typeof category != "undefined" && category.length > 0) {
                  data.categories = category.sort(function (a, b) {
                    return a.seqID - b.seqID;
                  });
                }
                if (typeof store.Symptoms != "undefined" && store.Symptoms.length > 0) {
                  data.symptoms = store.Symptoms.sort(function (a, b) {
                    return a.seqID - b.seqID;
                  });
                }

                data.subCategories = store.secondCategory;
                data.offers = offers;

                resolve(data.store);
              })
              .catch(e => {
                logger.error("err during get home  getDistance(catch) " + e);
                data.store = store ? store : {};
                if (typeof category != "undefined" && category.length > 0) {
                  data.categories = category.sort(function (a, b) {
                    return a.seqID - b.seqID;
                  });
                }
                if (typeof store.Symptoms != "undefined" && store.Symptoms.length > 0) {
                  data.symptoms = store.Symptoms.sort(function (a, b) {
                    return a.seqID - b.seqID;
                  });
                }

                let offers = [];
                if (typeof store.offer != "undefined") {
                  for (var k = 0; k < store.offer.length; k++) {
                    if (store.offer[k].status == 1) {
                      store.offer[k].offerName = store.offer[k].offerName
                        ? store.offer[k].offerName[request.headers.language]
                        : "";
                      offers.push(store.offer[k]);
                    }
                  }
                }

                data.subCategories = store.secondCategory ? store.secondCategory : [];
                data.offers = offers;
                resolve(data.store);
              });
          } else {
            if (typeof category != "undefined" && category.length > 0) {
              data.categories = category.sort(function (a, b) {
                return a.seqID - b.seqID;
              });
            }
            if (typeof store.Symptoms != "undefined" && store.Symptoms.length > 0) {
              if (typeof store.Symptoms != "undefined") {
                data.symptoms = store.Symptoms.sort(function (a, b) {
                  return a.seqID - b.seqID;
                });
              }
            }
            data.offers = store.offer;
            data.store = store ? store : {};
            storeData.storeId = request.params.storeId;

            resolve(data.store);
          }
        }
      );
    });
  };

  let getlowestPrice = () => {
    return new Promise((resolve, reject) => {
      data.lowestPrice = [];
      dailyLowestPrice.getByStoreId(
        {
          storeId: storeData.storeId != 0 ? storeData.storeId : storeData.storeId,
          "availableQuantity": { "$gt": 0 },
          "status": 1
        },
        (err, childProduct) => {
          if (err) {
            logger.error("Error occurred during get producst home page(getHighestOffers): " + JSON.stringify(err));
            reject({ code: 500 });
          }
          for (var j = 0; j < childProduct.length; j++) {
            // childProduct[j].unitName = childProduct[j].newUnits[0]["name"][request.headers.language];
            // childProduct[j].priceValue = (childProduct[j].newUnits.length > 0) ? parseFloat(childProduct[j].newUnits[0]["price"]["en"]) : parseFloat(childProduct[j].newUnits[0]["price"]["en"]);

            childProduct[j].outOfStock = true;
            /**removing out of stock items */

            if (childProduct[j].availableQuantity > 0) {
              childProduct[j].outOfStock = false;
              // finalProducts.push(childProduct[j]); // seful to remove outofstock items
            }
            childProduct[j].productName = childProduct[j].productname
              ? childProduct[j].productname[request.headers.language]
              : "";
            childProduct[j].storeName = childProduct[j].storeName
              ? childProduct[j].storeName[request.headers.language]
              : "";
            childProduct[j].storeAddr = childProduct[j].storeAddr ? childProduct[j].storeAddr : "";
            childProduct[j].storeLogo = childProduct[j].storeLogo ? childProduct[j].storeLogo : "";
            childProduct[j].bannerImage = childProduct[j].bannerLogos ? childProduct[j].bannerLogos.bannerimage : "";
            childProduct[j].mobileImage = childProduct[j].mobileImage ? childProduct[j].mobileImage : [];
            childProduct[j].currency = childProduct[j].currency ? childProduct[j].currency : "";
            childProduct[j].currencySymbol = childProduct[j].currencySymbol ? childProduct[j].currencySymbol : "";
            childProduct[j].THC = childProduct[j].THC ? childProduct[j].THC : "";
            childProduct[j].personalUsageFile = childProduct[j].personalUsageFile
              ? childProduct[j].personalUsageFile
              : "";
            childProduct[j].professionalUsageFile = childProduct[j].professionalUsageFile
              ? childProduct[j].professionalUsageFile
              : "";
            childProduct[j].prescriptionRequired = childProduct[j].prescriptionRequired
              ? childProduct[j].prescriptionRequired
              : false;
            childProduct[j].rx = childProduct[j].rx ? childProduct[j].rx : false;
            childProduct[j].soldOnline = childProduct[j].soldOnline ? childProduct[j].soldOnline : false;
            childProduct[j].sku = childProduct[j].sku ? childProduct[j].sku : "";
            childProduct[j].CBD = childProduct[j].CBD ? childProduct[j].CBD : "";
            childProduct[j].storeLatitude = childProduct[j].storeLatitude ? childProduct[j].storeLatitude : 0;
            childProduct[j].storeLongitude = childProduct[j].storeLongitude ? childProduct[j].storeLongitude : 0;
            childProduct[j].childProductId = childProduct[j].childProductId ? childProduct[j].childProductId : "";
            childProduct[j].parentProductId = childProduct[j].parentProductId ? childProduct[j].parentProductId : "";
            childProduct[j].unitId = childProduct[j].unitId;
            childProduct[j].unitName = childProduct[j].unitName;
            childProduct[j].priceValue = childProduct[j].priceValue;
            // childProduct[j].unitId = childProduct[j].newUnits.length > 0 ? childProduct[j].newUnits[0]["unitId"] : childProduct[j].units[0]["unitId"];
            // childProduct[j].unitName = childProduct[j].newUnits.length > 0 ? childProduct[j].newUnits[0]["name"][request.headers.language] : childProduct[j].units[0]["name"][request.headers.language];
            // childProduct[j].priceValue = childProduct[j].newUnits.length > 0 ? parseFloat(childProduct[j].newUnits[0]["price"]["en"]) : parseFloat(childProduct[j].units[0]["price"]["en"]);
            childProduct[j].appliedDiscount = 0;
            childProduct[j].finalPrice = childProduct[j].finalPrice > 0 ? childProduct[j].finalPrice : 0;
            childProduct[j].offerId = childProduct[j].offerId;
          }
          data.lowestPrice = childProduct;
          resolve(data.lowestPrice);
        }
      );
    });
  };

  let getProductsData = () => {
    return new Promise((resolve, reject) => {
      data.products = [];
      let condit = [];
      condit = [
        { $match: { "storeId": storeData.storeId != 0 ? new ObjectID(storeData.storeId) : storeData.storeId } },
        { $unwind: "$products" },
        {
          $match: {
            "products.storeId":
              storeData.storeId != 0 ? new ObjectID(storeData.storeId) : storeData.storeId
          }
        },
        {
          $lookup: {
            from: "childProducts",
            localField: "products.childProductId",
            foreignField: "_id",
            as: "childProduct"
          }
        },
        { $unwind: "$childProduct" },
        { $match: { "childProduct.status": { $in: [1, 6] } } },
        {
          $lookup: {
            from: "stores",
            localField: "products.storeId",
            foreignField: "_id",
            as: "store"
          }
        },
        { $unwind: "$store" },
        {
          $project: {
            productName: "$childProduct.productname",
            childProductId: "$childProduct._id",
            storeId: "$childProduct.storeId",
            THC: "$childProduct.THC",
            professionalUsageFile: "$childProduct.professionalUsageFile",
            personalUsageFile: "$childProduct.personalUsageFile",
            sku: "$childProduct.sku",
            currency: "$childProduct.currency",
            currencySymbol: "$childProduct.currencySymbol",
            CBD: "$childProduct.CBD",
            parentProductId: "$childProduct.parentProductId",
            units: "$childProduct.units",
            images: "$childProduct.images",
            bannerImage: "$store.bannerLogos",
            logoImage: "$store.profileLogos",
            bannerLogos: "$store.bannerLogos",
            profileLogos: "$store.profileLogos",
            storeName: "$store.sName",
            storeAddress: "$store.storeAddr",
            storeLatitude: "$store.coordinates.latitude",
            storeLongitude: "$store.coordinates.longitude",
            offer: "$childProduct.offer"
          }
        },
        {
          $limit: 10
        }
      ];
      stores.getRecentlyAdded(condit, (err, childProduct) => {
        if (err) {
          logger.error("Error occurred during get producst home page(getRecentlyAdded): " + JSON.stringify(err));
          reject({ code: 500 });
        }

        for (var j = 0; j < childProduct.length; j++) {
          childProduct[j].outOfStock = true;

          var ProductUnitAvailableQuantity;
          var productUnitPrice;
          var productUnitName;
          var productUnitID;
          if (childProduct[j].units.length > 0) {

            childProduct[j].units.sort(function (a, b) {
              return a.floatValue - b.floatValue
            });

            for (var m = 0; m < childProduct[j].units.length; m++) {
              if (childProduct[j].units[m].availableQuantity > 0) {
                ProductUnitAvailableQuantity = childProduct[j].units ? childProduct[j].units[m]["availableQuantity"] : "";
                productUnitPrice = childProduct[j].units[m].floatValue;
                productUnitID = childProduct[j].units[m].unitId;
                productUnitName = childProduct[j].units ? childProduct[j].units[m]["name"][request.headers.language] : "";
                break;
              } else {
                ProductUnitAvailableQuantity = 0;
                productUnitID = childProduct[j].units[m].unitId;
                productUnitPrice = childProduct[j].units[m].floatValue;
                productUnitName = childProduct[j].units ? childProduct[j].units[m]["name"][request.headers.language] : "";
              }
            }
          }

          childProduct[j].unitId = productUnitID;
          childProduct[j].availableQuantity = ProductUnitAvailableQuantity;
          childProduct[j].unitName = productUnitName;
          childProduct[j].priceValue = productUnitPrice;

          childProduct[j].productName = childProduct[j].productName
            ? childProduct[j].productName[request.headers.language]
            : "";
          childProduct[j].storeName = childProduct[j].storeName
            ? childProduct[j].storeName[request.headers.language]
            : "";

          childProduct[j].storeAddress = childProduct[j].storeAddress ? childProduct[j].storeAddress : "";
          childProduct[j].storeLogo = childProduct[j].profileLogos ? childProduct[j].profileLogos.logoImage : "";
          childProduct[j].bannerImage = childProduct[j].bannerLogos ? childProduct[j].bannerLogos.bannerimage : "";
          childProduct[j].currency = childProduct[j].currency ? childProduct[j].currency : "";
          childProduct[j].currencySymbol = childProduct[j].currencySymbol ? childProduct[j].currencySymbol : "";
          childProduct[j].mobileImage = childProduct[j].images ? childProduct[j].images : [];



          childProduct[j].THC = childProduct[j].THC ? childProduct[j].THC : "";
          childProduct[j].personalUsageFile = childProduct[j].personalUsageFile
            ? childProduct[j].personalUsageFile
            : "";
          childProduct[j].professionalUsageFile = childProduct[j].professionalUsageFile
            ? childProduct[j].professionalUsageFile
            : "";
          childProduct[j].sku = childProduct[j].sku ? childProduct[j].sku : "";
          childProduct[j].CBD = childProduct[j].CBD ? childProduct[j].CBD : "";
          childProduct[j].childProductId = childProduct[j].childProductId ? childProduct[j].childProductId : "";
          childProduct[j].parentProductId = childProduct[j].parentProductId ? childProduct[j].parentProductId : "";
          childProduct[j].appliedDiscount = 0;
          childProduct[j].finalPrice = parseFloat(childProduct[j].priceValue);
          childProduct[j].offerId = "";
          if (childProduct[j].offer && childProduct[j].offer.length > 0) {
            // offers
            for (let k = 0; k < childProduct[j].offer.length; k++) {
              if (
                childProduct[j].offer[k].status == 1 &&
                childProduct[j].offer[k].endDateTime > moment().unix() &&
                childProduct[j].offer[k].startDateTime < moment().unix()
              ) {
                //check status and expiry
                if (childProduct[j].offer[k].discountType == 1) {
                  //check offertype if percentage
                  // if (childProduct[j].offer[k].applicableOn == 0) { // if childProduct
                  childProduct[j].appliedDiscount =
                    (childProduct[j].priceValue / 100) * parseFloat(childProduct[j].offer[k].discountValue);
                  childProduct[j].offerId = childProduct[j].offer[k].offerId ? childProduct[j].offer[k].offerId : "";
                  childProduct[j].finalPrice =
                    childProduct[j].appliedDiscount > childProduct[j].priceValue
                      ? 0
                      : childProduct[j].priceValue - childProduct[j].appliedDiscount;
                  // }
                }

                if (childProduct[j].offer[k].discountType == 0) {
                  //check offertype if flat discount
                  // if (childProduct[j].offer[k].applicableOn == 0) { // if childProduct
                  childProduct[j].appliedDiscount = parseFloat(childProduct[j].offer[k].discountValue);
                  childProduct[j].offerId = childProduct[j].offer[k].offerId ? childProduct[j].offer[k].offerId : "";
                  childProduct[j].finalPrice =
                    childProduct[j].appliedDiscount > childProduct[j].priceValue
                      ? 0
                      : childProduct[j].priceValue - childProduct[j].appliedDiscount;
                  // }
                }
              }
            }
          }
          delete childProduct[j]._id;
          delete childProduct[j].images;
          // delete childProduct[j].units;
          delete childProduct[j].profileLogos;
          delete childProduct[j].logoImage;
          delete childProduct[j].bannerLogos;
          delete childProduct[j].offer;

          delete childProduct[j].units;
        }
        data.products = childProduct;
        resolve(data.products);
      });
    });
  };

  let getFevoriteData = () => {
    return new Promise((resolve, reject) => {
      data.favProducts = [];
      childProducts.getFavoriteHome(
        {
          type: 0,
          limit: 10,
          storeId: storeData.storeId != 0 ? new ObjectID(storeData.storeId) : storeData.storeId,
          userId: request.auth.credentials._id.toString()
        },
        (err, childProduct) => {
          if (err) {
            logger.error("Error occurred while getting getFavoriteHome homepage : " + err);
            data.favProducts = [];
            reject({ code: 500 });
          } else if (childProduct.length > 0) {
            for (var j = 0; j < childProduct.length; j++) {
              childProduct[j].outOfStock = true;
              /**removing out of stock items */
              let unitsToPush = [];
              for (var k = 0; k < childProduct[j].units.length; k++) {
                if (childProduct[j].units[k].availableQuantity > 0) {
                  unitsToPush.push(childProduct[j].units[k]);
                }
              }
              childProduct[j].newUnits = unitsToPush;
              if (unitsToPush.length > 0) {
                childProduct[j].outOfStock = false;
                // finalProducts.push(childProduct[j]); // seful to remove outofstock items
              }
              childProduct[j].productName = childProduct[j].productname
                ? childProduct[j].productname[request.headers.language]
                : "";
              childProduct[j].storeName = childProduct[j].storeName
                ? childProduct[j].storeName[request.headers.language]
                : "";
              childProduct[j].storeAddress = childProduct[j].storeAddress ? childProduct[j].storeAddress : "";
              childProduct[j].storeLogo = childProduct[j].profileLogos ? childProduct[j].profileLogos.logoImage : "";
              childProduct[j].bannerImage = childProduct[j].bannerLogos ? childProduct[j].bannerLogos.bannerimage : "";
              childProduct[j].mobileImage = childProduct[j].images ? childProduct[j].images : [];
              childProduct[j].THC = childProduct[j].THC ? childProduct[j].THC : "";
              childProduct[j].personalUsageFile = childProduct[j].personalUsageFile
                ? childProduct[j].personalUsageFile
                : "";
              childProduct[j].professionalUsageFile = childProduct[j].professionalUsageFile
                ? childProduct[j].professionalUsageFile
                : "";
              childProduct[j].sku = childProduct[j].sku ? childProduct[j].sku : "";
              childProduct[j].CBD = childProduct[j].CBD ? childProduct[j].CBD : "";
              childProduct[j].storeLatitude = childProduct[j].storeCoordinates.latitude
                ? childProduct[j].storeCoordinates.latitude
                : 0;
              childProduct[j].storeLongitude = childProduct[j].storeCoordinates.longitude
                ? childProduct[j].storeCoordinates.longitude
                : 0;
              childProduct[j].childProductId = childProduct[j]._id ? childProduct[j]._id : "";
              childProduct[j].parentProductId = childProduct[j].parentProductId ? childProduct[j].parentProductId : "";
              childProduct[j].currency = childProduct[j].currency ? childProduct[j].currency : "";
              childProduct[j].currencySymbol = childProduct[j].currencySymbol ? childProduct[j].currencySymbol : "";
              childProduct[j].unitId =
                childProduct[j].newUnits.length > 0
                  ? childProduct[j].newUnits[0]["unitId"]
                  : childProduct[j].units[0]["unitId"];
              childProduct[j].unitName =
                childProduct[j].newUnits.length > 0
                  ? childProduct[j].newUnits[0]["name"][request.headers.language]
                  : childProduct[j].units[0]["name"][request.headers.language];
              childProduct[j].priceValue =
                childProduct[j].newUnits.length > 0
                  ? parseFloat(childProduct[j].newUnits[0]["price"]["en"])
                  : parseFloat(childProduct[j].units[0]["price"]["en"]);
              childProduct[j].appliedDiscount = 0;
              childProduct[j].finalPrice = parseFloat(childProduct[j].priceValue);
              if (childProduct[j].offer && childProduct[j].offer.length > 0) {
                // offers
                logger.error(moment().unix());
                for (let k = 0; k < childProduct[j].offer.length; k++) {
                  if (
                    childProduct[j].offer[k].status == 1 &&
                    childProduct[j].offer[k].endDateTime > moment().unix() &&
                    childProduct[j].offer[k].startDateTime < moment().unix()
                  ) {
                    //check status and expiry
                    if (childProduct[j].offer[k].discountType == 1) {
                      //check offertype if percentage
                      // if (childProduct[j].offer[k].applicableOn == 0) { // if childProduct
                      childProduct[j].appliedDiscount =
                        (childProduct[j].priceValue / 100) * parseFloat(childProduct[j].offer[k].discountValue);
                      childProduct[j].offerId = childProduct[j].offer[k].offerId
                        ? childProduct[j].offer[k].offerId
                        : "";
                      childProduct[j].finalPrice =
                        childProduct[j].appliedDiscount > childProduct[j].priceValue
                          ? 0
                          : childProduct[j].priceValue - childProduct[j].appliedDiscount;
                      // }
                    }

                    if (childProduct[j].offer[k].discountType == 0) {
                      //check offertype if flat discount
                      // if (childProduct[j].offer[k].applicableOn == 0) { // if childProduct
                      childProduct[j].appliedDiscount = parseFloat(childProduct[j].offer[k].discountValue);
                      childProduct[j].offerId = childProduct[j].offer[k].offerId
                        ? childProduct[j].offer[k].offerId
                        : "";
                      childProduct[j].finalPrice =
                        childProduct[j].appliedDiscount > childProduct[j].priceValue
                          ? 0
                          : childProduct[j].priceValue - childProduct[j].appliedDiscount;
                      // }
                    }
                  }
                }
              }
              childProduct[j].units = childProduct[j].units ? childProduct[j].units : [];
              delete childProduct[j].profileLogos;
              delete childProduct[j].images;
              // delete childProduct[j].units;
              delete childProduct[j]._id;
              delete childProduct[j].offer;
              delete childProduct[j].storeCoordinates;

              delete childProduct[j].units;
            }
            data.favProducts = childProduct;
            resolve(data.favProducts);
          } else {
            data.favProducts = [];
            resolve(data.favProducts);
          }
        }
      );
    });
  };

  let getBrands = () => {
    return new Promise((resolve, reject) => {
      data.brands = [];
      let condition = {
        status: 1
      };
      if (storeData.storeId != 0) {
        condition["storeid"] = storeData.storeId;
        condition['status'] = 1;
      }
      brands.get(condition, (err, doc) => {
        if (err) {
          logger.error("Error occurred during get brands home page: " + JSON.stringify(err));
          reject({ code: 500 });
        }
        if (doc.length > 0) {
          for (let i = 0; i < doc.length; i++) {
            console.log("Brand id ---", doc[i]._id.toString())
            doc[i].brandName = doc[i].name ? doc[i].name[request.headers.language] : "";
            doc[i].description = doc[i].description ? doc[i].description[request.headers.language] : "";
            doc[i].bannerImage = doc[i].bannerImage ? doc[i].bannerImage : "";
            doc[i].logoImage = doc[i].bannerImage ? doc[i].bannerImage : "";
            delete doc[i].name;
          }

          data.brands = doc;
        }
        resolve(data.brands);
      });
    });
  };

  let getSymptoms = () => {
    return new Promise((resolve, reject) => {
      data.symptoms = [];
      symptom.get({}, (err, doc) => {
        if (err) {
          logger.error("Error occurred during get symptoms home page: " + JSON.stringify(err));
          reject({ code: 500 });
        }
        if (doc.length > 0) {
          for (let i = 0; i < doc.length; i++) {
            doc[i].name = doc[i].name ? doc[i].name[request.headers.language] : "";
            doc[i].description = doc[i].description ? doc[i].description[request.headers.language] : "";
            doc[i].bannerImage = doc[i].bannerImage ? doc[i].bannerImage : "";
            doc[i].logoImage = doc[i].bannerImage ? doc[i].bannerImage : "";
          }
          data.symptoms = doc;
        }
        resolve(data.symptoms);
      });
    });
  };
  getNearbyStores().then(store => {
    Promise.all([getFevoriteData(), getlowestPrice(), getProductsData(), getBrands()]).then(function (values) {
      if (values) {
        return reply({ message: request.i18n.__("stores")["200"], data: data }).code(200);
      } else {
        return reply({ message: request.i18n.__("genericErrMsg")["500"] }).code(500);
      }
    });
  });
};

module.exports = {
  handler
};
