'use strict'


const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const async = require('async');
const errorMsg = require('../../../../../locales');
const storeAddOn = require('../../../../../models/storeAddOn');
const childProducts = require('../../../../../models/childProducts');
const childProductsElastic = require('../../../../../models/childProductsElastic');

const addOnsObj = Joi.object({
    id: Joi.string().required().description('id is required'),
    name: Joi.object({
        en: Joi.string().required().description('en is required')
    }).required().unknown(),
    // storeAddOnId: Joi.any().description('storeAddOnId is required'),
    price: Joi.string().required().description('price is required')
}).required();

const validator = Joi.object({
    addOnId: Joi.string().required().description('addon id is required'),
    storeId: Joi.string().required().description('storeId id is required'),

    name: Joi.object({
        en: Joi.string().required().description('name in en is required')
    }).required().unknown(),

    description: Joi.object({
        en: Joi.string().allow("").description('description in en is required')
    }).required().unknown(),

    mandatory: Joi.number().required().description('mandatory is required'),
    addOnLimit: Joi.string().required().description('addOnLimit is required'),
    minimumLimit: Joi.number().required().description('minimumLimit is required'),
    maximumLimit: Joi.number().required().description('maximumLimit is required'),
    multiple: Joi.number().required().description('multipal is required'),
    addOns: Joi.array().items(addOnsObj).required()
}).required();


const handlerOld = (request, reply) => {
    const dbErrResponse = request.i18n.__('genericErrMsg')['500'];

    var updObj = Object.assign({}, request.payload);

    delete (updObj['addOnId']);
    delete (updObj['storeId']);



    var updObj2 = {};
    Object.keys(updObj).forEach(function (val) {
        updObj2["addOns.$." + val] = updObj[val]
    });
    const setStoreAddOnData = () => {
        return new Promise((resolve, reject) => {
            var condition = {
                query: { _id: new ObjectID(request.payload.addOnId), storeId: request.payload.storeId },
                data: {
                    $set: updObj
                }
            };
            storeAddOn.updateById(condition, (err, result) => {
                if (err)
                    return reject(dbErrResponse);
                else
                    return resolve(true);
            });
        });
    }

    const setChildAddOnData = () => {
        return new Promise((resolve, reject) => {
            var condition = {
                // query: { "addOns.id": request.payload.addOnId, "storeId": new ObjectID(request.payload.storeId) },
                query: { "addOns.id": request.payload.addOnId, "addOns.storeId": request.payload.storeId },
                data: {
                    $set: updObj2
                }
            };
            childProducts.updateById(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                }
                else {
                    return resolve(true);
                }

            });
        });
    }
    // const setChildAddOnDataElastic = () => {
    //     return new Promise((resolve, reject) => {

    //         childProductsElastic.Update(request.payload.addOnId, updObj, (err, resultelastic) => {
    //             if (err)
    //                 return reject(dbErrResponse);
    //             else
    //                 return resolve(true);
    //         })
    //     });
    // }

    setStoreAddOnData()
        .then(setChildAddOnData)
        // .then(setChildAddOnDataElastic)
        .then(data => {
            return reply({ message: request.i18n.__('genericErrMsg')['200'] }).code(200);
        }).catch(e => {
            return reply({ message: e.message }).code(e.code);
        });


}

