'use strict'
const storeList = require('../../../../../models/storeList');
const store = require('../../../../../models/stores');
const storeElastic = require('../../../../../models/storeElastic');
const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const webSocket = require('../../../../../library/websocket/websocket');
/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (request, reply) => {
    // request.headers.language = "en"; // remove in last
    storeList.isExists({ userId: request.auth.credentials._id.toString() }, (err, data) => {
        if (err) {
            logger.error('Error occurred while checking storeList : ' + err);
            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
        }
        if (data) {
            storeList.isExistsWithStore({ userId: request.auth.credentials._id.toString(), storeId: request.payload.storeId }, (err, isStore) => {
                if (err) {
                    logger.error('Error occurred while checking storeList : ' + err);
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                if (isStore.length > 0) {
                    if (parseInt(isStore[0].storeList.status) == 0) {
                        storeList.pullStores({ storeId: request.payload.storeId, userId: request.auth.credentials._id.toString(), createdBy: "customer" }, (err, data) => {
                            if (err) {
                                logger.error('Error occurred while updating to storeList : ' + err);
                                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                            } else
                                store.pullFavorites({ userId: request.auth.credentials._id.toString(), storeId: request.payload.storeId, createdBy: "customer" }, (err, data) => {
                                    var updObj = {
                                        favoritesHistory: data.value.favoritesHistory,
                                        favorites: data.value.favorites,
                                        favoriteCount: data.value.favoriteCount,
                                    }
                                    storeElastic.Update(data.value._id.toString(), updObj, (err, resultelastic) => {
                                        if (err) {
                                            logger.error('Error occurred while adding to storeList Elastic : ' + err);
                                            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                                        }
                                        return reply({ message: request.i18n.__('storeList')['202'] }).code(202);
                                    })
                                    // return reply({ message: request.i18n.__('storeList')['202'] }).code(202);
                                });
                        });
                    } else {
                        storeList.pushStores({ userId: request.auth.credentials._id.toString(), storeId: request.payload.storeId, createdBy: "customer" }, (err, res) => {
                            if (err) {
                                logger.error('Error occurred while adding to storeList : ' + err);
                                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                            }
                            else {
                                store.pushFavorites({ userId: request.auth.credentials._id.toString(), storeId: request.payload.storeId, createdBy: "customer" }, (err, data) => {
                                    var updObj = {
                                        favoritesHistory: data.value.favoritesHistory,
                                        favorites: data.value.favorites,
                                        favoriteCount: data.value.favoriteCount,
                                    }
                                    storeElastic.Update(data.value._id.toString(), updObj, (err, resultelastic) => {
                                        if (err) {
                                            logger.error('Error occurred while adding to storeList Elastic : ' + err);
                                            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                                        }
                                        return reply({ message: request.i18n.__('storeList')['201'] }).code(201);
                                    })

                                });
                            }
                        });
                    }
                } else {
                    storeList.pushStore({ userId: request.auth.credentials._id.toString(), storeId: request.payload.storeId, createdBy: "customer" }, (err, res) => {
                        if (err) {
                            logger.error('Error occurred while adding to storeList : ' + err);
                            return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                        }
                        else {
                            store.pushFavorites({ userId: request.auth.credentials._id.toString(), storeId: request.payload.storeId, createdBy: "customer" }, (err, data) => {
                                var updObj = {
                                    favoritesHistory: data.value.favoritesHistory,
                                    favorites: data.value.favorites,
                                    favoriteCount: data.value.favoriteCount,
                                }
                                storeElastic.Update(data.value._id.toString(), updObj, (err, resultelastic) => {
                                    if (err) {
                                        logger.error('Error occurred while adding to storeList Elastic : ' + err);
                                        return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                                    }
                                    return reply({ message: request.i18n.__('storeList')['201'] }).code(201);
                                })
                                // return reply({ message: request.i18n.__('storeList')['201'] }).code(201);
                            });
                        }
                    });
                }



            });
        } else {
            storeList.post({ userId: request.auth.credentials._id.toString(), storeId: request.payload.storeId, createdBy: "customer" }, (err, res) => {
                if (err) {
                    logger.error('Error occurred while adding to storeList : ' + err);
                    return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                }
                else {
                    store.pushFavorites({ userId: request.auth.credentials._id.toString(), storeId: request.payload.storeId, createdBy: "customer" }, (err, data) => {
                        var updObj = {
                            favoritesHistory: data.value.favoritesHistory,
                            favorites: data.value.favorites,
                            favoriteCount: data.value.favoriteCount,
                        }
                        storeElastic.Update(data.value._id.toString(), updObj, (err, resultelastic) => {
                            if (err) {
                                logger.error('Error occurred while adding to storeList Elastic : ' + err);
                                return reply({ message: request.i18n.__('genericErrMsg')['500'] }).code(500);
                            }
                            return reply({ message: request.i18n.__('storeList')['201'] }).code(201);
                        })
                        // return reply({ message: request.i18n.__('storeList')['201'] }).code(201);
                    });
                }
            });
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
    storeId: Joi.string().required().description('string')
}
/**
* A module that exports add cart handler, add cart validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator }