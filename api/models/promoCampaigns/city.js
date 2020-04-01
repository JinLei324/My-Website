'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'cities'
const ObjectID = require('mongodb').ObjectID;
const logger = require('winston');



const cityDetailsByCityId = (cityIds, callBack) => {
    logger.error("checking error details  ------------------------------- ");
    logger.error(typeof(cityIds))
    

    db.get().collection(tableName)
        .aggregate(
            [{
                "$match": {
                    "cities.cityId": {$in:cityIds}
                }

            }, {
                "$unwind": "$cities"
            }, {
                "$match": {
                    "cities.cityId": {$in:cityIds}
                }
            }, {
                "$project": {
                    "_id": 1,
                    "cities": 1,
                    "country":1

                }
            }
            ]).toArray((err, result) => {
                logger.error(err)
                return callBack(err, result);
            });
        }


        const cityDetails = (cityId, callBack) => {
            db.get().collection(tableName)
            .aggregate(
            [{
                "$match": {
                    "cities.cityId": new ObjectID(cityId)
                }

            }, {
                "$unwind": "$cities"
            }, {
                "$match": {
                    "cities.cityId": new ObjectID(cityId)
                }
            }, {
                "$project": {
                    "_id": 1,
                    "cities": 1,
                    "country":1

                }
            }
            ]).toArray((err, result) => {
                logger.error(err)
                return callBack(err, result);
            });
        
    }        

const getAllCities = (params, callback) => {
    db.get().collection(tableName).find({})
        .toArray((err, result) => {
            return callback(err, result);
        });
}



module.exports = {
    cityDetailsByCityId,
    getAllCities,
    cityDetails
}