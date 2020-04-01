// Post a new offer

require("moment");

const Joi = require("joi");

const async = require("async");

const logger = require('winston');

const Promise = require('promise');

const ObjectID = require('mongodb').ObjectID;

const referralCampaigns = require('../../../../models/referralCampaigns/referralCampaigns');

const referralCodes = require('../../../../models/referralCampaigns/referralCode');

const error = require('../../../../statusMessages/responseMessage');

const referralUnlockedTripLogs = require('../../../../models/referralCampaignUnlockedLogs/referralCampaignUnlockedLog');


/*
@description: validator to offer status id
@params: status
 */
let allCampaignsByStatusValidator = {

    status: Joi.number().required().description('Mandatory Field.'),
    offset: Joi.number().required().description('Mandatory field'),
    limit: Joi.number().required().description('Mandatory field'),
    sSearch: Joi.any().description("Non mandatory filed"),
    cityId: Joi.any().description("Non mandatory filed"),
    dateTime: Joi.any().description("Non mandatory field")
}

let validateReferralCodeValidator = {
    params: {
        referralCode: Joi.string().required().description("Mandatory field")
    }
}

let getReferralCodeByUserIdValidator = {
    params: {
        userId: Joi.string().required().description("Mandatory field")
    }
}

// Get all campaigns by status
let allCampaignsByStatusHandler = (request, reply) => {
    var status = request.params.status;


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




    let getAllCampaignsByStatus = () => {

        return new Promise((resolve, reject) => {

            referralCampaigns.getAllCampaignsByStatus(requestData, (err, campaigns) => {

                if (err) {
                    logger.error('No response: ' + JSON.stringify(err));
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                }
                logger.info(campaigns);
                var campaignsData = [];
                async.forEach(campaigns, (item, callbackloop) => {

                    campaignsData.push({
                        'id': item._id.toString(),
                        'title': item.title,
                        'cities': item.cities,
                        'category': item.category,
                        'zones': item.zone,
                        'rewardTriggerTypeString': item.rewardTriggerTypeString,
                        'startTime': item.startTime,
                        'endTime': item.endTime,
                        'codesGenerated': item.codesGenerated,
                        'totalClaims': item.totalClaims,
                        'qualifyingTrips': item.qualifyingTrips,
                        'unlockedCount': item.unlockedCount
                    });
                    return callbackloop(null);
                }, (loopErr) => {
                    data = campaignsData;
                    return resolve()
                });
            })
        });
    }


    let totalReferralCount = (request, reply) => {
        return new Promise((resolve, reject) => {
            referralCampaigns.getCountByStatus(requestData.status, (countDataError, countDataResponse) => {

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


    getAllCampaignsByStatus()

        .then(totalReferralCount)

        .then((response) => {
            return reply({
                message: error['promoCampaigns']['200']['0'],
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

/*
@check referral code is valid or not
@param : referralCode
 */

let validateReferralCodeHandler = (request, reply) => {
    let referralCode = request.params.referralCode;
    referralCodes.getDetailsByCode(referralCode, (error, response) => {
        if (error) {
            return reply({
                message: "Error while fetching details",
                data: {
                    status: false
                }
            }).code(500);
        } else if (response.length == 0) {
            return reply({
                message: "Invalid referral code",
                data: {
                    status: false
                }
            }).code(402);
        } else {
            return reply({
                message: "success",
                data: {
                    status: true
                }
            }).code(200);
        }
    })

}

let getReferralCodeByUserIdHandler = (request, reply) => {

    referralCodes.getReferralCodeByUserId(request.params.userId, (error, response) => {

        if (error) {
            return reply({
                message: "Database error"
            }).code(500);
        } else if (response == null) {
            return reply({
                message: "Referral code not found"
            }).code(402);
        } else {
            return reply({
                "message": "true",
                "data": {
                    "referralCode": response.referralCode
                }
            }).code(200);
        }
    })

}

let getReferralCampaignDetailsByIdValidator = {

    campaignId: Joi.string().required().description("Mandatory field for referral campaign")

}

let getReferralCampaignDetailsByIdHander = (request, reply) => {

    let campaignId = request.params.campaignId;

    referralCampaigns.getCampaignById(campaignId, (error, response) => {

        if (error) {
            return reply({
                message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language]
            }).code(500);
        } else {
            // logger.error(error['promoCampaigns']['200'][request.headers.language]);
            return reply({
                message: "Success",
                data: response
            }).code(200);
        }
    });

}

let referalCodeListByCampaignIdValidator = {
    campaignId: Joi.string().required().description('Mandatory field'),
    offset: Joi.number().required().description('Mandatory field'),
    limit: Joi.number().required().description('Mandatory field')
}

let referalCodeListByCampaignIdHandler = (request, reply) => {



    let campaignId = request.params.campaignId;

    let offset = request.params.offset;

    let limit = request.params.limit;




    let requestData = {
        campaignId: campaignId,
        offset: offset * 10,
        limit: limit
    }
    let totalCount = 0;
    let data = '';




    let getReferalsByCampaignId = () => {

        return new Promise((resolve, reject) => {

            referralCodes.getReferalsByCampaignId(requestData, (err, referralData) => {

                if (err) {
                    logger.error('No response: ' + JSON.stringify(err));
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                }
                logger.info(referralData);
                var referralDataData = [];
                async.forEach(referralData, (item, callbackloop) => {

                    referralDataData.push({
                        'id': item._id.toString(),
                        'userId': item.userId,
                        'registeredOn': item.registeredOn,
                        'firstName': item.firstName,
                        'lastName': item.lastName,
                        'email': item.email,
                        'phoneNumber': item.phoneNumber,
                        'referralCode': item.referralCode,
                        'totalRefers': item.totalRefers,
                        'referrerName': item.referrerName,
                        'referrerId': item.referrerId
                    });
                    return callbackloop(null);
                }, (loopErr) => {
                    data = referralDataData;
                    return resolve()
                });
            })
        });
    }


    let totalReferralCount = (request, reply) => {
        return new Promise((resolve, reject) => {
            referralCodes.getCodesGeratedCountByID(campaignId, (countDataError, countDataResponse) => {

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


    getReferalsByCampaignId()

        .then(totalReferralCount)

        .then((response) => {
            return reply({
                message: error['promoCampaigns']['200']['0'],
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


/*
@get customer referral details by id
@params:
        customerId,
        offset,
        limit

 */
// let customerReferralDetailsByIdValidator = {
//     customerId: Joi.string().required().description('Mandatory field'),
//     offset: Joi.number().required().description('Mandatory field'),
//     limit: Joi.number().required().description('Mandatory field')
// }

// let customerReferralDetailsByIdHandler = (request, reply) => {

//     let campaignId = request.params.campaignId;

//     let offset = request.params.offset;

//     let limit = request.params.limit;

//     let requestData = {
//         campaignId: campaignId,
//         offset: offset * 10,
//         limit: limit
//     }
//     let totalCount = 0;
//     let data = '';




//     let getReferalsByCampaignId = () => {

//         return new Promise((resolve, reject) => {

//             referralCodes.getReferalsByCampaignId(requestData, (err, referralData) => {

//                 if (err) {
//                     logger.error('No response: ' + JSON.stringify(err));
//                     return reject(error['genericErrMsg']['500'][request.headers.language]);
//                 }
//                 logger.info(referralData);
//                 var referralDataData = [];
//                 async.forEach(referralData, (item, callbackloop) => {

//                     referralDataData.push({
//                         'id': item._id.toString(),
//                         'userId': item.userId,
//                         'registeredOn': item.registeredOn,
//                         'firstName': item.firstName,
//                         'lastName': item.lastName,
//                         'email': item.email,
//                         'phoneNumber': item.phoneNumber,
//                         'referralCode' : item.referralCode,
//                         'totalRefers': item.totalRefers,
//                         'referrerName': item.referrerName,
//                         'referrerId': item.referrerId
//                     });
//                     return callbackloop(null);
//                 }, (loopErr) => {
//                     data = referralDataData;
//                     return resolve()
//                 });
//             })
//         });
//     }


//     let totalReferralCount = (request, reply) => {
//         return new Promise((resolve, reject) => {
//             referralCodes.getCodesGeratedCountByID(campaignId, (countDataError, countDataResponse) => {

//                 if (countDataError) {
//                     logger.error('Unable to get count: ' + JSON.stringify(err))
//                     return reject(error['genericErrMsg']['500'][request.headers.language]);
//                 } else {
//                     totalCount = countDataResponse;
//                     return resolve();
//                 }
//             });
//         });

//     }


//     getReferalsByCampaignId()

//     .then(totalReferralCount)

//     .then((response) => {
//         return reply({
//             message: error['promoCampaigns']['200']['0'],
//             totalCount: totalCount,
//             data: data
//         }).code(200);

//     }).catch((err) => {
//         logger.error("Post referral new user referral code error: ", err);
//         return reply({
//             message: Joi.any().default(i18n.__('genericErrMsg')['500'])
//         }).code(500);
//     });


// }

/*
Total referrers by the user durint campaign
 */

/*
All referrall by the user
 */

let totalReferesByUserDuringCampaignValidator = {
    userId: Joi.string().required().description('Mandatory field'),
    referralCampaignId: Joi.string().description('Mandatory field'),
    offset: Joi.number().description('Mandatory field'),
    limit: Joi.number().description('Mandatory field')
}


let allReferralsByUserBycampaignId = (request, reply) => {

    logger.info("getting campaign details")

    var status = request.params.status;


    let requestData = {
        userId: request.params.userId,
        referralCampaignId: request.params.referralCampaignId,
        offset: request.params.offset * 10,
        limit: request.params.limit
    }
    // logger.info("request data");
    // logger.info(requestData);
    let totalCount = 0;

    let data = '';

    let getAllCampaignsByStatus = () => {

        return new Promise((resolve, reject) => {

            referralCodes.getTotalReferralsDataByCampaignId(requestData, (err, campaigns) => {
                logger.info("campaign details")

                if (err) {
                    logger.error('No response: ' + JSON.stringify(err));
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                }
                // logger.info(campaigns);
                var campaignsData = [];
                async.forEach(campaigns[0].referrals, (item, callbackloop) => {
                    logger.info('campaign data');
                    logger.info(item)
                    campaignsData.push({
                        "userId": item.userId,
                        "registeredOn": item.registeredOn,
                        "userType": item.userType,
                        "firstname": item.firstname,
                        "lastName": item.lastName,
                        "email": item.email,
                        "countryCode": item.countryCode,
                        "phoneNumber": item.phoneNumber,
                        "campaignId": item.campaignId,
                        "referralCode": item.referralCode || 'N/A'
                    });
                    return callbackloop(null);
                }, (loopErr) => {
                    data = campaignsData;
                    return resolve()
                });
            })
        });
    }


    let totalReferralCount = (request, reply) => {
        return new Promise((resolve, reject) => {
            referralCodes.getTotalReferralsCountByCampaignId(requestData, (countDataError, countDataResponse) => {

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


    getAllCampaignsByStatus()

        .then(totalReferralCount)

        .then((response) => {
            return reply({
                message: error['promoCampaigns']['200']['0'],
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



/*
Get referral code unlocked trip log data
 */
/*
All referrall by the user
 */

let totalUnlockedTripCountByCampaignIdValidator = {
    campaignId: Joi.string().required().description('Mandatory field'),
    offset: Joi.number().required().description('Mandatory field'),
    limit: Joi.number().required().description('Mandatory field')
}


let unlockedTripCountByCampaignIdHandler = (request, reply) => {

    logger.info("getting campaign details")

    var status = request.params.status;


    let requestData = {
        referralCampaignId: request.params.campaignId,
        offset: request.params.offset * 10,
        limit: request.params.limit
    }


    let totalCount = 0;

    let data = '';

    let getReferalUnlockedLogs = () => {

        return new Promise((resolve, reject) => {

            referralUnlockedTripLogs.getTotalUnlockedDataByCampaignId(requestData, (err, campaigns) => {
                logger.info("campaign details")

                if (err) {
                    logger.error('No response: ' + JSON.stringify(err));
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                }
                logger.info(campaigns);
                var campaignsData = [];
                async.forEach(campaigns, (item, callbackloop) => {
                    logger.info('1');
                    logger.info(item);
                    campaignsData.push({
                        "id": item._id.toString(),
                        "campaignId": item.campaignId,
                        "campaignTitle": item.campaignTitle,
                        "userName": item.userName,
                        "referralCode": item.referralCode,
                        "rewardType": item.rewardType,
                        "couponCode": item.couponCode,
                        "newUserDiscount": item.newUserDiscount,
                        "referrerDiscount": item.referrerDiscount,
                        "deliveredTo": item.deliveredTo,
                        "timeStamp": item.timeStamp
                    });
                    return callbackloop(null);
                }, (loopErr) => {
                    data = campaignsData;
                    return resolve()
                });
            })
        });
    }


    let totalReferralLogsDataByCampaignId = (request, reply) => {
        return new Promise((resolve, reject) => {
            referralUnlockedTripLogs.getTotalUnlockCountByCampaignId(requestData, (countDataError, countDataResponse) => {

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


    getReferalUnlockedLogs()

        .then(totalReferralLogsDataByCampaignId)

        .then((response) => {
            return reply({
                message: error['promoCampaigns']['200']['0'],
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


let response = {
    status: {
        200: {
            message: "success"
        },
        500: {
            message: "Error while fetching details"
        },
        402: {
            message: "Invalid referral code"
        }
    }
}

// export handler and validator
module.exports = {
    allCampaignsByStatusValidator,
    allCampaignsByStatusHandler,
    validateReferralCodeHandler,
    validateReferralCodeValidator,
    getReferralCodeByUserIdHandler,
    getReferralCodeByUserIdValidator,
    getReferralCampaignDetailsByIdValidator,
    getReferralCampaignDetailsByIdHander,
    referalCodeListByCampaignIdValidator,
    referalCodeListByCampaignIdHandler,
    totalReferesByUserDuringCampaignValidator,
    allReferralsByUserBycampaignId,
    totalUnlockedTripCountByCampaignIdValidator,
    unlockedTripCountByCampaignIdHandler

}