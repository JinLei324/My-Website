"use strict";
const customer = require("../../../../../models/customer");
const mobileDevices = require("../../../../../models/mobileDevices");
const appConfig = require("../../../../../models/appConfig");
const notifications = require("../../../../../library/fcm");
const notifyi = require("../../../../../library/mqttModule");
const Auth = require("../../../../middleware/authentication");
const error = require("../../../../../statusMessages/responseMessage"); // response messages based on language
const config = process.env;
const Bcrypt = require("bcrypt"); //hashing module
const Joi = require("joi");
const async = require("async");
const ObjectID = require("mongodb").ObjectID;
const moment = require("moment");
const logger = require("winston");
const zendesk = require('../../../../../models/zendesk');

const configStripe = require("../../../../../config/components/stripe");
const stripeMode = configStripe.stripe.STRIPE_MODE;
const stripeCustomer = require("../../../../../models/stripeCustomer");

const stripeLib = require("../../../../../library/stripe");

const errorMsg = require("../../../../../locales");
const stripeModel = require("../../../../commonModels/stripe");
const dbErrResponse = { message: error["genericErrMsg"]["500"], code: 500 };
const userList = require("../../../../commonModels/userList");
let stripeId = "";
/**
 * @function
 * @name loginHandler
 * @param  {string} status:  0 - Active , 1 - Banned , 2 - Unverfied
 * @param  {string}  loginType -1- Normal login, 2- Fb , 3-Google, if 2,3 socialMediaID required
 * @return {object} Reply to the user.
 */


