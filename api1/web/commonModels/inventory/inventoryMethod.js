var cheerio = require("cheerio"); //to extract the html from html files
var fs = require("fs");
const sendMailOffers = require("../../../library/mailgun");

var childProducts = require("../../../models/childProducts");
var childProductsElastic = require("../../../models/childProductsElastic");
var stores = require("../../../models/stores");
var inventoryLogs = require("../../../models/inventoryLogs");
var storesElastic = require("../../../models/storeElastic");
const config = process.env;
const Joi = require("joi");
const logger = require("winston");
const moment = require("moment");
const ObjectID = require("mongodb").ObjectID;
const Async = require("async");
/** @namespace */
const error = require("../../../locales");

module.exports.patchLogs = (params, callback) => {

  const read = () => {
    let availableBalance = 0;

    return new Promise((resolve, reject) => {
      try {
        if (params.comingFromBulkUpload == 1) {
          inventoryLogs.Insert(
            {
              unitId: params.unitId,
              productId: params.productId,
              triggerType: params.triggerType,
              triggerTypeMsg: params.triggerType == 1 ? "Credit" : "Debit",
              openingBalance: availableBalance,
              quantity: Math.abs(params.quantity),
              closingBalance: availableBalance + params.quantity,
              orderId: params.orderId ? params.orderId : 0,
              userId: params.userId ? params.userId : "",
              timeStamp: parseInt(moment().valueOf()),
              isoTimeStamp: new Date(),
              description: params.description
            },
            (err, resultelastic) => {
              if (err) {


              }
              return resolve({
                code: 200,
                message: error["products"]["200"],
                data: []
              });
            }
          );
        } else {
          let productId = new ObjectID(params.productId);
          var queryData = {};
          inventoryLogs.getOne(
            { productId: params.productId, unitId: params.unitId },
            (err, result) => {
              if (err) {
                return reject({ code: 500, message: error["genericErrMsg"]["500"] });
              }
              if (result) {
                availableBalance = result.closingBalance;
              }
              if (
                params.triggerType == 2 &&
                availableBalance < params.quantity
              ) {
                //error failed to remove
                return reject({
                  code: 400,
                  message: error["inventoryStock"]["400"]
                });
              }
              if (params.triggerType == 1) {
                params.quantity = params.quantity * 1;
              }
              if (params.triggerType == 2) {
                params.quantity = params.quantity * -1;
              }
              queryData = {
                $inc: { "units.$.availableQuantity": params.quantity }
              };
              childProducts.update(
                {
                  q: { _id: new ObjectID(params.productId), storeId: new ObjectID(params.storeId), "units.unitId": params.unitId },
                  data: queryData,
                  options: { returnOriginal: false }
                },
                (err, updateObj) => {
                  if (err) {

                    return reject({
                      code: 500,
                      message: error["genericErrMsg"]["500"]
                    });
                  }

                  inventoryLogs.Insert(
                    {
                      unitId: params.unitId,
                      productId: params.productId,
                      triggerType: params.triggerType,
                      triggerTypeMsg:
                        params.triggerType == 1 ? "Credit" : "Debit",
                      openingBalance: availableBalance,
                      quantity: Math.abs(params.quantity),
                      closingBalance: availableBalance + params.quantity,
                      orderId: params.orderId ? params.orderId : 0,
                      userId: params.userId ? params.userId : "",
                      timeStamp: parseInt(moment().valueOf()),
                      isoTimeStamp: new Date(),
                      description: params.description
                    },
                    (err, resultelastic) => {
                      updateObj.value.storeId = String(updateObj.value.storeId);
                      updateObj.value.brand = String(updateObj.value.brand);
                      delete updateObj.value._id;
                      delete updateObj.value.actions;
                      childProductsElastic.Update(
                        productId.toString(),
                        updateObj.value,
                        (err, resultelastic) => {
                          if (err) {


                          }
                          return resolve({
                            code: 200,
                            message: error["products"]["200"],
                            data: []
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      } catch (e) {
        logger.error(
          "err during update inventory(catch) ------------------",
          e
        );
        reject({ code: 500, message: error["genericErrMsg"]["500"] });
      }
    });
  };

  read()
    .then(data => {
      // promise to get stores
      return callback(null, data);
    })
    .catch(e => {
      logger.error("err during update inventory(catch) ", e);
      return callback({ code: e.code, message: e.message });
    });
};
