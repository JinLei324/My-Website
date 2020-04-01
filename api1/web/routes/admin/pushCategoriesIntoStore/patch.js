"use strict";

var stores = require('../../../../models/stores');
var storesElastic = require('../../../../models/storeElastic');
const error = require('../../../../statusMessages/statusMessages'); // response messages based on language 
const config = process.env;
const Joi = require("joi");
const logger = require("winston");
const moment = require("moment");
const ObjectID = require("mongodb").ObjectID;


/** 
 * @function
 * @name handler 
 * @return {object} Reply to the user.
 */
const handler = (request, reply) => {
  let pushDataMongo = {};
  let pushDataElastic;
  let pushType;

  if (request.payload.firstCategory) {
    pushDataMongo = {
      'firstCategory': request.payload.firstCategory
    };
    pushDataMongo.firstCategory.id = new ObjectID(pushDataMongo.firstCategory.id)
    pushDataElastic = request.payload.firstCategory;
    pushType = 'firstCategory';
  }
  if (request.payload.secondCategory) {
    pushDataMongo = {
      'secondCategory': request.payload.secondCategory
    };
    pushDataMongo.secondCategory.id = new ObjectID(pushDataMongo.secondCategory.id)

    pushDataElastic = request.payload.secondCategory;
    pushType = 'secondCategory';
  }
  if (request.payload.thirdCategory) {
    pushDataMongo = {
      'thirdCategory': request.payload.thirdCategory
    };
    pushDataMongo.thirdCategory.id = new ObjectID(pushDataMongo.thirdCategory.id)

    pushDataElastic = request.payload.thirdCategory;
    pushType = 'thirdCategory';
  }
  if (request.payload.workingHours) {
    pushDataMongo = {
      'workingHours': request.payload.workingHours
    };
    pushDataElastic = request.payload.workingHours;
    pushType = 'workingHours';
  }
  let Category = []
  let elasticData = {};
  stores.getOneElastic({
    "_id": new ObjectID(request.payload.storeId)
  }, (err, dataResult) => {

    switch (pushType) {
      case 'firstCategory':
        if ('firstCategory' in dataResult) {
          Category = dataResult.firstCategory;
        }
        Category.push(pushDataElastic);
        elasticData = {
          "firstCategory": Category
        };
        break;
      case 'secondCategory':
        if ('secondCategory' in dataResult) {
          Category = dataResult.secondCategory;
        }
        Category.push(pushDataElastic);
        elasticData = {
          "secondCategory": Category
        };
        break;
      case 'thirdCategory':
        if ('thirdCategory' in dataResult) {
          Category = dataResult.thirdCategory;
        }
        Category.push(pushDataElastic);
        elasticData = {
          "thirdCategory": Category
        };
        pushDataMongo.thirdCategory.id = new ObjectID(pushDataMongo.thirdCategory.id)
        pushDataElastic = request.payload.thirdCategory;
        pushType = 'thirdCategory';
        break;
    }
    if (request.payload.workingHours) {
      pushDataMongo = {
        'workingHours': request.payload.workingHours
      };

    }



    if (err) {

      return reply({
        message: request.i18n.__('genericErrMsg')['500']
      }).code(500);
    }
    storesElastic.Update(request.payload.storeId, elasticData, (err, resultelastic) => {

      if (err) {

        return reply({
          message: request.i18n.__('genericErrMsg')['500']
        }).code(500);
      }

      stores.updateWithPush({
        "_id": new ObjectID(request.payload.storeId)
      }, {
          $push: pushDataMongo
        }, (err, resultObj) => {
          if (err) return reply({
            message: request.i18n.__('genericErrMsg')['500']
          }).code(500);

          return reply({
            message: request.i18n.__('store')['200'],
            data: resultObj
          }).code(200);
        });


    })
  });


};

/**
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
  storeId: Joi.string().required().description('Store Id'),
  firstCategory: Joi.object().keys().description('firstCategory'),
  secondCategory: Joi.object().keys().description('secondCategory'),
  thirdCategory: Joi.object().keys().description('thirdCategory'),
  workingHours: Joi.object().keys().description('workingHours'),

}

/**
 * A module that exports customer get cart handler, get cart validator! 
 * @exports handler 
 */
module.exports = {
  handler,
  validator
}
