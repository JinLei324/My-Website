require("moment");
const Joi = require("joi");

const async = require("async");

const logger = require('winston');

const Promise = require('promise');

const ObjectID = require('mongodb').ObjectID;

const inputTriplogs = require('../../../../models/logs/logs');

const qualifiedTripLogs = require('../../../../models/promoCampaigns/qualifiedTripLogs');

const qualifiedTrips = require('../../../../models/promoCampaigns/campaignQualifiedTrips');

const claims = require('../../../../models/claims');

const campaignUnlockedTripsModel = require('../../../../models/campaignUnlockedLogs/campaignUnlockedLogs');



const error = require('../../../../statusMessages/responseMessage');

let allTripLogsHandler = (request, reply) => {

    inputTriplogs.getAllTripLogs({}, (error, response) => {
        if (error) {
            logger.error('No response: ' + JSON.stringify(error));
            return reply({
                message: "Database error"
            }).code(500);
        } else if (response.length == 0 || response == null) {
            logger.error("No logs found");
            return reply({
                message: "Unable to find log details"
            }).code(402);
        } else {
            return reply({
                message: "Success",
                data: response
            }).code(200);
        }
    });
}

let allQualifiedTripLogs = (request, reply) => {
    qualifiedTrips.allQualifiedTripLog({}, (error, response) => {
        if (error) {
            logger.error("No response: " + JSON.stringgify(error));
            return reply({
                message: "Database error"
            }).code(500);
        } else if (response.length == 0 || response == null) {
            logger.error("No qualified trip logs found");
            return reply({
                message: "Unable to find log details"
            }).code(402);
        } else {
            return reply({
                message: "success",
                data: response
            }).code(200)

        }
    });
};


let qualifiedTripsByPromoIdValidator = {
    campaignId: Joi.string().required().description('Mandatory field'),
    offset: Joi.number().required().description('Mandatory field'),
    limit: Joi.number().required().description('Mandatory field')
}


let qualifiedTripsByPromoIdsHandler = (request, reply) => {

    let requestData = {
        campaignId: request.params.campaignId,
        offset: request.params.offset,
        limit: request.params.limit
    }

    let totalCount = 0;
    let data = '';

    let getAllQualifiedTripsByCampaignId = () => {

        return new Promise((resolve, reject) => {
            qualifiedTrips.getAllQualifiedTripsByPromoIds(requestData, (qualifiedTripsError, qualifiedTripsResponse) => {

                if (qualifiedTripsError) {
                    logger.error('No response: ' + JSON.stringify(qualifiedTripsError));
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                }
                var qualifiedTripsData = [];
                async.forEach(qualifiedTripsResponse, (item, callbackloop) => {
                    qualifiedTripsData.push({
                        "id": item._id.toString(),
                        "campaignId": item.campaignId,
                        "bookingId": item.bookingId,
                        "userId": item.userId,
                        "customerName": item.customerName,
                        "cityId": item.cityId,
                        "zoneId": item.zoneId,
                        "paymentMethod": item.paymentMethod,
                        "paymentMethodString": item.paymentMethodString,
                        "bookingTime": item.bookingTime,
                        "deliveryFee": item.deliveryFee,
                        "cartValue": item.cartValue,
                        "currency": item.currency,
                        "currencySymbol": item.currencySymbol || '$',
                        "created": item.created,
                        "email": item.email,
                        "campaignTitle": item.campaignTitle
                    });
                    return callbackloop(null);
                }, (loopErr) => {
                    data = qualifiedTripsData;
                    return resolve()
                });
            })
        });
    }



    let totalQualifiedTripsCount = () => {


        return new Promise((resolve, reject) => {

            qualifiedTrips.getCountByCampaignId(requestData.campaignId, (countDataError, countDataResponse) => {
                logger.info(countDataResponse);
                if (countDataError) {
                    logger.error('No response while getting count:' + JSON.stringify(err))
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                } else {
                    logger.info("Check");
                    totalCount = countDataResponse;
                    return resolve();
                }

            });

        });

    }

    getAllQualifiedTripsByCampaignId()

        .then(totalQualifiedTripsCount)

        .then(() => {
            logger.info("test2")
            return reply({
                message: error['promoCampaigns']['200']['0'],
                totalCount: totalCount,
                data: data
            }).code(200);

        }).catch((err) => {
            logger.error("Post referral new user referral code error: ", qualifiedTripsError);
            return reply({
                message: Joi.any().default(i18n.__('genericErrMsg')['500'])
            }).code(500);
        });

}


