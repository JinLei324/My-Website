'use strict'
const stores = require('../../../../../models/stores');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const async = require('async');
const ObjectId = require('mongodb').ObjectID;
const googleDistance = require('../../../../commonModels/googleApi');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
* @param {integer} 1 - preferred store with categories, sub categories; 2 - all stores belonging to that zone  
*/
const handler = (request, reply) => {
  //  request.headers.language = "en"; // remove in last
    stores.getAllById({ id: request.params.zoneId, catId: request.params.categoryId, lat: request.params.latitude, long: request.params.longitude }, (err, data) => {
        if (err) {
            logger.error('Error occurred during get stores (getAllById): ' + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language] }).code(500);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        if (data.length > 0) {
            for (var j = 0; j < data.length; j++) {
                data[j].businessImage = data[j].profileLogos ? data[j].profileLogos.logoImage : "";
                data[j].businessZoneId = data[j].businessZoneId ? data[j].businessZoneId : "";
                data[j].businessRating = data[j].averageRating ? data[j].averageRating : 0;
                data[j].storeType = data[j].storeType ? parseInt(data[j].storeType) : 0;
                data[j].storeTypeMsg = data[j].storeTypeMsg ? data[j].storeTypeMsg :'';
                data[j].businessName = data[j].sName ? data[j].sName[request.headers.language] : "";
                data[j].description = data[j].storedescription ? data[j].storedescription[request.headers.language] : "";
                data[j].businessAddress = data[j].storeAddr ? data[j].storeAddr  : "";
                data[j].freeDeliveryAbove = data[j].freeDeliveryAbove ? data[j].freeDeliveryAbove : "";
                data[j].minimumOrder = data[j].minimumOrder ? data[j].minimumOrder : "";
                data[j].businessId = data[j]._id;
                data[j].costForTwo = data[j].costForTwo ? data[j].costForTwo : "";
                delete data[j]._id;
                delete data[j].name;
                delete data[j].profileLogos;
                delete data[j].storeaddress;
                delete data[j].sName;
                delete data[j].storedescription;
            }
            async.each(data, (item, callback) => {
                item.distanceMiles = 0;
                item.distanceKm = 0;
                item.estimatedTime = 0;
                let dest = item.coordinates.latitude + ',' + item.coordinates.longitude;
                let origin = request.params.latitude + ',' + request.params.longitude;
                googleDistance.calculateDistance(origin, dest).then(distanceMeasured => {
                    let result = distanceMeasured.distance;
                    result *= 0.000621371192;
                    distanceMeasured.distanceMiles = result;
                    item.distanceMiles = result;
                    item.distanceKm = distanceMeasured.distance/1000;
                    item.estimatedTime = distanceMeasured.durationMins;
                    delete item.coordinates;
                    callback();
                }).catch((err) => {
                    callback();
                    logger.error('Error occurred during view all stores get (calculateDistance): ' + JSON.stringify(err));
                    // return reply({ message: error['stores']['200'][request.headers.language], data: data }).code(200);
                    // return reply({ message: request.i18n.__('stores')['200'], data: data }).code(200);
                });
            }, function (err) {
                // return reply({ message: error['stores']['200'][request.headers.language], data: data }).code(200);
                return reply({ message: request.i18n.__('stores')['200'], data: data }).code(200);
            });




        }
        else {
            // return reply({ message: error['stores']['404'][request.headers.language] }).code(404);
            return reply({ message: request.i18n.__('stores')['404'] }).code(404);
        }
    });

}

/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    zoneId: Joi.string().required().description('zone id').default("5a044c10e0dc3f15e91273d3"),
    categoryId: Joi.string().required().description('if category wise 59d34bcfe0dc3f256e1e32ae else 0').default("0"),
    latitude: Joi.number().required().description('Latitude'),
    longitude: Joi.number().required().description('Longitude')
}
/**
* A module that exports business get store handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }