"use strict";

const joi = require("joi");
const logger = require("winston");

const appConfig = require("../../../models/appConfig");
const errorMsg = require("../../../locales");
const notifyi = require("../../../library/mqttModule");

const payloadValidator = {
  count: joi
    .number()
    .min(1)
    .required()
    .description("enter the number of count"),
  currentKey: joi
    .string()
    .required()
    .description("enter the number of count"),
  type: joi
    .number()
    .min(1)
    .max(3)
    .required()
    .description("1 - place , 2 - direction , 3 - distance , 4 - others")
};

const APIHandler = (req, reply) => {
  const dbErrResponse = { message: req.i18n.__("genericErrMsg")["500"], code: 500 };
  let validateKeyRotation = () => {
    return new Promise((resolve, reject) => {
      let currentHit = 0;
      let totalHit = 0;

      let typeHit;

      switch (parseInt(req.payload.type)) {
        case 1:
          typeHit = "keyRotationArray.$.placesHit";
          break;

        case 2:
          typeHit = "keyRotationArray.$.directionHit";
          break;

        case 3:
          typeHit = "keyRotationArray.$.distanceHit";
          break;
      }

      let queryUpdate = {};
      queryUpdate[typeHit] = req.payload.count;
      appConfig.updateRotationKey(
        { "keyRotationArray.currentKey": req.payload.currentKey },
        {
          $inc: queryUpdate
        },
        function(err, result) {
          let response = result.value;

          switch (parseInt(req.payload.type)) {
            case 1:
              currentHit = response.keyRotationArray[response.currentKeyIndex].placesHit;
              totalHit = response.keyRotationArray[response.currentKeyIndex].totalPlacesLimit;
              break;

            case 2:
              currentHit = response.keyRotationArray[response.currentKeyIndex].directionHit;
              totalHit = response.keyRotationArray[response.currentKeyIndex].totalDirectionLimit;
              break;

            case 3:
              currentHit = response.keyRotationArray[response.currentKeyIndex].distanceHit;
              totalHit = response.keyRotationArray[response.currentKeyIndex].totalDistanceLimit;
              break;
          }

          if (currentHit >= totalHit && response.currentKeyIndex != response.totalKeys - 1) {
            let updateData = {
              currentKeyIndex: response.currentKeyIndex == response.totalKeys - 1 ? 0 : response.currentKeyIndex + 1
            };
            appConfig.fineAndUpdate({}, updateData, function(err, result) {
              if (err) return reject(dbErrResponse);

              notifyi.notifyRealTime({
                listner: "googleMapKey",
                message: {
                  status: 100,
                  googleMapKey: response.keyRotationArray[response.currentKeyIndex + 1].currentKey
                },
                qos: 2
              });

              resolve(true);
            });
          } else {
            resolve(true);
          }
        }
      );
    });
  };
  validateKeyRotation()
    .then(data => {
      return reply({
        message: req.i18n.__("genericErrMsg")["200"]
      }).code(200);
    })
    .catch(e => {
      logger.error("Customer get Languages API error =>", e);
      return reply({ message: e.message }).code(e.code);
    });
};

const responseCode = {
  status: {
    500: { message: joi.any().default(errorMsg["genericErrMsg"]["500"]) },
    200: {
      message: joi.any().default(errorMsg["genericErrMsg"]["200"]),
      data: joi.any()
    }
  }
}; //swagger response code

module.exports = { APIHandler, responseCode, payloadValidator };
