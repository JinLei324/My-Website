'use strict'

var zonesDeliverySlots = require('../../../../models/zonesDeliverySlots');
const error = require('../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const appConfig = require('../../../../models/appConfig');
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const Async = require('async');

const handler = (request, reply) => {
    let responseData = {};
    let appConfigData = {};


    let getAppConfigData = () => {
        return new Promise((resolve, reject) => {
            appConfig.get({}, (err, appConfig) => {
                if (err) {
                    reject({ code: 500 });
                }
                if (appConfig) {
                    appConfigData = appConfig.laundry;
                } else {
                    appConfigData = {};
                }
                resolve(appConfigData);
            });
        });
    };
    getAppConfigData().then(appConfigData => {
        let buffertime = 5 * 24;
        let nextfivedays = moment().add(buffertime, 'hours').unix();

        let nowtime = moment().unix();

        let paramsData = [{
            $match: {
                zoneId: request.params.zoneId,
                endDateTimestamp: { $gte: nowtime, $lte: nextfivedays }
            }
        },
        {
            $group: {
                _id: { "date": "$date" },
                "slots": {
                    $addToSet: {
                        "startTime": "$startTime",
                        "endTime": "$endTime",
                        "startDateTimestamp": "$startDateTimestamp",
                        "endDateTimestamp": "$endDateTimestamp",
                        "startDateISO": "$startDateISO",
                        "endDateISO": "$endDateISO",
                        "_id": "$_id"
                    }
                }

            }
        },
        {
            $sort: { _id: 1 }
        }

        ];
        zonesDeliverySlots.get(paramsData, (err, resultData1) => {
            if (err) {
                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
            }
            return reply({ message: request.i18n.__('products')['200'], data: resultData1 }).code(200);
        })

    }).catch(e => {
        logger.error("Customer ride live booking API error =>", e)
        return reply({
            message: e.message
        }).code(e.code);
    });


}

const validator = {
    zoneId: Joi.string().required().description('zoneId')
}

module.exports = { handler, validator }