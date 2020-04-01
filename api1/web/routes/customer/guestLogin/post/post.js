const customer = require("../../../../../models/customer");
const cities = require("../../../../../models/cities");
const mobileDevices = require("../../../../../models/mobileDevices");
const Auth = require("../../../../middleware/authentication");
const error = require("../../../../../statusMessages/responseMessage"); // response messages based on language
const config = process.env;
var Joi = require("joi");
const logger = require("winston");
const notifyi = require("../../../../../library/mqttModule");
const moment = require("moment");
/**
 * @function
 * @name handler
 * @param {string} status -  0 - Active , 1 - Banned , 2 - Unverfied.
 * @return {object} Reply to the user.
 */

const handler = (req, reply) => {
  // req.headers.language = 'en';
  customer.updateLatLong(req.payload, (err, result) => {
    if (err) {
      logger.error("Error occurred on guest login : " + JSON.stringify(err));
      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
      return reply({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
    }
    let id;
    if (result.lastErrorObject.updatedExisting) id = result.value._id.toString();
    else id = result.lastErrorObject.upserted.toString();
    let authToken = Auth.SignJWT({ _id: id, deviceId: req.payload.deviceId, key: "gacc" }, "guest", config.accTokenExp); //sign a new JWT
    req.payload.coordinates = {
      longitude: parseFloat(req.payload.longitude || 0.0),
      latitude: parseFloat(req.payload.latitude || 0.0)
    };
    req.payload.cityId = "";
    req.payload.registeredFromCity = "";
    cities.inZone({ lat: req.payload.latitude || 0, long: req.payload.longitude || 0 }, (err, zone) => {
      req.payload.cityId = zone ? zone.cities[0].cityId.toString() : "";
      req.payload.registeredFromCity = zone ? zone.cities[0].cityName : "";
      updateLogs(id, 3, req.payload, () => { }); //asynchronously update the login status

      let data = {
        token: authToken,
        sid: id,
        cityId: req.payload.cityId != "" ? req.payload.cityId.toString() : "",
        type: "guest",
        googleMapKeyMqtt: "googleMapKey"
      };

      // notifyi.notifyRealTime({ 'listner': 'newOrder/5a1974a0e0dc3f28f46dd4df', message: {'response':'Psfsaf'} });

      // return reply({ message: error['guestRegisterUser']['200'][req.headers.language], data: data }).code(200);

      return reply({ message: req.i18n.__("guestRegisterUser")["200"], data: data }).code(200);
    });


  });
};
/**
 * @function
 * @name updateLogs
 * @param {string} id - customer id.
 * @param {string} userType - customer or guest
 * @param {object} data - data coming from req.payload
 */

function updateLogs(id, userType, data, cb) {
  data.id = id;
  data.userType = userType;
  data.userTypeMsg = "Guest";

  mobileDevices.updateMobileDevices(data, (err, result) => {
    if (err) return cb("Error updating customer signin status");

    customer.updateDeviceLog(data, (err, result) => {
      if (err) return cb("Error updating customer signin status");

      return cb(null, result.lastErrorObject.updatedExisting);
    });
  });
} //update the login status of the customer, logs out from all the other devices

/**
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
  deviceId: Joi.string()
    .required()
    .description("Device id"),
  appVersion: Joi.string().description("App version"),
  deviceMake: Joi.string().description("Device Make"),
  deviceModel: Joi.string().description("Device model"),
  deviceOsVersion: Joi.string().description("Device Os Version"),
  deviceType: Joi.number()
    .integer()
    .min(1)
    .max(3)
    .required()
    .description("1- IOS , 2- Android, 3- Web")
    .error(new Error("Please enter valid device type")),
  deviceTime: Joi.string().description("Format : YYYY-MM-DD HH:MM:SS"),
  latitude: Joi.number()
    .description(" Latitude")
    .error(new Error("Latitude must be number")),
  longitude: Joi.number()
    .description("Longitude ")
    .error(new Error("Longitude must be number"))
};
/**
 * A module that exports guest logins handler, validator!
 * @exports validator
 * @exports handler
 */
module.exports = { handler, validator };
