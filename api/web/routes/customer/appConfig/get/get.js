"use strict";
const appConfig = require("../../../../../models/appConfig");
const langHelp = require("../../../../../models/langHelp");
const Auth = require("../../../../middleware/authentication");
const error = require("../../../../../locales"); // response messages based on language
const config = process.env;
const Bcrypt = require("bcrypt"); //hashing module
const Joi = require("joi");
const async = require("async");
const ObjectID = require("mongodb").ObjectID;
const moment = require("moment");
const logger = require("winston");
const _ = require("underscore-node");

/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {
  appConfig.get({}, (err, appConfig) => {
    if (err) {
      logger.error("Error occurred during driver email phone validate ( appConfig get): " + JSON.stringify(err));
      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500']) }).code(500);
      return reply({
        message: request.i18n.__("genericErrMsg")["500"]
      }).code(500);
    }

    langHelp.getAllActiveLanguages(
      {
        Active: 1
      },
      (langErr, langResponse) => {
        if (langErr) {
          return reply({
            message: request.i18n.__("genericErrMsg")["500"]
          }).code(500);
        } else {
          var activeLanguages = [];
          async.forEach(langResponse, (item, callbackloop) => {
            var activeLanguage = {
              id: item._id.toString(),
              lan_name: item.lan_name,
              langCode: item.langCode,
              lan_id: item.lan_id
            };

            activeLanguages.push(activeLanguage);
          });

          var latebookinginterval =
            parseInt(appConfig.dispatch_settings.laterBookingBufferHour * 3600) +
            parseInt(appConfig.dispatch_settings.laterBookingBufferMinute * 60);
          return reply({
            message: request.i18n.__("getData")["200"],
            data: {
              pubnubkeys: appConfig.pubnubkeys,
              //   custGoogleMapKeys: typeof appConfig.custGoogleMapKeys == "undefined" ? [] : appConfig.custGoogleMapKeys,
              //   custGooglePlaceKeys:
              //     typeof appConfig.custGooglePlaceKeys == "undefined" ? [] : appConfig.custGooglePlaceKeys,
              allCustomerspushTopics: appConfig.pushTopics ? appConfig.pushTopics.allCustomers : "",
              aallCitiesCustomerspushTopics: appConfig.pushTopics ? appConfig.pushTopics.allCitiesCustomers : "",
              outZoneCustomerspushTopics: appConfig.pushTopics ? appConfig.pushTopics.outZoneCustomers : "",
              customerApiInterval:
                typeof appConfig.pubnubSettings.customerHomePageInterval == "undefined"
                  ? 10
                  : appConfig.pubnubSettings.customerHomePageInterval,
              paidByReceiver: appConfig.customerWalletLimits ? appConfig.customerWalletLimits.paidByReceiver : "",
              appVersions: appConfig.appVersions,
              stripeKey: config.STRIPE_PUBLISHABLE_KEY ? config.STRIPE_PUBLISHABLE_KEY : "",
              scheduledBookingsOnOFF: appConfig.dispatch_settings.scheduledBookingsOnOFF ? appConfig.dispatch_settings.scheduledBookingsOnOFF : 0,
              latebookinginterval: latebookinginterval,
              termsAndConditionsUrl:
                "" + config.adminUrl + "/appWebPages/Customer/Terms" + request.headers.language + ".html",
              privacyPoliciesUrl:
                "" + config.adminUrl + "/appWebPages/Customer/Privacy" + request.headers.language + ".html",
              activeLanguages: activeLanguages,
              contactUs: appConfig.contactUs ? appConfig.contactUs : [],
              aboutUs: appConfig.aboutUs ? appConfig.aboutUs : {},
              termsCondition: appConfig.termsObj ? appConfig.termsObj[request.headers.language] : "",
              privacyPolicy: appConfig.privacyObj ? appConfig.privacyObj[request.headers.language] : "",
              googleMapKey:
                typeof appConfig.keyRotationArray == "undefined"
                  ? "N/A"
                  : appConfig.keyRotationArray[appConfig.currentKeyIndex].currentKey
            }
          }).code(200);
        }
      }
    );
  });
};

/**
 * A module that exports get vehicle type Handler,validator!
 * @exports handler
 */
module.exports = {
  handler
};