const handler = (request, reply) => {
    const dbErrResponse = request.i18n.__('genericErrMsg')['500'];

    var updObj = Object.assign({}, request.payload);

    delete (updObj['addOnId']);
    delete (updObj['storeId']);
    let productData = [];

    let updatedProductData = [];

    var updObj2 = {};
    Object.keys(updObj).forEach(function (val) {
        updObj2["addOns.$." + val] = updObj[val]
    });
    const setStoreAddOnData = () => {
        return new Promise((resolve, reject) => {
            var condition = {
                query: { _id: new ObjectID(request.payload.addOnId), storeId: request.payload.storeId },
                data: {
                    $set: updObj
                }
            };
            storeAddOn.updateById(condition, (err, result) => {
                if (err)
                    return reject(dbErrResponse);
                else
                    return resolve(true);
            });
        });
    }

    const getProducts = () => {
        return new Promise((resolve, reject) => {
            var condition = {
                storeId: new ObjectID(request.payload.storeId),
                "units.addOns.unitAddOnId": request.payload.addOnId
            };
            childProducts.readAll(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {
                    productData = result;
                    return resolve(true);
                }
            });
        });
    }
    const setAddOnDataForProduct = () => {
        const addOnsGroupMap = (addOnsGroups) => new Promise((resolve, reject) => {
            return Promise.all(addOnsGroups.map(addOnsGroup => new Promise((resolve, reject) => {
                async.eachSeries(request.payload.addOns, (item, callback) => {
                    if (addOnsGroup.id == item.id) {
                        addOnsGroup.name = item.name;
                        callback();
                    } else {
                        callback();
                    }
                }, function (error2) {
                    return resolve(addOnsGroup);
                })
                // return addOnsGroup;
            }))).then(function (addOnsGroupRes) {
                return resolve(addOnsGroupRes || []);
            }).catch(function (err) {
                return reject(err);
            });
        });

        const addOnsMap = (addOns) => new Promise((resolve, reject) => {
            return Promise.all(addOns.map(async addOn => {
                if (request.payload.addOnId == addOn.unitAddOnId) {
                    addOn.name = request.payload.name;
                    addOn.description = request.payload.description;
                    addOn.mandatory = request.payload.mandatory;
                    addOn.minimumLimit = request.payload.minimumLimit;
                    addOn.maximumLimit = request.payload.maximumLimit;
                    addOn.multiple = request.payload.multiple;
                    addOn.status = request.payload.status;
                    addOn.addOnLimit = request.payload.addOnLimit;
                }
                addOn.addOns = await addOnsGroupMap(addOn.addOns);
                return addOn;
            })).then(function (addOnsRes) {
                return resolve(addOnsRes || []);
            }).catch(function (err) {
                return reject(err);
            });
        });

        const unitMap = (units) => new Promise((resolve, reject) => {
            return Promise.all(units.map(async unit => {
                unit.addOns = await addOnsMap(unit.addOns);
                return unit;
            })).then(function (unitsRes) {
                return resolve(unitsRes || []);
            }).catch(function (err) {
                return reject(err);
            });
        });

        return new Promise((resolve, reject) => {
            return Promise.all(productData.map(async product => {
                product.units = await unitMap(product.units);
                return product;
            })).then(function (productRes) {
                updatedProductData = productRes;
                return resolve(true);
            }).catch(function (err) {
                console.log(err);
                return reject(dbErrResponse);
            });
        });
    }
    const updateProductData = () => {
        return new Promise((resolve, reject) => {
            let updObj = {};
            // console.log("updatedProductData", JSON.stringify(updatedProductData))
            async.each(updatedProductData, (item, callback) => {
                updObj = Object.assign({}, item);
                delete item._id;
                // console.log("item", JSON.stringify(item))
                childProducts.update({
                    q: { "_id": updObj._id }, data: {
                        $set: item
                    }
                }, (err, updateObj) => {
                    if (err) {
                        return reject(err)
                    } else {
                        updObj.storeId = String(updObj.storeId);
                        updObj.brand = String(updObj.brand);
                        item._id = String(item._id);
                        delete updObj._id;
                        childProductsElastic.Update(item._id, updObj, (err, resultelastic) => {
                            if (err) {
                                console.log("Err,", err)
                                callback();
                            } else {
                                callback();
                            }
                        });

                    }
                });
            }, function (err) {
                if (err) {
                    return reject(err)
                } else {
                    return resolve(true)
                }

            });

        });
    }
    getProducts()
        .then(setStoreAddOnData)
        .then(setAddOnDataForProduct)
        .then(updateProductData)
        .then(data => {
            return reply({ message: request.i18n.__('genericErrMsg')['200'] }).code(200);
        }).catch(e => {
            console.log("e", e)
            return reply({ message: e.message }).code(e.code);
        });


}
module.exports = { handler, validator }