let unlockedDetailsByCampaignIdValidator = {
    campaignId: Joi.string().required().description('Mandatory field'),
    offset: Joi.number().required().description('Mandatory field'),
    limit: Joi.number().required().description('Mandatory field')
}


let unlockedDetailsByCampaignIdHandler = (request, reply) => {

    let requestData = {
        campaignId: request.params.campaignId,
        offset: request.params.offset,
        limit: request.params.limit
    }

    let totalCount = 0;
    let data = '';

    let getAllUnlockedCampaignIdByCampaignId = () => {

        return new Promise((resolve, reject) => {
            claims.allUnlockedCampaignByCampaignId(requestData, (unlockedDataError, unlockedDataResponse) => {

                if (unlockedDataError) {
                    logger.error('No response: ' + JSON.stringify(qualifiedTripsError));
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                }
                var unlockedData = [];
                async.forEach(unlockedDataResponse, (item, callbackloop) => {
                    unlockedData.push({
                        "id": item.id,
                        "cartId": item.cartId,
                        "userId": item.userId,
                        "promoId": item.promoId,
                        "userName": item.userName,
                        "userEmail": item.userEmail,
                        "userPhone": item.userPhone,
                        "couponCode": item.couponCode,
                        "currency": item.currency,
                        "currencySymbol": item.currencySymbol || '$',
                        "cartValue": item.cartValue,
                        "discountValue": item.discountValue,
                        "deliveryFee": item.deliveryFee,
                        "lockedTimeStamp": item.lockedTimeStamp,
                        "applicableOn": item.applicableOn,
                        "unlockedTimeStamp": item.unlockedTimeStamp,
                        "claimTimeStamp": item.claimTimeStamp,
                        "discount": item.discount,
                        "status": item.status,
                        "bookings": item.bookings
                    });
                    return callbackloop(null);
                }, (loopErr) => {
                    data = unlockedData;
                    return resolve()
                });
            })
        });
    }



    let totalUnlockedCodeCountByCampaignId = () => {


        return new Promise((resolve, reject) => {

            claims.getTotalUnlockedCountByCampiagnId(requestData.campaignId, (countDataError, countDataResponse) => {
                logger.info(countDataResponse);
                if (countDataError) {
                    logger.error('No response while getting count:' + JSON.stringify(err))
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                } else {
                    logger.info("Check");
                    totalCount = countDataResponse;
                    return resolve();
                }

            });

        });

    }

    getAllUnlockedCampaignIdByCampaignId()

        .then(totalUnlockedCodeCountByCampaignId)

        .then(() => {
            logger.info("test2")
            return reply({
                message: error['promoCampaigns']['200']['0'],
                totalCount: totalCount,
                data: data
            }).code(200);

        }).catch((err) => {
            logger.error("Post referral new user referral code error: ", qualifiedTripsError);
            return reply({
                message: Joi.any().default(i18n.__('genericErrMsg')['500'])
            }).code(500);
        });

}




let claimedDetailsByCampaignIdValidator = {
    campaignId: Joi.string().required().description('Mandatory field'),
    offset: Joi.number().required().description('Mandatory field'),
    limit: Joi.number().required().description('Mandatory field')
}


