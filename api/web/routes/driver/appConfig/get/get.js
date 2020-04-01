"use strict";
const appConfig = require("../../../../../models/appConfig");
const Auth = require("../../../../middleware/authentication");
const error = require("../../../../../locales"); // response messages based on language
const config = process.env;
const Bcrypt = require("bcrypt"); //hashing module
const Joi = require("joi");
const async = require("async");
const ObjectID = require("mongodb").ObjectID;
const moment = require("moment");
const logger = require("winston");
const driverSpecialities = require("../../../../../models/driverSpecialities");
const _ = require("underscore-node");
/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {
  appConfig.get({}, (err, appConfig) => {
    if (err) {
      logger.error("Error occurred during driver email phone validate (checkWithEmailOrMail): " + JSON.stringify(err));
      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
      return reply({ message: request.i18n.__("genericErrMsg")["500"] }).code(500);
    }
    var latebookinginterval =
      parseInt(appConfig.dispatch_settings.laterBookingBufferHour * 3600) +
      parseInt(appConfig.dispatch_settings.laterBookingBufferMinute * 60);
    return reply({
      message: request.i18n.__("getData")["200"],
      data: {
        pubnubkeys: appConfig.pubnubkeys,
        // custGoogleMapKeys: typeof appConfig.custGoogleMapKeys == "undefined" ? [] : appConfig.custGoogleMapKeys,
        // custGooglePlaceKeys: typeof appConfig.custGooglePlaceKeys == "undefined" ? [] : appConfig.custGooglePlaceKeys,
        // DriverGoogleMapKeys: typeof appConfig.DriverGoogleMapKeys == "undefined" ? [] : appConfig.DriverGoogleMapKeys,
        googleMapKey:
          typeof appConfig.keyRotationArray == "undefined"
            ? "N/A"
            : appConfig.keyRotationArray[appConfig.currentKeyIndex].currentKey,

        allDriverspushTopics: appConfig.pushTopics
          ? ["test"]
          : "",
        outZoneDriversDriverspushTopics: appConfig.pushTopics ? appConfig.pushTopics.outZoneDrivers : "",
        driverApiInterval:
          typeof appConfig.pubnubSettings.homePageInterval == "undefined"
            ? 5
            : appConfig.pubnubSettings.homePageInterval,
        onJobInterval:
          typeof appConfig.pubnubSettings.onJobInterval == "undefined" ? 5 : appConfig.pubnubSettings.onJobInterval,
        tripStartedInterval:
          typeof appConfig.pubnubSettings.tripStartedInterval == "undefined"
            ? 5
            : appConfig.pubnubSettings.tripStartedInterval,
        laterBookingTimeInterval: latebookinginterval || 3600,
        driverAcceptTime:
          typeof appConfig.dispatch_settings.driverAcceptTime == "undefined"
            ? 1
            : appConfig.dispatch_settings.driverAcceptTime,
        presenceTime: appConfig.presenceSettings.presenceTime || 60,
        // DistanceForLogingLatLongs: appConfig.presenceSettings.DistanceForLogingLatLongs || 300,
        DistanceForLogingLatLongs:
          typeof appConfig.meterRadiusForMinimumLoggingLatLongs == "undefined" ||
            appConfig.meterRadiusForMinimumLoggingLatLongs == 0
            ? 15
            : appConfig.meterRadiusForMinimumLoggingLatLongs,
        DistanceForLogingLatLongsMax:
          typeof appConfig.meterRadiusForMaximumLoggingLatLongs == "undefined" ||
            appConfig.meterRadiusForMaximumLoggingLatLongs == 0
            ? 500
            : appConfig.meterRadiusForMaximumLoggingLatLongs,
        DriverRating: appConfig.DriverRating,
        paidByReceiver:
          typeof appConfig.customerWalletLimits == "undefined" ? "" : appConfig.customerWalletLimits.paidByReceiver || "",
        appVersions: appConfig.appVersions,
        stripeKey: typeof appConfig.stripeTestKeys == "undefined" ? "" : appConfig.stripeTestKeys.PublishableKey || ""
      }
    }).code(200);
    // return reply({
    //     message: error['getData']['200'], data: {
    //         pubnubkeys: appConfig.pubnubkeys,
    //         custGoogleMapKeys: typeof appConfig.custGoogleMapKeys == "undefined" ? [] : appConfig.custGoogleMapKeys,
    //         custGooglePlaceKeys: typeof appConfig.custGooglePlaceKeys == "undefined" ? [] : appConfig.custGooglePlaceKeys,
    //         DriverGoogleMapKeys: typeof appConfig.DriverGoogleMapKeys == "undefined" ? [] : appConfig.DriverGoogleMapKeys,

    //         allDriverspushTopics: appConfig.pushTopics ? [appConfig.pushTopics ? appConfig.pushTopics.allDrivers : "", appConfig.pushTopics ? appConfig.pushTopics.allCitiesDrivers : ""] : "",

    //         outZoneDriversDriverspushTopics: appConfig.pushTopics ? appConfig.pushTopics.outZoneDrivers : "",

    //         driverApiInterval: typeof appConfig.pubnubSettings.homePageInterval == "undefined" ? 5 : appConfig.pubnubSettings.homePageInterval,

    //         onJobInterval: typeof appConfig.pubnubSettings.onJobInterval == "undefined" ? 5 : appConfig.pubnubSettings.onJobInterval,

    //         tripStartedInterval: typeof appConfig.pubnubSettings.tripStartedInterval == "undefined" ? 5 : appConfig.pubnubSettings.tripStartedInterval,

    //         laterBookingTimeInterval: latebookinginterval || 3600,
    //         driverAcceptTime: typeof appConfig.dispatch_settings.driverAcceptTime == "undefined" ? 1 : appConfig.dispatch_settings.driverAcceptTime,
    //         presenceTime: appConfig.presenceSettings.presenceTime || 60,
    //         DistanceForLogingLatLongs: appConfig.presenceSettings.DistanceForLogingLatLongs || 300,
    //         DriverRating: appConfig.DriverRating,
    //         paidByReceiver: typeof appConfig.customerWalletLimits == "undefined" ? "" : appConfig.customerWalletLimits.paidByReceiver || "",
    //         appVersions: appConfig.appVersions,
    //         stripeKey: typeof appConfig.stripeTestKeys == "undefined" ? "" : appConfig.stripeTestKeys.PublishableKey || ""
    //     }
    // }).code(200);
  });
};

/**
 * A module that exports get vehicle type Handler,validator!
 * @exports handler
 */
module.exports = { handler };
