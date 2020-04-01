'use strict'
const thirdCategory = require('../../../../../models/thirdCategory');
const childProducts = require('../../../../../models/childProducts');
const firstCategory = require('../../../../../models/firstCategory');
const secondCategory = require('../../../../../models/secondCategory');
const stores = require('../../../../../models/stores');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const googleDistance = require('../../../../commonModels/googleApi');
const customer = require('../../../../../models/customer');
const Joi = require('joi');
const logger = require('winston');
const async = require('async');
const ObjectId = require('mongodb').ObjectID;
const moment = require('moment');//date-time


/** 
* @function
* @name handler 
* @return {object} Reply to the user.
* @param {integer} 1 - preferred store with categories, sub categories; 2 - all stores belonging to that zone  
*/
const handler = (request, reply) => {
  request.params.latitude = request.params.latitude ? request.params.latitude : 0;
  request.params.longitude = request.params.longitude ? request.params.longitude : 0;
  request.params.zoneId = request.params.zoneId ? request.params.zoneId : 0;
  // request.headers.language = "en"; // remove in last
  let cond = {
    $or: [{
      status: 1, _id: new ObjectId(request.params.storeId),
      // catWiseProductCount: { $elemMatch: { count: { $gt: 0 } } }
    }]
  }
  stores.getZonalSubSubCatById(cond, (err, result) => {
    if (err) {
      logger.error('Error occurred during get producst home page(getZonalCategoriesById): ' + JSON.stringify(err));
      return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
    }
    let cats = [];
    if (result && result.length > 0) {
      for (var j = 0; j < result.length; j++) {
        let category = {};
        category['categoryId'] = result[j].firstCategory.id;
        category['categoryName'] = result[j].firstCategory.categoryName ? result[j].firstCategory.categoryName[request.headers.language] : "";
        category['image'] = result[j].firstCategory.imageUrl ? result[j].firstCategory.imageUrl : "";
        category['description'] = result[j].firstCategory.categoryDesc ? result[j].firstCategory.categoryDesc[request.headers.language] : "";
        // category['description'] == result[j].firstCategory.categoryDesc ? result[j].firstCategory.categoryDesc[request.headers.language] : "";
        let subCats = [];
        if (result[j].secondCategory) {
          for (var s = 0; s < result[j].secondCategory.length; s++) {
            let subcategory = {};
            if (result[j].firstCategory.id.toString() == result[j].secondCategory[s].categoryId.toString()) {
              subcategory["subCategoryName"] = result[j].secondCategory[s].subCategoryName ? result[j].secondCategory[s].subCategoryName[request.headers.language] : "";
              subcategory["subCategoryId"] = result[j].secondCategory[s].id ? result[j].secondCategory[s].id : "";
              category['image'] = result[j].secondCategory[s].imageUrl ? result[j].secondCategory[s].imageUrl : "";
              category['description'] = result[j].secondCategory[s].description ? result[j].secondCategory[s].description[request.headers.language] : "";
              subCats.push(subcategory);
            }
          }
        }
        category['subCategories'] = subCats;
        cats.push(category);
      }
    }

    return reply({
      // message: Joi.any().default(i18n.__('stores']['200'][request.headers.language],
      message: request.i18n.__('stores')['200'],
      data: cats
    }).code(200);
  });
}

