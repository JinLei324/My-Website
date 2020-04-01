"use strict";
// response messages based on language 
const config = process.env;
const Bcrypt = require('bcrypt');//hashing module 
const Joi = require('joi');
const async = require('async');
const moment = require('moment');
const logger = require('winston');
const childProducts = require('../../../../../models/childProducts');
const childProductsElastic = require('../../../../../models/childProductsElastic');
const ObjectId = require('mongodb').ObjectID;
/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */

const handler = (req, reply) => {
  let products = [];
  var skip = parseInt(parseInt(req.params.index) * parseInt(req.params.limit)) || 0
  var limit = parseInt(req.params.limit) || 10
  const searchProducts = () => {
    return new Promise((resolve, reject) => {

      let data = {
        'search': req.params.search,
        'storeId': req.params.storeId,
        'skip': skip,
        'limit': limit,
      };
      childProductsElastic.getProductsByStoreId(data, (err, product) => {
        if (err) {
          logger.error('Error occurred during business products get (getProductsSubCatwise): ' + JSON.stringify(err));
          return reply({
            message: req.i18n.__('genericErrMsg')['500']
          }).code(500);
        }
        if (product.length > 0) {
          async.each(product, (item, callback) => {
            let itemProduct = {
              "storeId": item['_source'].storeId,
              "detailedDescription": item['_source'].detailedDescription,
              "shortDescription": item['_source'].shortDescription,
              "parentProductId": item['_source'].parentProductId,
              "taxes": item['_source'].taxes,
              "units": [],
              "productName": item['_source'].productname['en'],
              "storeId": item['_source'].storeId,
              "productId": item._id,
            };
            let units = [];
            for (let i = 0; i < item['_source'].units.length; i++) {
              if (item['_source'].units[i].availableQuantity > 0) {
                let unitsdata = {};

                unitsdata["availableQuantity"] = item['_source'].units[i].availableQuantity;
                unitsdata["addOns"] = [];
                unitsdata["name"] = item['_source'].units[i].name['en'];
                unitsdata["unitId"] = item['_source'].units[i].unitId;
                unitsdata["floatValue"] = item['_source'].units[i].floatValue;
                // unitsdata["addOns"] = item['_source'].units[i].addOns;
                // for (let j = 0; j < item['_source'].units[i].addOns; j++) {
                //   unitsdata["addOns"].push({

                //   })
                // }
                itemProduct.units.push(unitsdata)
              }
            }
            products.push(itemProduct)
            callback();
          }, function (err) {
            if (err) {
              reject(err)
            }
            resolve(true);

          });
        } else {
          resolve(true);
        }


      })
    });
  };
  searchProducts()
    .then(data => {
      return reply({
        message: req.i18n.__("getData")["200"],
        data: products
      }).code(200);
    })
    .catch(e => {
      logger.error("err during get fare(catch) " + e);
      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
      return reply({
        message: req.i18n.__("genericErrMsg")["500"]
      }).code(500);
    });
};
const validator = {
  storeId: Joi.string().required().description('storeId'),
  index: Joi.string().required().description('index'),
  limit: Joi.string().required().description('limit'),
  search: Joi.string().required().description('serach'),
}
/**
 * A module that exports get vehicle type Handler,validator!
 * @exports handler
 */
module.exports = { validator, handler };
