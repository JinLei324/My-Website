"use strict";

const logger = require("winston");
const request = require("superagent");
const appConfig = require("../../models/appConfig");

/**
 * get Google Map Key Array from Database
 */
// let getAppConfig = (googleKeys) => {
//     return new Promise((resolve, reject) => {
//         if (googleKeys && googleKeys.length > 0)
//             return resolve(googleKeys);
//         appConfig.getAppConfigration()
//             .then((appConfig) => {
//                 let googleKeys = [];
//                 if (Object.keys(appConfig).length > 0 && appConfig.custGoogleMapKeys.length > 0) {
//                     googleKeys = appConfig.custGoogleMapKeys;
//                     return resolve(googleKeys);
//                 } else {
//                     return reject({ 'message': 'No config data in DB.' });
//                 }
//             })
//             .catch((err) => {
//                 reject(err);
//             });
//     });
// };

let getAppConfig = googleKeys => {
  return new Promise((resolve, reject) => {
    if (googleKeys && googleKeys.length > 0) return resolve(googleKeys);
    appConfig
      .getAppConfigration()
      .then(appConfig => {
        let googleKeys = [];
        if (Object.keys(appConfig).length > 0 && appConfig.keyRotationArray.length > 0) {
          googleKeys = appConfig.keyRotationArray.map(item => {
            return item.currentKey;
          });
          return resolve(googleKeys);
        } else {
          logger.info("No config data in DB.");
          return reject({ message: "No config data in DB." });
        }
      })
      .catch(err => {
        reject(err);
      });
  });
};
/**
 * call google api call
 * @param {*} url - URL to call
 * @param {*} googleKeys - google map key array
 * @param {*} index - index to use
 * @returns result data
 */
let callapi = (url, googleKeys, index) => {
  return new Promise((resolve, reject) => {
    let urlToCall = url + googleKeys[index];
    request.get(urlToCall).end(function(errGmap, resultGmp) {
      try {
        if (errGmap) throw new Error(errGmap);
        else {
          resultGmp = JSON.parse(resultGmp.text);
          if (resultGmp["status"] == "OK") {
            resolve(resultGmp);
          } else {
            throw new Error(resultGmp["status"]);
          }
        }
      } catch (err) {
        if (index == 0) {
          logger.error(err);
          reject(err);
        } else {
          callapi(url, googleKeys, index - 1)
            .then(resultData => {
              resolve(resultData);
            })
            .catch(err => {
              logger.error(err);
              reject(err);
            });
        }
      }
    });
  });
};

/**
 * to fetch address from google
 * @param {*} lat - Latitude
 * @param {*} lng - longitude
 * @returns addressData
 */
let fetchAddress = (lat, lng, googleKeys) => {
  return new Promise((resolve, reject) => {
    getAppConfig(googleKeys)
      .then(googleKeys => {
        return new Promise((resolve, reject) => {
          var url =
            "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + lng + "&sensor=false&key=";
          callapi(url, googleKeys, googleKeys.length - 1)
            .then(place => {
              place = place["results"][0];
              let addressData = {
                placeId: place.place_id,
                placeName: place.name || "",
                address: place.formatted_address,
                area: "",
                city: "",
                state: "",
                postalCode: 0,
                country: "",
                location: {
                  longitude: place.geometry.location.lng,
                  latitude: place.geometry.location.lat
                }
              };
              for (var i = 0; i < place.address_components.length; i++) {
                var type = place.address_components[i].types;
                if (
                  type.indexOf("sublocality") != -1 ||
                  type.indexOf("sublocality_level_1") != -1 ||
                  type.indexOf("sublocality_level_2") != -1
                )
                  addressData.area =
                    addressData.area + (addressData.area == "" ? "" : ", ") + place.address_components[i].long_name;
                if (type.indexOf("locality") != -1)
                  addressData.city =
                    addressData.city + (addressData.city == "" ? "" : ", ") + place.address_components[i].long_name;
                if (
                  type.indexOf("administrative_area_level_1") != -1 ||
                  type.indexOf("administrative_area_level_2") != -1
                )
                  addressData.state = place.address_components[i].long_name;
                if (type.indexOf("country") != -1) addressData.country = place.address_components[i].long_name;
                if (type.indexOf("postal_code") != -1) addressData.postalCode = place.address_components[i].long_name;
              }
              resolve(addressData);
            })
            .catch(err => {
              reject(err);
            });
        });
      })
      .then(addressData => {
        resolve(addressData);
      })
      .catch(err => {
        reject(err);
      });
  });
};

/**
 * Calculate Distance using Google API
 * @param {string} origin - Latitude,Longitude
 * @param {string} destination - Latitude,Longitude
 * @param {*} paths - Array of Latitude,Longitude (Not Require Now)
 */
let calculateDistance = (origin, destination, googleKeys, paths) => {
  return new Promise((resolve, reject) => {
    getAppConfig(googleKeys)
      .then(googleKeys => {
        return new Promise((resolve, reject) => {
          var url =
            "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" +
            origin +
            "&destinations=" +
            destination +
            "&key=";
          callapi(url, googleKeys, googleKeys.length - 1)
            .then(distanceResult => {
              if (distanceResult.status == "ZERO_RESULTS") {
                reject("distanceResult");
              }
              distanceResult = distanceResult["rows"][0];
              let distanceData = {
                distance: distanceResult["elements"][0]["distance"]["value"],
                duration: distanceResult["elements"][0]["duration"]["value"],
                durationMins: distanceResult["elements"][0]["duration"]["text"],
                distanceKm: distanceResult["elements"][0]["distance"]["text"]
              };

              resolve(distanceData);
            })
            .catch(err => {
              reject(err);
            });
        });
      })
      .then(addressData => {
        resolve(addressData);
      })
      .catch(err => {
        reject(err);
      });
  });
};

module.exports = { fetchAddress, calculateDistance };
