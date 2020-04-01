'use strict'
const joi = require('joi')
const db = require('../../library/mongodb');
const moment = require('moment')
const tableName = 'zones'
const ObjectID = require('mongodb').ObjectID;

const getZoneDetailsById = (zoneIds, callBack) => {
    db.get().collection(tableName)
        .find({
               "_id": {
                '$in': zoneIds
            },
            }).toArray((err, result) => {
            return callBack(err, result);
        });
}



module.exports = {
    getZoneDetailsById
}