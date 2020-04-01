'use strict'


const error = require('../../../../../statusMessages/responseMessage');  // response messages based on language 
const config = process.env;
const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const Async = require('async');
const errorMsg = require('../../../../../locales');
const storeAddOn = require('../../../../../models/storeAddOn');
const childProducts = require('../../../../../models/childProducts');
const childProductsElastic = require('../../../../../models/childProductsElastic');

const validator = Joi.object({
    addOnId: Joi.string().required().description('addon id is required'),
    storeId: Joi.string().required().description('storeId id is required'),
}).required();


const handler = (request, reply) => {
    const dbErrResponse = request.i18n.__('genericErrMsg')['500'];

    const removeStoreAddOnData = () => {
        return new Promise((resolve, reject) => {
            var condition = {
                "_id": new ObjectID(request.payload.addOnId),
                "storeId": request.payload.storeId,
            };
            storeAddOn.deleteItem(condition, (err, result) => {
                if (err)
                    return reject(dbErrResponse);
                else
                    return resolve(true);
            });
        });
    }

    const removeChildAddOnData = () => {
        return new Promise((resolve, reject) => {
            var condition = {
                query: { "addOns.id": request.payload.addOnId, "addOns.storeId": request.payload.storeId },
                data: {
                    $pull: {
                        "addOns": { "id": request.payload.addOnId, "storeId": request.payload.storeId }
                    }
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

    removeStoreAddOnData()
        .then(removeChildAddOnData)
        // .then(setChildAddOnDataElastic)
        .then(data => {
            return reply({ message: request.i18n.__('genericErrMsg')['200'] }).code(200);
        }).catch(e => {
            return reply({ message: e.message }).code(e.code);
        });


}
module.exports = { handler, validator }