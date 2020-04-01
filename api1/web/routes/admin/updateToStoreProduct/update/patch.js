'use strict'


const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const async = require('async');
const errorMsg = require('../../../../../locales');
const storefirstCategory = require('../../../../../models/storeFirstCategory');
const storeSecondCategory = require('../../../../../models/storeSecondCategory');
const storeThirdCategory = require('../../../../../models/storeThirdCategory');
const brands = require('../../../../../models/brands');
const manufacturer = require('../../../../../models/manufacturer');

const childProducts = require('../../../../../models/childProducts');
const childProductsElastic = require('../../../../../models/childProductsElastic');

const stores = require('../../../../../models/stores');
const storeElastic = require('../../../../../models/storeElastic');

const validator = Joi.object({
    _id: Joi.string().required().description('id is required'),
    type: Joi.number().required().description('1: Store First Category <br/>  2 : Store Second Category   <br/>  3 : Store Third Categgory <br/>'),
    storeId: Joi.string().required().description('Store id is required')
}).required();



const handler = (request, reply) => {
    const dbErrResponse = request.i18n.__('genericErrMsg')['500'];
    let firstCategoryData = {};
    let secondCategoryData = {};
    let thirdCategoryData = {};
    let brandData = {};
    let manufacturerData = {};

    var conditionForProduct = {};
    var conditionForStore = {};
    const updateChildProductDataToElastic = () => {
        return new Promise((resolve, reject) => {

            let updObj = {};
            childProducts.readAll(conditionForProduct, (err, result) => {

                if (err) {
                    return reject(dbErrResponse);
                } else {
                    async.each(result, (item, callback) => {
                        updObj = Object.assign({}, item);
                        updObj.storeId = String(updObj.storeId);

                        item._id = item._id.toString();
                        delete updObj._id;
                        childProductsElastic.Update(item._id, updObj, (err, resultelastic) => {
                            if (err) {

                                callback('err');
                            } else
                                callback();
                        })
                    }, function (err) {
                        if (err) {


                            return reject(dbErrResponse);
                        } else {
                            return resolve(true);
                        }

                    });
                }
            });

        });
    }

    const updateChildProductDataToStoreElastic = () => {
        return new Promise((resolve, reject) => {

            let updObj = {};
            stores.readAll(conditionForStore, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {
                    async.each(result, (item, callback) => {
                        updObj = Object.assign({}, item);
                        updObj.storeId = String(updObj.storeId);
                        item._id = String(item._id);
                        delete updObj._id;
                        storeElastic.Update(item._id, updObj, (err, resultelastic) => {
                            if (err) {
                                callback('err');
                            } else
                                callback();
                        })
                    }, function (err) {
                        if (err) {

                            return reject(dbErrResponse);
                        } else {
                            return resolve(true);
                        }

                    });
                }
            });

        });
    }

    //First Category
    const getStoreFirstCategoryData = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                _id: new ObjectID(request.payload._id)
            };
            storefirstCategory.SelectOne(condition, (err, result) => {
                if (err)
                    return reject(dbErrResponse);
                else {
                    firstCategoryData = result;
                    return resolve(true);
                }
            });
        });
    }

    const setFirstCategoryData = () => {
        return new Promise((resolve, reject) => {
            if (firstCategoryData.status == 2) {
                var condition = {
                    query: {
                        "firstCategoryId": firstCategoryData._id.toString()
                    },
                    data: {
                        $set: {
                            "status": parseInt(2),
                            "firstCategoryName": firstCategoryData['categoryName']['en'],
                            "categoryName": firstCategoryData['name'],
                            "catName": firstCategoryData['categoryName'],
                            "description": firstCategoryData['description'],

                            // "status": firstCategoryData['status']
                        }
                    }
                };
            } else {
                var condition = {
                    query: {
                        "firstCategoryId": firstCategoryData._id.toString()
                    },
                    data: {
                        $set: {
                            "firstCategoryName": firstCategoryData['categoryName']['en'],
                            "categoryName": firstCategoryData['name'],
                            "catName": firstCategoryData['categoryName'],
                            // "description": firstCategoryData['description'],
                            "status": 1
                        }
                    }
                };
            }

            childProducts.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {


                    return resolve(true);
                }

            });
        });
    }

    const setFirstCategoryDataToStore = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                query: {
                    "firstCategory.id": new ObjectID(firstCategoryData._id.toString())
                },
                data: {
                    $set: {
                        "firstCategory.$.categoryName": firstCategoryData['categoryName'],
                        "firstCategory.$.imageUrl": firstCategoryData['imageUrl'],
                        "firstCategory.$.categoryDesc": firstCategoryData['categoryDesc'],
                        "firstCategory.$.status": firstCategoryData['status'],
                        "firstCategory.$.seqID": firstCategoryData['seqID']

                    }
                }
            };
            stores.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {
                    return resolve(true);
                }

            });
        });
    }

    // const setFirstCategoryDataToStore = () => {
    //     return new Promise((resolve, reject) => {

    //         var condition = {
    //             query: {
    //                 "firstCategoryId": firstCategoryData._id.toString()
    //             },
    //             data: {
    //                 $set: {
    //                     "firstCategoryName": firstCategoryData['categoryName']['en'],
    //                     "categoryName": firstCategoryData['name'],
    //                     "catName": firstCategoryData['categoryName']
    //                 }
    //             }
    //         };
    //         childProducts.updateMany(condition, (err, result) => {
    //             if (err) {
    //                 return reject(dbErrResponse);
    //             } else {
    //                 return resolve(true);
    //             }

    //         });
    //     });
    // }


    //Second Category
    const getStoreSecondCategoryData = () => {
        return new Promise((resolve, reject) => {
            var condition = {
                _id: new ObjectID(request.payload._id)
            };

            storeSecondCategory.SelectOne(condition, (err, result) => {
                if (err)
                    return reject(dbErrResponse);
                else {
                    secondCategoryData = result;
                    return resolve(true);
                }
            });
        });
    }

    const setSecondCategoryData = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                query: {
                    "secondCategoryId": secondCategoryData._id.toString()
                },
                data: {
                    $set: {
                        "secondCategoryName": secondCategoryData['subCategoryName']['en'],
                        "subCategoryName": secondCategoryData['name'],
                        "subCatName": secondCategoryData['subCategoryName'],

                        // "description": secondCategoryData['description'],
                        // "status": secondCategoryData['status']
                    }
                }
            };
            childProducts.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {
                    return resolve(true);
                }

            });
        });
    }
    const setSecondCategoryDataToStore = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                query: {
                    "secondCategory.id": new ObjectID(secondCategoryData._id.toString())
                },
                data: {
                    $set: {
                        "secondCategory.$.subCategoryName": secondCategoryData['subCategoryName'],
                        "secondCategory.$.imageUrl": secondCategoryData['imageUrl'],
                        "secondCategory.$.status": secondCategoryData['status'],
                        "secondCategory.$.description": secondCategoryData['description'],
                        "secondCategory.$.seqId": secondCategoryData['seqId'],
                    }
                }
            };
            stores.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {


                    return resolve(true);
                }

            });
        });
    }

    //Second Category
    const getStoreThirdCategoryData = () => {
        return new Promise((resolve, reject) => {
            var condition = {
                _id: new ObjectID(request.payload._id)
            };

            storeThirdCategory.SelectOne(condition, (err, result) => {
                if (err)
                    return reject(dbErrResponse);
                else {
                    thirdCategoryData = result;
                    return resolve(true);
                }
            });
        });
    }

    const setThirdCategoryData = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                query: {
                    "thirdCategory.id": thirdCategoryData._id.toString()
                },
                data: {
                    $set: {
                        "thirdCategoryName": thirdCategoryData['subSubCategoryName']['en'],
                        "subSubCategoryName": thirdCategoryData['name'],
                        "subSubCatName": thirdCategoryData['subSubCategoryName'],
                        // "description": thirdCategoryData['description'],
                        // "status": thirdCategoryData['status'],
                    }
                }
            };
            childProducts.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {
                    return resolve(true);
                }

            });
        });
    }

    const setThirdCategoryDataToStore = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                query: {
                    "thirdCategory.id": new ObjectID(thirdCategoryData._id.toString())
                },
                data: {
                    $set: {
                        "thirdCategory.$.subSubCategoryName": thirdCategoryData['subSubCategoryName'],
                        "thirdCategory.$.imageUrl": thirdCategoryData['imageUrl'],
                        "thirdCategory.$.description": thirdCategoryData['description'],
                        "thirdCategory.$.status": thirdCategoryData['status'],
                        "thirdCategory.$.seqID": thirdCategoryData['seqID'],

                    }
                }
            };
            stores.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {


                    return resolve(true);
                }

            });
        });
    }


    const setThirdCategoryDataStatus = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                q: {
                    "categoryId": new ObjectID(request.payload._id)
                },
                data: {
                    $set: {
                        "status": firstCategoryData['status']
                    }
                }
            };
            storeSecondCategory.update(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {
                    return resolve(true);
                }

            });
        });
    }

    // Update data to second category id
    const setSecondCategoryDataStatus = () => {
        return new Promise((resolve, reject) => {

            var condition = {
                q: {
                    "categoryId": new ObjectID(request.payload._id)
                },
                data: {
                    $set: {
                        "status": 2
                    }
                }
            };
            storeSecondCategory.update(condition, (err, result) => {

                if (err) {
                    return reject(dbErrResponse);
                } else {
                    return resolve(true);
                }

            });
        });
    }

    const updateProductStatus = () => {
        return new Promise((resolve, reject) => {

            if (firstCategoryData.status == 2) { //Delete
                var condition = {
                    query: {
                        "firstCategoryId": new ObjectID(request.payload._id)
                    },
                    data: {
                        $set: {
                            "status": 2
                        }
                    }
                };
            } else if (firstCategoryData.status == 1) {
                var condition = {
                    query: {
                        "firstCategoryId": new ObjectID(request.payload._id)
                    },
                    data: {
                        $set: {
                            "status": 1
                        }
                    }
                };

            }
            childProducts.updateMany(condition, (err, result) => {
                if (err) {
                    return reject(dbErrResponse);
                } else {
                    return resolve(true);
                }

            });
        });
    }

    // Update data to third category 

    switch (parseInt(request.payload.type)) {
        case 1:
            // firstCategory Id
            conditionForProduct = {
                firstCategoryId: request.payload._id
            };
            conditionForStore = {
                _id: new ObjectID(request.payload.storeId)
            }
            getStoreFirstCategoryData()
                .then(setFirstCategoryData)
                .then(setFirstCategoryDataToStore)
                .then(setSecondCategoryDataStatus)
                .then(setThirdCategoryDataStatus)
                .then(updateProductStatus)
                .then(updateChildProductDataToElastic)
                .then(updateChildProductDataToStoreElastic)
                .then(data => {
                    return reply({
                        message: request.i18n.__('genericErrMsg')['200']
                    }).code(200);
                }).catch(e => {

                    return reply({
                        message: e
                    }).code(500);
                });
            break;
        case 2:
            // second Category Id
            conditionForProduct = {
                secondCategoryId: request.payload._id
            };
            conditionForStore = {
                _id: new ObjectID(request.payload.storeId)
            }
            getStoreSecondCategoryData()
                .then(setSecondCategoryData)
                .then(setSecondCategoryDataToStore)
                // .then(setThirdCategoryDataStatus)
                .then(updateChildProductDataToStoreElastic)
                .then(updateChildProductDataToElastic)
                .then(data => {
                    return reply({
                        message: request.i18n.__('genericErrMsg')['200']
                    }).code(200);
                }).catch(e => {
                    return reply({
                        message: e
                    }).code(500);
                });
            break;
        case 3:
            // third Category Id
            conditionForProduct = {
                thirdCategoryId: request.payload._id
            };
            conditionForStore = {
                _id: new ObjectID(request.payload.storeId)
            }
            getStoreThirdCategoryData()
                .then(setThirdCategoryData)
                .then(updateChildProductDataToElastic)
                .then(setThirdCategoryDataToStore)
                .then(updateChildProductDataToStoreElastic)
                .then(data => {
                    return reply({
                        message: request.i18n.__('genericErrMsg')['200']
                    }).code(200);
                }).catch(e => {

                    return reply({
                        message: e
                    }).code(500);
                });
            break;

        default:
            break;
    }


}
module.exports = {
    handler,
    validator
}