"use strict";
const zones = require("../../../../../models/zones");
const stores = require("../../../../../models/stores");
const cities = require("../../../../../models/cities");
const error = require("../../../../../statusMessages/responseMessage"); // response messages based on language
const config = process.env;
const Joi = require("joi");
const logger = require("winston");
const async = require("async");
const ObjectID = require("mongodb").ObjectID;
const _ = require("underscore-node");
/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {
  let dropZone = {};
  let dropZoneIds = [];
  let pickUpZoneData = {}
  let pickUpZoneIds = []

  const readDropZone = () => {
    return new Promise((resolve, reject) => {
      zones.inZoneAll({
        lat: request.params.dropLatitude,
        long: request.params.dropLongitude
      }, (err, data) => {
        if (err) {
          logger.error("Error occurred during get fare (inZoneAll): 2" + JSON.stringify(err));
          reject({
            code: 500
          });
        }
        if (data.length > 0) {
          for (let j = 0; j < data.length; j++) {
            dropZoneIds.push(data[j]._id.toString());
          }
          dropZone = dropZoneIds;
          resolve(true);
        } else {
          reject({
            code: 400
          });
        }
      });
    });
  };
  const readPickUpZone = () => {
    return new Promise((resolve, reject) => {
      zones.inZoneAll({
        lat: request.params.pickUpLatitude,
        long: request.params.pickUpLongitude
      }, (err, data) => {
        if (err) {
          logger.error("Error occurred during get fare (inZoneAll): 3" + JSON.stringify(err));
          reject({
            code: 500
          });
        }
        
        if (data.length > 0) {

          for (let j = 0; j < data.length; j++) {
            pickUpZoneIds.push(data[j]._id.toString());
          }

          pickUpZoneData = pickUpZoneIds;
          
          resolve(true);
        } else {
          reject({
            code: 400
          });
        }
      });
    });
  };

  readDropZone()
    .then(readPickUpZone)
    .then((res) => {
      if (dropZone[0] === pickUpZoneData[0]) {
        return reply({
          message: request.i18n.__("fare")["200"],
        }).code(200);
      } else {
        return reply({
          message: request.i18n.__("checkOperationZone")["400"]
        }).code(400);
      }
    }).catch(e => {
      logger.error("err during 1st promis " + JSON.stringify(e));
      logger.error(e);
          return reply({
            message: request.i18n.__("checkOperationZone")["400"]
          }).code(400);
      
    });
}

const validator = {
  dropLatitude: Joi.number().required().description('Latitude'),
  dropLongitude: Joi.number().required().description('Longitude'),
  pickUpLatitude: Joi.number().allow("").description('Longitude'),
  pickUpLongitude: Joi.number().allow("").description('Longitude'),
}
/**
 * A module that exports customer send otp handler, send otp validator!
 * @exports validator
 * @exports handler
 */
module.exports = {
  handler,
  validator
};