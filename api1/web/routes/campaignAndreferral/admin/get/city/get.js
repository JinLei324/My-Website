require("moment");
const Joi = require("joi");
const async = require("async");
const logger = require('winston');
const Promise = require('promise');
const ObjectID = require('mongodb').ObjectID;
const city = require('../../../../../../models/cities/cities');

const i18n = require('../../../../../../locales/locales');
var handler = (request, reply) => {
    city.getAllCities({ "isDeleted": { "$ne": true } }, (err, city) => {
        if (err) {
            // logger.error('No response: ' + JSON.stringify(err));
            return reply({
                message: Joi.any().default(i18n.__('genericErrMsg')['500'])
            }).code(500);
        }

        var cities = [];
        async.forEach(city, (item, callbackloop) => {
            async.forEach(item.cities, (countryData, callBackLoop) => {
                if (countryData.isDeleted == false) {
                    cities.push({
                        "id": countryData.cityId.toString(),
                        "cityName": countryData.cityName,
                        "currency": countryData.currency,
                        "country": item._id.toString(),
                    });
                }

                return callBackLoop(null);
            })
            return callbackloop(null);
        }, (loopErr) => {
            return reply({
                message: request.i18n.__('getData')['200'],
                data: cities
            }).code(200);
        });
    });
}




let cityDetailsByCityIdsValidator = {

    cityIds: Joi.any().required().description('Mandatory Field.')
}

let cityDetailsByCityIdsHandler = (request, reply) => {

    var cityIds = request.params.cityIds;

    var cityIdsArray = cityIds.split(",");

    var cityIdsMongoIds = [];

    cityIdsArray.forEach(function (entry) {

        var cityIdsMongoId = new ObjectID(entry);

        cityIdsMongoIds.push(cityIdsMongoId);
    });

    // logger.error("mongo ids");

    // logger.error(cityIdsMongoIds);

    city.cityDetailsByCityId(cityIdsMongoIds, (cityDetailsError, cityDetailsResponse) => {

        // logger.error(cityDetailsError);

        if (cityDetailsError) {

            return reply({
                message: Joi.any().default(i18n.__('genericErrMsg')['500'])
            }).code(500);

        } else {
            return reply({
                message: Joi.any().default(i18n.__('getData')['200']),
                data: cityDetailsResponse
            }).code(200);
        }
    });
}

let response = {
    status: {
        200: {
            message: Joi.any().default(i18n.__('getData')['200'])
        },
        500: {
            message: Joi.any().default(i18n.__('genericErrMsg')['500'])
        }
    }
}

// export handler and validator
module.exports = {
    // getUnlockedCodeCountByCampaignIdHandler,
    // getUnlockedCodeCountByCampaignIdValidator,
    // getClaimedDataByCampaignIdHandler,
    // getClaimedDataByCampaignIdValidator,
    handler,
    cityDetailsByCityIdsValidator,
    cityDetailsByCityIdsHandler,
    // response




}