const handlerOLD = (request, reply) => {
  request.params.latitude = request.params.latitude ? request.params.latitude : 0;
  request.params.longitude = request.params.longitude ? request.params.longitude : 0;
  request.params.zoneId = request.params.zoneId ? request.params.zoneId : 0;
  // request.headers.language = "en"; // remove in last
  let cond = {
    $or: [{
      status: 1, _id: new ObjectId(request.params.storeId),
      catWiseProductCount: { $elemMatch: { count: { $gt: 0 } } }
    }]
  }
  stores.getZonalSubSubCatById(cond, (err, result) => {
    if (err) {
      logger.error('Error occurred during get producst home page(getZonalCategoriesById): ' + JSON.stringify(err));
      return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
    }
    if (result.length > 0) {
      for (var j = 0; j < result.length; j++) {
        result[j].categoryName = result[j].categoryName ? result[j].categoryName[request.headers.language] : "";
        result[j].description = result[j].description ? result[j].description[request.headers.language] : "";
        delete result[j]._id;
        delete result[j].visibility;
        delete result[j].seqID;
        let subCats = [];
        for (var s = 0; s < result[j].subCatsToShow[0].length; s++) {
          for (var k = 0; k < result[j].subCategories.length; k++) {
            if (result[j].subCategories[k].visibility == 1 && result[j].subCatsToShow[0][s].toString() == result[j].subCategories[k]._id.toString()) { // deleted sub category check
              result[j].subCategories[k].subCategoryName = result[j].subCategories[k].subCategoryName ? result[j].subCategories[k].subCategoryName[request.headers.language] : "";
              result[j].subCategories[k].description = result[j].subCategories[k].subCategoryDesc ? result[j].subCategories[k].subCategoryDesc[request.headers.language] : "";
              result[j].subCategories[k].subCategoryId = result[j].subCategories[k]._id ? result[j].subCategories[k]._id : "";
              delete result[j].subCategories[k]._id;
              delete result[j].subCategories[k].name;
              delete result[j].subCategories[k].categoryId;
              delete result[j].subCategories[k].seqId;
              delete result[j].subCategories[k].visibility;
              delete result[j].subCategories[k].subCategoryDesc;
              subCats.push(result[j].subCategories[k]);
            }
          }
        }
        result[j].subCategories = subCats;
        delete result[j].secondCategory;
        delete result[j].subCatsToShow;
      }
    }
    return reply({
      // message: Joi.any().default(i18n.__('stores']['200'][request.headers.language],
      message: request.i18n.__('stores')['200'],
      data: result
    }).code(200);
  });
}
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
* @param {integer} 1 - preferred store with categories, sub categories; 2 - all stores belonging to that zone  
*/
const subsubCatsHandlerOLD = (request, reply) => {
  request.params.latitude = request.params.latitude ? request.params.latitude : 0;
  request.params.longitude = request.params.longitude ? request.params.longitude : 0;
  request.params.zoneId = request.params.zoneId ? request.params.zoneId : 0;
  // request.headers.language = "en"; // remove in last


  readStore(request.params.storeId).then(store => {
    let cond = {
      visibility: 1, subCatId: new ObjectId(request.params.subCategoryId), catId: new ObjectId(request.params.categoryId)
    }
    thirdCategory.getByCatSubcatId(cond, (err, subSubCats) => {
      if (err) {
        logger.error('Error occurred during get producst home page(getZonalCategoriesById): ' + JSON.stringify(err));
        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
      }
      let newSubCats = []
      if (subSubCats.length > 0) {

        for (var j = 0; j < subSubCats.length; j++) {
          subSubCats[j].subSubCategoryName = subSubCats[j].subSubCategoryName ? subSubCats[j].subSubCategoryName[request.headers.language] : "";
          subSubCats[j].description = subSubCats[j].subSubCategoryDesc ? subSubCats[j].subSubCategoryDesc[request.headers.language] : "";
          subSubCats[j].categoryId = subSubCats[j].categoryId ? subSubCats[j].categoryId.toString() : "";
          subSubCats[j].subSubCategoryId = subSubCats[j]._id ? subSubCats[j]._id.toString() : "";
          delete subSubCats[j]._id;
          delete subSubCats[j].name;
          //   delete subSubCats[j].subSubCategoryName;
          delete subSubCats[j].subSubCategoryDesc;
          store.subSubCatWiseProductCount = store.subSubCatWiseProductCount ? store.subSubCatWiseProductCount : []
          for (let i = 0; i < store.subSubCatWiseProductCount.length; i++) {
            if (subSubCats[j].subSubCategoryId == store.subSubCatWiseProductCount[i].thirdCategoryId.toString() && store.subSubCatWiseProductCount[i].count > 0) {
              newSubCats.push(subSubCats[j])
            }
          }
        }
      }
      return reply({
        // message: Joi.any().default(i18n.__('stores']['200'][request.headers.language],
        message: request.i18n.__('stores')['200'],
        data: newSubCats
      }).code(200);
    });

  }).catch(e => {
    logger.error('err during get fare(catch) ' + JSON.stringify(e));
    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
  });
}
const subsubCatsHandler = (request, reply) => {
  request.params.latitude = request.params.latitude ? request.params.latitude : 0;
  request.params.longitude = request.params.longitude ? request.params.longitude : 0;
  request.params.zoneId = request.params.zoneId ? request.params.zoneId : 0;
  // request.headers.language = "en"; // remove in last


  readStore(request.params.storeId).then(store => {
    let thirdCategoryArray = [];
    if (store.thirdCategory) {
      for (var s = 0; s < store.thirdCategory.length; s++) {
        let thirdCategoryData = {};
        if (request.params.categoryId.toString() == store.thirdCategory[s].categoryId.toString() && request.params.subCategoryId.toString() == store.thirdCategory[s].subCategoryId.toString()) {
          thirdCategoryData["subSubCategoryName"] = store.thirdCategory[s].subSubCategoryName ? store.thirdCategory[s].subSubCategoryName[request.headers.language] : "";
          // thirdCategoryData["description"] = store.thirdCategory[s].subCategoryName ? store.thirdCategory[s].subCategoryName[request.headers.language] : "";
          thirdCategoryData["description"] = "";
          thirdCategoryData["categoryId"] = store.thirdCategory[s].categoryId ? store.thirdCategory[s].categoryId : "";
          thirdCategoryData["subSubCategoryId"] = store.thirdCategory[s].id ? store.thirdCategory[s].id : "";
          thirdCategoryArray.push(thirdCategoryData);
        }
      }
    }
    return reply({
      // message: Joi.any().default(i18n.__('stores']['200'][request.headers.language],
      message: request.i18n.__('stores')['200'],
      data: thirdCategoryArray
    }).code(200);

  }).catch(e => {
    logger.error('err during get fare(catch) ' + JSON.stringify(e));
    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
  });
}

const readStore = (itemId) => {
  return new Promise((resolve, reject) => {
    let zoneCond = { _id: new ObjectId(itemId) };
    stores.isExistsWithId(zoneCond, (err, store) => {
      if (err) {
        reject(err);
      }
      resolve(store);
    });
  });
}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
  // zoneId: Joi.string().required().description('zone id').default("5a044c10e0dc3f15e91273d3"),
  storeId: Joi.string().required().description('if store id id"5a704f24e0dc3f34c350b22d" else 0').default("5a704f24e0dc3f34c350b22d"),
  //  latitude: Joi.number().required().description('Latitude'),
  // longitude: Joi.number().required().description('Longitude')
}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const subSubCatsValidator = {
  // zoneId: Joi.string().required().description('zone id').default("5a044c10e0dc3f15e91273d3"),
  storeId: Joi.string().required().description('if store id id"5a704f24e0dc3f34c350b22d"  ').default("5a704f24e0dc3f34c350b22d"),
  categoryId: Joi.string().required().description('if  id"5a704f24e0dc3f34c350b22d"  ').default("5a704f24e0dc3f34c350b22d"),
  subCategoryId: Joi.string().required().description('if  id"5a704f24e0dc3f34c350b22d').default("5a704f24e0dc3f34c350b22d"),
  //  latitude: Joi.number().required().description('Latitude'),
  // longitude: Joi.number().required().description('Longitude')
}
/**
* A module that exports customer get categories handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = { subsubCatsHandler, subSubCatsValidator, handler, validator }