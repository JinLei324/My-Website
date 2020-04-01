// Post a new offer

require("moment");
const Joi = require("joi");
const async = require("async");
const logger = require('winston');
const Promise = require('promise');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const couponCode = require('../../../../models/promoCodes/promoCodes');

const i18n = require('../../../../locales/locales');


/*
@description: validator to offer status id
@params: status
 */
var allCouponCodeByStatusValidator = {

    status: Joi.number().required().description('Mandatory Field.'),
    offset: Joi.number().required().description('Mandatory field'),
    limit: Joi.number().required().description('Mandatory field'),
    sSearch: Joi.any().description("Non mandatory filed"),
    cityId: Joi.any().description("Non mandatory filed"),
    dateTime: Joi.any().description("Non mandatory field")
}

var getAvaialablePromoCodesByCityIdValidator = {
    params: {
        cityId: Joi.string().required().description('Mandatory field')
    }
}
var getAvaialablePromoCodesByCityandStoreIdValidator = {
    params: {
        cityId: Joi.string().required().description('Mandatory field'),
        storeIds: Joi.string().required().description('Mandatory field'),
    }
}
let allPromoCodesByCityIdHandler = (request, reply) => {
    let getAllCouponCode = () => {
        return new Promise((resolve, reject) => {
            let cityId = request.params.cityId;
            couponCode.getAllCouponCodeByCityId(cityId, (err, couponCodeResponse) => {
                if (err) {
                    reject({ message: request.i18n.__('genericErrMsg')['500'] })
                } else if (couponCodeResponse.length > 0) {

                    resolve(couponCodeResponse)
                } else {
                    reject({ message: request.i18n.__('promoCampaigns')['400'] })
                }
            });
        });
    }

    let updateExpired = () => {
        return new Promise((resolve, reject) => {
            couponCode.updateExpired((countDataError, countDataResponse) => {
                return resolve();
            });
        });
    }
    updateExpired()
        .then(getAllCouponCode)
        .then((response) => {
            return reply({
                message: request.i18n.__('promoCampaigns')['200'], data: response
            }).code(200);
        }).catch((err) => {
            logger.error("Get Promo code error: ", err);
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        });
}
let allPromoCodesByCityandStoreIdHandler = (request, reply) => {
    let getAllCouponCode = () => {
        return new Promise((resolve, reject) => {
            let cityId = request.params.cityId;
            let storeIds = request.params.storeIds;
            couponCode.getAllCouponCodeByCityAndStoreId({ cityId: cityId, storeIds: storeIds }, (err, couponCodeResponse) => {
                if (err) {
                    reject({ message: request.i18n.__('genericErrMsg')['500'] })
                } else if (couponCodeResponse.length > 0) {
                    resolve(couponCodeResponse)
                } else {
                    reject({ message: request.i18n.__('promoCampaigns')['400'] })
                }
            });
        });
    }

    let updateExpired = () => {
        return new Promise((resolve, reject) => {
            couponCode.updateExpired((countDataError, countDataResponse) => {
                return resolve();
            });
        });
    }
    updateExpired()
        .then(getAllCouponCode)
        .then((response) => {
            return reply({
                message: request.i18n.__('promoCampaigns')['200'], data: response
            }).code(200);
        }).catch((err) => {
            logger.error("Get Promo code error: ", err);
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        });
}
// Get all coupon code by status
var allCouponCodeByStatusHandler = (request, reply) => {


    let requestData = {
        status: request.payload.status,
        offset: request.payload.offset * 10,
        limit: request.payload.limit,
        sSearch: request.payload.sSearch,
        cityId: request.payload.cityId,
        dateTime: request.payload.dateTime,
    }
    let totalCount = 0;
    let data = '';


    let getAllPromoCodesByStatus = () => {

        return new Promise((resolve, reject) => {

            couponCode.getAllCouponCodeByStatus(requestData, (err, couponCodeResponse) => {
                // //(couponCodeResponse)
                if (err) {
                    logger.error('No response: ' + JSON.stringify(err));
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                }
                var couponCodeData = [];
                async.forEach(couponCodeResponse, (item, callbackloop) => {
                    var startDate = new Date(item.startTime);
                    var endDate = new Date(item.endTime);
                    var startDate1 = startDate.toString()
                    var endDate1 = endDate.toString()
                    couponCodeData.push({
                        'id': item._id.toString(),
                        'title': item.title,
                        'code': item.code,
                        'startDate': startDate1,
                        'endDate': endDate1,
                        'cities': item.cities,
                        'category': item.category,
                        'cityNames': item.cityNames,
                        'zones': item.zones,
                        'status': item.status,
                        'globalUsageLimit': item.globalUsageLimit,
                        'totalClaims': item.globalClaimCount


                    });
                    return callbackloop(null);
                }, (loopErr) => {
                    data = couponCodeData;
                    return resolve()
                });
            })
        });
    }


    let totalPromoCount = (request, reply) => {
        return new Promise((resolve, reject) => {
            couponCode.getCountByStatus(requestData.status, (countDataError, countDataResponse) => {
                //(countDataResponse)
                if (countDataError) {
                    logger.error('Unable to get count: ' + JSON.stringify(err))
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                } else {
                    totalCount = countDataResponse;
                    return resolve();
                }
            });
        });
    }


    let updateExpired = (request, reply) => {
        return new Promise((resolve, reject) => {
            couponCode.updateExpired((countDataError, countDataResponse) => {
                return resolve();
            });
        });
    }

    updateExpired()
        .then(getAllPromoCodesByStatus)
        .then(totalPromoCount)
        .then((response) => {
            return reply({
                message: request.i18n.__('promoCampaigns')['200'],
                totalCount: totalCount,
                data: data
            }).code(200);

        }).catch((err) => {
            logger.error("Post referral new user referral code error: ", err);
            return reply({
                message: Joi.any().default(i18n.__('genericErrMsg')['500'])
            }).code(500);
        });

}

