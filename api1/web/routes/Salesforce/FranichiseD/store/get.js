'use strict'
const config = process.env;

const Joi = require('joi');
const Async = require('async');
const logger = require('winston');
const stores = require('../../../../../models/stores');


const validator = {
    franchiseId: Joi.string().required().description('franchiseId')
}


/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/
const handler = (req, reply) => {
    let condition = {};
    switch (req.auth.credentials.userType) {
        case 0://city
            condition = { cityId: req.auth.credentials.cityId, status: 1 }
            break;
        case 1://franchies 
            condition = { franchiseId: req.auth.credentials.franchiseId, status: 1 }
            break;
        case 2://store
            break;
        default:
    }
    const getStroe = (data) => {
        return new Promise((resolve, reject) => {
            stores.readAll(condition, (err, res) => {
                return err ? reject({ message: req.i18n.__('genericErrMsg')['500'], code: 500 }) : resolve(res);
            })
        });
    }
    const responseData = (data) => {
        return new Promise((resolve, reject) => {
            const responseArr = data.map(x => {
                return {
                    id: x._id,
                    storeName: x.sName[req.headers.language],
                    driverType: x.driverType == 1 ? 2 : 1,
                    serviceZones: x.serviceZones
                }
            });
            return resolve(responseArr);
        });
    }
    getStroe()
        .then(responseData)
        .then(data => {
            return reply({ message: req.i18n.__('customerAddressPost')['200'], data: data }).code(200);
        }).catch(e => {
            logger.error("customer postAddress API error =>", e)
            return reply({ message: e.message }).code(e.code);
        });
}

const responseCode = {

}//swagger response code
module.exports = {
    handler,
    validator,
    responseCode
}