'use strict'
const stores = require('../../../models/stores');
const zone = require('../../../models/zones');
const storeElastic = require('../../../models/storeElastic');
const storeCategory = require('../../../models/storeCategory');
const storeList = require('../../../models/storeList');
const error = require('../../../statusMessages/responseMessage'); // response messages based on language 
const config = process.env;
const googleDistance = require('../../commonModels/googleApi');
const workingHour = require('../../commonModels/workingHour');
const Joi = require('joi');
const logger = require('winston');
const async = require('async');
const ObjectId = require('mongodb').ObjectID;
const moment = require('moment');
const Async = require('async');


/*
Validator
*/

const validator = {
    type: Joi.number().required().description('store type'),
    cityId: Joi.string().required().description("City id")
};

let searchValidator = {
    categoryId: Joi.string().required().description('Category id'),
    search: Joi.string().description("search params"),
    lat: Joi.number().required().description("search params"),
    long: Joi.number().required().description("search params"),
    serviceType : Joi.number().required().description("1- Delivery 2 - Pick up ")

}

/** 
 * @function
 * @name storeCategoryHandlerById 
 * @return {object} Reply to the user.
 * @param {data} 0 - name, 1 - email, 2 - mobile
 */

const handler = (request, reply) => {

    var storeData = [];
    var favStoreData = [];

    var storeParams = {
        storeType: request.params.type,
        cityId: request.params.cityId
    }

    stores.getAllByStoreType(storeParams, (err, result) => {
        if (err) {
            logger.error('Error occurred during get categories (getStoreCategoriesById): ' + JSON.stringify(err));
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        }

        if (result.length > 0) {
            async.each(result, (item, callback) => {

                storeData.push({
                    storeName: item.sName[request.headers.language] ? item.sName[request.headers.language] : "",
                    storeId: item._id ? item._id.toString() : "",
                });
                callback()


            }, function(err) {

                return reply({
                    message: request.i18n.__('stores')['200'],
                    data: storeData
                }).code(200);
                // return reply({ message: request.i18n.__('stores')['200'], data: storeData }).code(200);
            });
        } else {
            return reply({
                message: request.i18n.__('stores')['404']
            }).code(404);
        }
    });


    // })
}

const searchHandler = (request, reply) => {
       var storeData = [];
    var zoneData = [];


    // var storeParams = {
    //     storeType: request.params.type,
    //     cityId: request.params.cityId
    // }

    /*
    Get the zone details from lat long
    */

    let getZone = () => {
        
        return new Promise((resolve, reject) => {
            let cond = {
                'lat': parseFloat(request.params.lat),
                'long': parseFloat(request.params.long)
            };
            zone.inZone(cond, function(err, response) {
                
                if (err) {
                    
                    reject(err);
                } else {
                    
                    zoneData = response
                    resolve(zoneData);

                }
            });
        });
    };
    // Get the store from elastic using lat , long , cityId, zoneId


    let getStore = () => {
        
        return new Promise((resolve, reject) => {
            if(request.params.serviceType == 1){
                var cond = {};
                
                 cond = {
                    'name': request.params.search,
                    'categoryId': request.params.categoryId,
                    'zoneId': zoneData._id.toString(),
                    'lat': parseFloat(request.params.lat),
                    'long': parseFloat(request.params.long),
                    'serviceType' : request.params.serviceType
                    // 'storeIsOpen' : true
                };
            }else{
                
                 cond = {
                    'name': request.params.search,
                    'categoryId': request.params.categoryId,
                    'serviceType' : request.params.serviceType
                    // 'storeIsOpen' : true
                };
            }

            storeElastic.getAllNearestByNameSearch(cond,request.headers.language, function(err, storeData) {
                if (err) {
                    reject(err);
                } else {

                    if (storeData && storeData.length >0) {
                        var responseData = [];
                    Async.each(storeData, function (item, callback) {

                        var data = {
                            storeId :item._id,
                            storeName : item._source.sName[request.headers.language],
                            lat : item._source.coordinates.latitude,
                            long : item._source.coordinates.longitude,
                            storeIsOpen : item._source.storeIsOpen

                        }
                        responseData.push(data)
                    })
                        
                    }else{
                    reject(storeData);
                        
                    }
                    storeData = responseData
                    resolve(storeData);
                }
            });
        });
    }
if(request.params.serviceType == 1){
    
    getZone()
    .then(getStore)
    .then(data => {
        
        if (data) {
            return reply({
                message: request.i18n.__('stores')['200'],
                data: data
            }).code(200);

        }
    }).catch(e => {
        return reply({
            message: request.i18n.__('stores')['404']
        }).code(404);

    });

}else{
   getStore()
    .then(data => {
        if (data) {
            return reply({
                message: request.i18n.__('stores')['200'],
                data: data
            }).code(200);

        }
    }).catch(e => {
        return reply({
            message: request.i18n.__('stores')['404']
        }).code(404);

    });

}



    // stores.getAllByStoreType(storeParams, (err, result) => {
    //     if (err) {
    //         logger.error('Error occurred during get categories (getStoreCategoriesById): ' + JSON.stringify(err));
    //         return reply({
    //             message: request.i18n.__('genericErrMsg')['500']
    //         }).code(500);
    //     }

    //     if (result.length > 0) {
    //         async.each(result, (item, callback) => {

    //             storeData.push({
    //                 storeName: item.sName[request.headers.language] ? item.sName[request.headers.language] : "",
    //                 storeId: item._id ? item._id.toString() : "",
    //             });
    //             callback()


    //         }, function(err) {

    //             return reply({
    //                 message: request.i18n.__('stores')['200'],
    //                 data: storeData
    //             }).code(200);
    //             // return reply({ message: request.i18n.__('stores')['200'], data: storeData }).code(200);
    //         });
    //     } else {
    //         return reply({
    //             message: request.i18n.__('stores')['404']
    //         }).code(404);
    //     }
    // });


    // })
}



module.exports = {
    handler,
    validator,
    searchHandler,
    searchValidator


}