// Get unlocked count by promo id
// validator to check unlocked count
var unlockedCodeCountValidator = {
    params: {
        promoId: Joi.number().required().description('Mandatory Field.'),
    }
}
// handler to check unlocked count

var allClaims = (request, reply) => {
    claims.getAllClaims({}, (err, claims) => {
        if (err) {
            logger.error('No response: ' + JSON.stringify(err));
            return reply({
                message: "Error while getting claims"
            }).code(500);
        }
        var claimsData = [];
        async.forEach(claims, (item, callbackloop) => {
            claimsData.push({
                'id': item._id.toString(),
                'userId': item.userId,
                'code': item.code,
                'startDate': item.startTime,
                'endDate': item.endTime,
                'status': item.status,
                'globalUsageLimit': item.globalUsageLimit,
                'totalClaims': item.globalClaimCount

            });
            return callbackloop(null);
        }, (loopErr) => {
            return reply({
                message: "success",
                data: claimsData
            }).code(200);
        });
    });
}


let promoDetailsByIdValidator = {
    promoId: Joi.string().required().description("Mandatory fiedl for promo id")
}

let promoDetailsByIdHandler = (request, reply) => {
    let promoId = request.params.promoId;
    couponCode.getPromoCodeById(promoId, (error, response) => {
        logger.info(response);
        if (error) {
            return reply({
                message: Joi.any().default(i18n.__('genericErrMsg')['500'])
            }).code(500);
        } else {
            return reply({
                message: request.i18n.__('promoCampaigns')['200'],
                data: response
            }).code(200);
        }
    });
}


let response = {
    status: {
        200: {
            message: "success"
        },
        500: {
            message: "Error while getting campaigns"
        }
    }
}

// export handler and validator
module.exports = {
    allCouponCodeByStatusValidator,
    allCouponCodeByStatusHandler,
    allPromoCodesByCityIdHandler,
    allPromoCodesByCityandStoreIdHandler,
    getAvaialablePromoCodesByCityIdValidator,
    getAvaialablePromoCodesByCityandStoreIdValidator,
    allClaims,
    promoDetailsByIdValidator,
    promoDetailsByIdHandler

}