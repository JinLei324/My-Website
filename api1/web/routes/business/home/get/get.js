'use strict'
 
const Joi = require('joi'); 
 
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    zoneId: Joi.string().required().description('zone id. Example : 5b7bf3fbf801683f1b14b3f6').default("5b7bf3fbf801683f1b14b3f6"),
    storeId: Joi.string().required().description('if store available : id"5a704f24e0dc3f34c350b22d" else 0').default("5a704f24e0dc3f34c350b22d"),
    stroeCategoryId : Joi.string().required().description("Store category id").default("5b7c1513f801685b6701c344"),
    storeType : Joi.string().required().description("Store type").default("2"),
    latitude: Joi.number().required().description('Latitude').default("13.0286"),
    longitude: Joi.number().required().description('Longitude').default("77.5895")

}
/**
* A module that exports customer get categories handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = {   validator }