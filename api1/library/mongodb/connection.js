'use strict'
/** 
 * This const requires the mongo url
 * @const
 * @requires module:config 
 */
const url = require('../../config/components/mongodb');
const logger = require('winston');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

var state = { db: null };

/**
 * Method to connect to the mongodb
 * @param {*} url
 * @returns connection object
 */
exports.connect = (callback) => {

    if (state.db) return callback();

    mongodb.connect(url, (err, connection) => {
        if (err) {
            logger.error(`MongoDB error connecting`, err.message);

            process.exit(0);
            return callback(err);
        }

        state.db = connection;//assign the connection object

        logger.warn(`MongoDB connection successfully established`);

        return callback();
    })
}

/**
 * Method to get the connection object of the mongodb
 * @returns db object
 */
exports.get = () => { return state.db }

/**
 * Method to close the mongodb connection
 */
exports.close = (callback) => {

    if (state.db) {
        state.db.close((err, result) => {
            state.db = null;
            state.mode = null;
            return callback(err);
        })
    }
}