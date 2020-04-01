'use strict';
const joi = require('joi');
const logger = require('winston');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const cities = require('../../../../models/cities');
const promoCodes = require('../../../../models/promoCodes');


const params = joi.object({
    lat: joi.number().allow('').description('latitude').error(new Error('Latitude must be number')),
    long: joi.number().allow('').description('longitude').error(new Error('Longitude must be number')),
}).required();


const handler = (req, reply) => {
    let dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 }
    let cityData = {};
    const getCity = (data) => {
        return new Promise((resolve, reject) => {
            let con = {
                polygons: {
                    $geoIntersects: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(req.params.long || 0.0), parseFloat(req.params.lat || 0.0)]
                        }
                    }
                }
            };
            cities.SelectOne(con, (err, res) => {
                if (err) {
                    return reject(dbErrResponse);
                }
                if (res === null) {

                    return reject({ message: req.i18n.__('genericErrMsg')['404'], code: 404 });
                } else {
                    cityData = res;
                    return resolve(data);
                }
            });
        });
    }
    const getPromoCode = (data) => {
        return new Promise((resolve, reject) => {
            promoCodes.getAllCouponCodeByCityId((cityData._id).toString(), (err, res) => {
                if (err) {
                    return reject(dbErrResponse)
                } else if (res.length == 0) {
                    return reject({ message: req.i18n.__('genericErrMsg')['404'], code: 404 })
                } else {
                    let currentDate = new Date();
                    let currentISODate = currentDate.toISOString();
                    let promoCodeArr = [];
                    res.forEach(function (item) {
                        if (((item.startTime) < currentISODate) && ((item.endTime) > currentISODate)) {
                            promoCodeArr.push({
                                _id: item._id,
                                title: item.title,
                                code: item.code,
                                description: item.description,
                                howItWorks: item.howItWorks,
                                endTime: moment(item.endTime).format("MMM DD, YYYY hh:mm A"),
                                termsAndConditions: item.termsAndConditions
                            });
                        }
                    });
                    // let promoCodeArr = res.map(item => {
                    //     return {
                    //         _id: item._id,
                    //         title: item.title,
                    //         code: item.code,
                    //         description: item.description,
                    //         howItWorks: item.howItWorks,
                    //         endTime: moment(item.endTime).format("MMM DD, YYYY hh:mm A"),
                    //         termsAndConditions: item.termsAndConditions
                    //     }
                    // });
                    return resolve(promoCodeArr);
                    // return resolve(res);
                }
            })
        });
    }
    getCity()
        .then(getPromoCode)
        .then(data => {
            return reply({ message: req.i18n.__('genericErrMsg')['200'], data: data }).code(200);
        }).catch(e => {
            logger.error("AppConfig postBooking API error =>", e)
            return reply({ message: e.message }).code(e.code);
        });
}
const responseCode = {
    // status: {
    //     200: { message: error['postReferralCodeValidation']['200'][error['lang']], data: joi.any() },
    //     400: { message: error['postReferralCodeValidation']['400'][error['lang']] },
    //     401: { message: error['postReferralCodeValidation']['401'][error['lang']] },
    //     500: { message: Joi.any().default(i18n.__('genericErrMsg')['500'])[error['lang']] }
    // }

}//swagger response code

module.exports = {
    params,
    handler,
    responseCode
};