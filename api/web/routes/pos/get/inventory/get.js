'use strict';

const Joi = require('joi');
const logger = require('winston');
const moment = require('moment');
const async = require('async');
const _ = require('underscore-node');
const childProducts = require('../../../../../models/childProducts');
const request = require('superagent');
const ObjectID = require('mongodb').ObjectID;
/** @namespace */
const error = require('../../../../../statusMessages/responseMessage');

const payload = Joi.object({
    childProductId: Joi.string().required().description('string'),
    unitId: Joi.string().required().description('string'),
    storeId: Joi.string().required().description('string'),
    quantity: Joi.number().required().description('number'),
}).required();


const APIHandler = (req, reply) => {


    const readFile = () => {
        return new Promise((resolve, reject) => {

            // childProducts.getProductDetails({ _id: new ObjectID(req.params.childProductId) }, (err, product) => {
            //     if (err) {
            //         logger.error('Error occurred during pos checkout signin  (getProductDetails): ' + JSON.stringify(err));
            //         reject(err);
            //     }
            //    // product.POSId = product ? product.POSId : 10;
            //     resolve({product : 9});
            // });
            resolve({ product: 9 });
        });
    }

    readFile()
        .then((data) => {
            if (data) {
                request
                    .get('http://34.208.97.117/api/checkInventory')
                    .query('inventory[0][location_id]=66')
                    .query('inventory[0][product_id]=32')
                    .then(function (res) {
                        return reply({ message: error['stores']['200'][req.headers.language], data: JSON.parse(res.text) }).code(200);
                    });
            } else {
                return reply({ message: error['checkOperationZone']['400'][req.headers.language] }).code(400);
            }

        })
        .catch((err) => {
            logger.error('Error occurred duringget stores (catch): ' + JSON.stringify(err));
            return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
        });
};

module.exports = { payload, APIHandler };