"use strict";
const shoppingList = require("../../../../../models/shoppingList");
const childProducts = require("../../../../../models/childProducts");
const error = require("../../../../../statusMessages/responseMessage"); // response messages based on language
const config = process.env;
const Joi = require("joi");
const logger = require("winston");
const webSocket = require("../../../../../library/websocket/websocket");
/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {
  // request.headers.language = "en"; // remove in last
  shoppingList.isExists(
    { userId: request.auth.credentials._id.toString() },
    (err, data) => {
      if (err) {
        logger.error("Error occurred while checking shoppingList : " + err);
        // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
        return reply({ message: request.i18n.__("genericErrMsg")["500"] }).code(
          500
        );
      }
      if (data) {
        shoppingList.isExistsWithItem(
          {
            userId: request.auth.credentials._id.toString(),
            childProductId: request.payload.childProductId,
            // unitId: request.payload.unitId,
            parentProductId: request.payload.parentProductId
          },
          (err, isItem) => {
            if (err) {
              logger.error(
                "Error occurred while checking shoppingList : " + err
              );
              // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
              return reply({
                message: request.i18n.__("genericErrMsg")["500"]
              }).code(500);
            }
            if (isItem.length > 0) {
              if (parseInt(isItem[0].shoppingList.status) == 0) {
                shoppingList.pullItems(
                  {
                    parentProductId: request.payload.parentProductId,
                    userId: request.auth.credentials._id.toString(),
                    childProductId: request.payload.childProductId
                    // unitId: request.payload.unitId
                  },
                  (err, data) => {
                    if (err) {
                      logger.error(
                        "Error occurred while updating to shoppingList : " + err
                      );
                      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                      return reply({
                        message: request.i18n.__("genericErrMsg")["500"]
                      }).code(500);
                    } else
                      childProducts.pullFavorites(
                        {
                          userId: request.auth.credentials._id.toString(),
                          childProductId: request.payload.childProductId,
                          unitId: request.payload.unitId
                        },
                        (err, data) => {
                          // return reply({ message: error['shoppingList']['202'][request.headers.language], }).code(202);
                          return reply({
                            message: request.i18n.__("shoppingList")["202"]
                          }).code(202);
                        }
                      );
                  }
                );
              } else {
                shoppingList.pushItemss(
                  {
                    userId: request.auth.credentials._id.toString(),
                    childProductId: request.payload.childProductId,
                    //unitId: request.payload.unitId,
                    parentProductId: request.payload.parentProductId,
                    createdBy: "customer"
                  },
                  (err, res) => {
                    if (err) {
                      logger.error(
                        "Error occurred while adding to shoppingList : " + err
                      );
                      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                      return reply({
                        message: request.i18n.__("genericErrMsg")["500"]
                      }).code(500);
                    } else {
                      childProducts.pushFavorites(
                        {
                          userId: request.auth.credentials._id.toString(),
                          unitId: request.payload.unitId,
                          childProductId: request.payload.childProductId,
                          createdBy: "customer"
                        },
                        (err, data) => {
                          // return reply({ message: error['shoppingList']['201'][request.headers.language] }).code(201);
                          return reply({
                            message: request.i18n.__("shoppingList")["201"]
                          }).code(201);
                        }
                      );
                    }
                  }
                );
              }
            } else {
              shoppingList.pushItems(
                {
                  userId: request.auth.credentials._id.toString(),
                  childProductId: request.payload.childProductId,
                  //unitId: request.payload.unitId,
                  parentProductId: request.payload.parentProductId,
                  createdBy: "customer"
                },
                (err, res) => {
                  if (err) {
                    logger.error(
                      "Error occurred while adding to shoppingList : " + err
                    );
                    // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
                    return reply({
                      message: request.i18n.__("genericErrMsg")["500"]
                    }).code(500);
                  } else {
                    childProducts.pushFavorites(
                      {
                        userId: request.auth.credentials._id.toString(),
                        unitId: request.payload.unitId,
                        childProductId: request.payload.childProductId,
                        createdBy: "customer"
                      },
                      (err, data) => {
                        // return reply({ message: error['shoppingList']['201'][request.headers.language] }).code(201);
                        return reply({
                          message: request.i18n.__("shoppingList")["201"]
                        }).code(201);
                      }
                    );
                  }
                }
              );
            }
          }
        );
      } else {
        shoppingList.post(
          {
            userId: request.auth.credentials._id.toString(),
            childProductId: request.payload.childProductId,
            // unitId: request.payload.unitId,
            parentProductId: request.payload.parentProductId,
            createdBy: "customer"
          },
          (err, res) => {
            if (err) {
              logger.error(
                "Error occurred while adding to shoppingList : " + err
              );
              // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
              return reply({
                message: request.i18n.__("genericErrMsg")["500"]
              }).code(500);
            } else {
              childProducts.pushFavorites(
                {
                  userId: request.auth.credentials._id.toString(),
                  childProductId: request.payload.childProductId,
                  //unitId: request.payload.unitId,
                  createdBy: "customer"
                },
                (err, data) => {
                  // return reply({ message: error['shoppingList']['201'][request.headers.language] }).code(201);
                  return reply({
                    message: request.i18n.__("shoppingList")["201"]
                  }).code(201);
                }
              );
            }
          }
        );
      }
    }
  );
};

/**
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
  parentProductId: Joi.string()
    .description("string")
    .allow(""),
  childProductId: Joi.string()
    .required()
    .description("string")
  //  unitId: Joi.string().required().description('string')
};
/**
 * A module that exports add cart handler, add cart validator!
 * @exports validator
 * @exports handler
 */
module.exports = { handler, validator };