let claimedDetailsByCampaignIdHandler = (request, reply) => {

    let requestData = {
        campaignId: request.params.campaignId,
        offset: request.params.offset,
        limit: request.params.limit
    }

    let totalCount = 0;
    let data = '';

    let getAllClaimedCampaignIdByCampaignId = () => {

        return new Promise((resolve, reject) => {
            claims.allClaimedCampaignByCampaignId(requestData, (unlockedDataError, unlockedDataResponse) => {

                if (unlockedDataError) {
                    logger.error('No response: ' + JSON.stringify(qualifiedTripsError));
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                }
                var unlockedData = [];
                async.forEach(unlockedDataResponse, (item, callbackloop) => {
                    unlockedData.push({
                        "id": item._id.toString(),
                        "cartId": item.cartId,
                        "userId": item.userId,
                        "promoId": item.promoId,
                        "userName": item.userName,
                        "userEmail": item.userEmail,
                        "userPhone": item.userPhone,
                        "couponCode": item.couponCode,
                        "currency": item.currency,
                        "currencySymbol": item.currencySymbol || '$',
                        "cartValue": item.cartValue,
                        "discountValue": item.discountValue,
                        "deliveryFee": item.deliveryFee,
                        "lockedTimeStamp": item.lockedTimeStamp,
                        "applicableOn": item.applicableOn,
                        "unlockedTimeStamp": item.unlockedTimeStamp,
                        "claimTimeStamp": item.claimTimeStamp,
                        "discount": item.discount,
                        "status": item.status,
                        "bookings": item.bookings
                    });
                    return callbackloop(null);
                }, (loopErr) => {
                    data = unlockedData;
                    return resolve()
                });
            })
        });
    }



    let totalClaimedCodeCountByCampaignId = () => {


        return new Promise((resolve, reject) => {

            claims.getTotalClaimedCountByCampiagnId(requestData.campaignId, (countDataError, countDataResponse) => {
                logger.info(countDataResponse);
                if (countDataError) {
                    logger.error('No response while getting count:' + JSON.stringify(err))
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                } else {
                    logger.info("Check");
                    totalCount = countDataResponse;
                    return resolve();
                }

            });

        });

    }

    getAllClaimedCampaignIdByCampaignId()

        .then(totalClaimedCodeCountByCampaignId)

        .then(() => {
            logger.info("test2")
            return reply({
                message: error['promoCampaigns']['200']['0'],
                totalCount: totalCount,
                data: data
            }).code(200);

        }).catch((err) => {
            logger.error("Post referral new user referral code error: ", qualifiedTripsError);
            return reply({
                message: Joi.any().default(i18n.__('genericErrMsg')['500'])
            }).code(500);
        });


}

let campaignUnlockedTripLogsByIdValidator = {
    campaignId: Joi.string().required().description("Mandatory field for campaign id"),
    offset: Joi.number().required().description("Mandatory field"),
    limit: Joi.number().required().description("Mandatory field")
}

let campaignUnlockedTripLogsByIdHandler = (request, reply) => {
    let requestData = {
        campaignId: request.params.campaignId,
        offset: request.params.offset,
        limit: request.params.limit
    }

    let totalCount = 0;
    let data = '';

    let getAllCamapignUnlockedTrips = () => {

        return new Promise((resolve, reject) => {
            campaignUnlockedTripsModel.getUnlockedDataByPromoId(requestData, (unlockedDataError, unlockedDataResponse) => {

                if (unlockedDataError) {
                    logger.error('No response: ' + JSON.stringify(qualifiedTripsError));
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                }
                var unlockedData = [];
                async.forEach(unlockedDataResponse, (item, callbackloop) => {
                    unlockedData.push({
                        id: item._id.toString(),
                        promoId: item.promoId,
                        promoTitle: item.promoTitle,
                        userName: item.userName,
                        cartId: item.cartId,
                        bookingId: item.bookingId,
                        bookingTimeStamp: item.bookingTimeStamp,
                        unlockedCode: item.unlockedCode,
                        walletCreditAmount: item.walletCreditAmount,
                        currencySymbol: item.currencySymbol || '$',
                        campaignRewardType: item.campaignRewardType,
                        timestamp: item.timestamp
                    });
                    return callbackloop(null);
                }, (loopErr) => {
                    data = unlockedData;
                    return resolve()
                });
            })
        });
    }



    let totalUnlockedTripCountByCampaignId = () => {


        return new Promise((resolve, reject) => {

            campaignUnlockedTripsModel.getTotalUnlockedCountByCampiagnId(requestData.campaignId, (countDataError, countDataResponse) => {
                logger.info(countDataResponse);
                if (countDataError) {
                    logger.error('No response while getting count:' + JSON.stringify(err))
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                } else {
                    logger.info("Check");
                    totalCount = countDataResponse;
                    return resolve();
                }

            });

        });

    }

    getAllCamapignUnlockedTrips()

        .then(totalUnlockedTripCountByCampaignId)

        .then(() => {

            return reply({
                message: error['promoCampaigns']['200']['0'],
                totalCount: totalCount,
                data: data
            }).code(200);

        }).catch((err) => {
            logger.error("Post referral new user referral code error: ", qualifiedTripsError);
            return reply({
                message: Joi.any().default(i18n.__('genericErrMsg')['500'])
            }).code(500);
        });

}


module.exports = {
    allTripLogsHandler,
    allQualifiedTripLogs,
    qualifiedTripsByPromoIdValidator,
    qualifiedTripsByPromoIdsHandler,
    unlockedDetailsByCampaignIdHandler,
    unlockedDetailsByCampaignIdValidator,
    claimedDetailsByCampaignIdHandler,
    claimedDetailsByCampaignIdValidator,
    campaignUnlockedTripLogsByIdValidator,
    campaignUnlockedTripLogsByIdHandler
}