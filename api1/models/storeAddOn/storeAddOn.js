'use strict'

const logger = require('winston');

const db = require('../../library/mongodb');


let tableName = 'storeAddOns';

function updateById(queryObj, callback) {
    db.get().collection(tableName).findOneAndUpdate(queryObj.query, queryObj.data, ((err, result) => {
        return callback(err, result);
    }));
}

const deleteItem = (params, callback) => {
    db.get().collection(tableName)
        .remove(params, (err, result) => {
            return callback(err, result);
        })
}

module.exports = {
    updateById,
    deleteItem
};