const handler = (req, reply) => {
  // req.headers.language = 'en';
  appConfig.get({}, (err, appConfig) => {
    if (err) {
      logger.error("Error occurred during customer sigini(appconfig get): " + JSON.stringify(err));
      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
    }
    let accessTokenExp = 604800; //7days

    if (appConfig) {
      accessTokenExp = appConfig.securitySettings ? parseInt(appConfig.securitySettings.accessToken) : accessTokenExp;
    }
    customer.getData(
      {
        countryCode: req.payload.countryCode,
        phone: req.payload.phone,
        status: { $nin: [4] }
      },
      async (err, customer) => {
        if (err) {
          logger.error("Error occurred during customer signin  (getData): " + JSON.stringify(err));
          // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
          return reply({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
        }
        if (customer === null)
          // return reply({ message: error['slaveSignIn']['404'][req.headers.language] }).code(404);
          return reply({ message: req.i18n.__("slaveSignIn")["404"] }).code(404);
        if (parseInt(customer.status) == 1)
          // return reply({ message: error['slaveSignIn']['403'][req.headers.language] }).code(403);
          return reply({ message: req.i18n.__("slaveSignIn")["403"] }).code(403);
        if (parseInt(customer.status) == 3)
          // return reply({ message: error['slaveSignIn']['415'][req.headers.language] }).code(415);
          return reply({ message: req.i18n.__("slaveSignIn")["415"] }).code(415);
        if (parseInt(customer.status) == 4) return reply({ message: req.i18n.__("signIn")["405"] }).code(405);
        if (customer.mobileVerified == false)
          // return reply({ message: error['slaveSignIn']['402'][req.headers.language] }).code(402);
          return reply({ message: req.i18n.__("slaveSignIn")["402"] }).code(402);
        if (typeof customer.password === "undefined")
          // return reply({ message: error['slaveSignIn']['406'][req.headers.language] }).code(406);
          return reply({ message: req.i18n.__("slaveSignIn")["406"] }).code(406);
        let isPasswordValid = Bcrypt.compareSync(req.payload.password, customer.password);

        if (isPasswordValid === false)
          // return reply({ message: error['slaveSignIn']['401'][req.headers.language] }).code(401);
          return reply({ message: req.i18n.__("slaveSignIn")["401"] }).code(401);
        let authToken = Auth.SignJWT(
          { _id: customer._id.toString(), key: "acc", deviceId: req.payload.deviceId },
          "customer",
          accessTokenExp
        ); //sign a new JWT
        let mongoId = new ObjectID();
        let fcmTopic = "FCM-" + mongoId.toString() + moment().unix(); //generate a new fcmTopic on new login
        //  let mqttTopic = 'MQTT-' + mongoId.toString() + moment().unix();//generate a new mqttTopic on new login
        let mqttTopic = customer.mqttTopic;
        req.payload.coordinates = {
          longitude: parseFloat(req.payload.longitude || 0.0),
          latitude: parseFloat(req.payload.latitude || 0.0)
        };
        delete req.payload.latitude;
        delete req.payload.longitude;
        req.payload.cityId = customer.cityId;
        req.payload.registeredFromCity = customer.registeredFromCity;
        req.payload.fcmTopic = fcmTopic;
        //  req.payload.mqttTopic = mqttTopic;
        updateLogs(customer._id.toString(), 1, req.payload, () => { }); //asynchronously update the login status
        if (customer.mobileDevices && customer.mobileDevices.deviceId != req.payload.deviceId) {
          notifications.notifyFcmTopic(
            {
              action: 12,
              usertype: 1, // 1 - customer
              deviceType: customer.mobileDevices ? customer.mobileDevices.deviceType : 1,
              notification: "",
              msg: errorMsg["messages"]["sessionMsgPushBody"],
              fcmTopic: customer.fcmTopic,
              title: errorMsg["messages"]["sessionMsgPushTitle"],
              data: {}
            },
            () => { }
          );
          notifyi.notifyRealTime({
            listner: customer.mqttTopic,
            message: {
              action: 12,
              message: errorMsg["messages"]["sessionMsgPushBody"],
              deviceId: req.payload.deviceId,
              token: authToken
            }
          });
        }
        let zendeskId = customer.zendeskId ? customer.zendeskId : ""
        if (customer.zendeskId == "") {

        }

        //checking for zendesk id
        if (customer.zendeskId == "" || typeof customer.zendeskId == undefined || customer.zendeskId == null) {
          try {
            customer.zendeskId = await genZendeskId(customer)
          } catch (error) {
            console.log("error in zendessk id checking..", error)
          }
        }

        let data = {
          token: authToken,
          sid: customer._id.toString(),
          payfortUrl: "https://payfort.trolley.app/index.php",
          mobile: customer.phone ? customer.phone.toString() : "",
          countryCode: customer.countryCode ? customer.countryCode.toString() : "",
          email: customer.email ? customer.email.toString() : "",
          // referralCode: customer.referralCode,
          name: customer.name ? customer.name : "",
          fcmTopic: fcmTopic,
          mqttTopic: mqttTopic,
          googleMapKeyMqtt: "googleMapKey",
          mmjCard: {
            url: customer.mmjCard && customer.mmjCard.url ? customer.mmjCard.url : "",
            verified: customer.mmjCard ? customer.mmjCard.verified : false
          },
          identityCard: {
            url: customer.identityCard && customer.identityCard.url ? customer.identityCard.url : "",
            verified: customer.identityCard ? customer.identityCard.verified : false
          },
          requester_id: customer.zendeskId || ""
        };

        userList.createUser(
          customer._id.toString(),
          customer.name || "",
          "",
          fcmTopic || "",
          customer.profilePic || "",
          customer.countryCode + customer.phone,
          1,
          fcmTopic || "",
          mqttTopic,
          req.payload.deviceType || 2
        );
        // if (customer._id.toString() == req.auth.credentials._id.toString()) {

        // } else {

        // }

        getCustomer(customer._id.toString())
          .then(getCard)
          .then(cardArr => {
            if (cardArr.length > 0) data["default_card"] = cardArr[0];
            // return reply({ message: error['slaveSignIn']['200'][req.headers.language], data: data }).code(200);
            return reply({ message: req.i18n.__("slaveSignIn")["200"], data: data }).code(200);
          })
          .catch(err => {
            logger.error("main catch");
            // return reply({ message: error['slaveSignIn']['200'][req.headers.language], data: data }).code(200);
            return reply({ message: req.i18n.__("slaveSignIn")["200"], data: data }).code(200);
          });
      }
    );
  });

  let getCard = defaultCard => {
    return new Promise((resolve, reject) => {
      logger.error(defaultCard);
      logger.error("defaultCard");
      if (stripeId == "") return resolve([]);
      else {
        stripeLib.getCards(stripeId, (err, data) => {
          if (err) {
            stripeModel.stripeError.errorMessage(err, req).then(message => {
              logger.error("err while getting getCards");
              return reject({ message: message, code: 500 });
            });
          } else {
            let cardData = data["data"] || [];
            let cardArr = cardData.map(item => {
              return {
                name: item.name || "",
                last4: item.last4,
                expYear: item.exp_year,
                expMonth: item.exp_month,
                id: item.id,
                brand: item.brand,
                funding: item.funding,
                isDefault: item.id === defaultCard ? true : false //set the default flag
              };
            });
            return resolve(cardArr);
          }
        });
      }
    });
  };
  let getCustomer = id => {
    return new Promise((resolve, reject) => {
      logger.error(stripeMode);
      stripeCustomer
        .getCustomer(id, stripeMode)
        .then(data => {
          if (data) {
            stripeId = data.stripeId;
            stripeLib.retrieveCustomer(data.stripeId, (err, customer) => {
              if (err) {
                stripeModel.stripeError.errorMessage(err, req).then(message => {
                  logger.error("err while getting stripeModel.stripeError  ");
                  return reject({ message: message, code: 500 });
                });
              } else {
                logger.warn(JSON.stringify(customer));
                logger.warn(customer.default_source);
                return resolve(customer.default_source);
              }
            });
          } else {
            return resolve(true);
          }
        })
        .catch(err => {
          logger.error("err while getting dbErrResponse catch");
          return reject(dbErrResponse);
        });
    });
  };
  const genZendeskId = (customerData) => new Promise((resolve, reject) => {

    let url = zendesk.config.zd_api_url + '/users.json';
    let dataArr = { "user": { "name": customerData.name, "email": customerData.email, "role": 'end-user' } };
    let zendeskId = ""
    zendesk.users.post(dataArr, url, (err, result) => {
      if (err) {
        console.log("err", err)
        resolve("")
      }
      zendeskId = result.user ? result.user.id : "";
      //update customer zendesk id in db
      customer.update({ q: { _id: customerData._id }, data: { "$set": { zendeskId: zendeskId } } }, (err, result) => {
        logger.info("product order Count", err);
        resolve(zendeskId)
      });
    })
  });
}


/**
 * @function
 * @name updateLogs
 * @param {string} id - customer id.
 * @param {string} userType - customer or guest
 * @param {object} data - data coming from req.payload
 */
function updateLogs(id, userType, data, callback) {
  data.id = id;
  data.userType = userType;
  data.userTypeMsg = "Customer";
  mobileDevices.updateMobileDevices(data, (err, result) => {
    if (err) {
      logger.error("Error occurred during customer signin (updateMobileDevices): " + JSON.stringify(err));

      return callback("Error updating customer signin status");
    }
    customer.updateDeviceLog(data, (err, result) => {
      if (err) {
        logger.error("Error occurred during customer signin (updateDeviceLog): " + JSON.stringify(err));
        return callback("Error updating customer signin status");
      }
      return callback(null, result.lastErrorObject.updatedExisting);
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
  phone: Joi.string()
    .required()
    .description("Phone"),
  password: Joi.string()
    .required()
    .description("Password"),
  deviceId: Joi.string()
    .required()
    .description("Device id"),
  pushToken: Joi.string()
    .required()
    .description("Push token"),
  appVersion: Joi.string()
    .required()
    .description("App version"),
  deviceMake: Joi.string()
    .required()
    .description("Device Make"),
  deviceModel: Joi.string()
    .required()
    .description("Device model"),
  deviceType: Joi.number()
    .required()
    .integer()
    .min(1)
    .max(3)
    .description("1- IOS , 2- Android 3 -web"),
  deviceOsVersion: Joi.string().description("Device Os Version"),
  deviceTime: Joi.string()
    .required()
    .description("Format : YYYY-MM-DD HH:MM:SS"),
  countryCode: Joi.string()
    .required()
    .description("CountryCode"),
  latitude: Joi.number().description("Latitude"),
  longitude: Joi.number().description("Longitude")
};
/**
 * A module that exports customer signin's handler, validator!
 * @exports validator
 * @exports handler
 */
module.exports = { handler, validator };
