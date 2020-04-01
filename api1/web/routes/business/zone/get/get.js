'use strict'
const zones = require('../../../../../models/zones');
const city = require('../../../../../models/cities');
const cartModel = require('../../../../../models/cart');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const async = require('async');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    city.getAllCities({}, (err, city) => {
        if (err) {
            logger.error('No response: ' + JSON.stringify(err));
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        }

        var cities = [];
        async.forEach(city, (item, callbackloop) => {
            async.forEach(item.cities, (countryData, callBackLoop) => {
                cities.push({
                    "cityId": countryData.cityId.toString(),
                    "cityName": countryData.cityName,
                    "currency": countryData.currency
                });
                return callBackLoop(null);
            })
            return callbackloop(null);
        }, (loopErr) => {
            return reply({
                message:  request.i18n.__('getData')['200'] ,
                data: cities
            }).code(200);
        });
    });
}
/** 
* @function
* @name handlerCityWiseZone 
* @return {object} Reply to the user.
*/
const handlerCityWiseZone = (request, reply) => {
    zones.readAllByCity({ city_ID: request.params.cityId, status: 1, }, (err, data) => {
        logger.error("+++++++++++++++++++++++++++++", data);

        if (err) {
            logger.error('Error occurred duringget stores (inZone): ' + JSON.stringify(err));
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        if (data.length > 0) {
            // for (let i = 0; i < data.length; i++) {
            //     data[i].cityId = data[i].city_ID;
            //     delete data[i].city_ID;
            // }
            return reply({ message: request.i18n.__('supportFAQ')['200'] , data: data }).code(200);
        } else
            return reply({ message:request.i18n.__('checkOperationZone')['400']   }).code(400);
    });
}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {

    latitude: Joi.number().required().description('Latitude'),
    longitude: Joi.number().required().description('Longitude'),
}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validatorCityWise = {
    cityId: Joi.string().required().description('cityId').default()
}
/**
* A module that exports customer send otp handler, send otp validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, handlerCityWiseZone, validator, validatorCityWise }