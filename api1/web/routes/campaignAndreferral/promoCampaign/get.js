// Post a new offer

require("moment");
const Joi = require("joi");
const async = require("async");
const logger = require('winston');
const Promise = require('promise');

const ObjectID = require('mongodb').ObjectID;
const promoCampaigns = require('../../../../models/promoCampaigns/promoCampaigns');
const error = require('../../../../statusMessages/responseMessage');
const qualifiedTrips = require('../../../../models/promoCampaigns/campaignQualifiedTrips');


/*
@description: validator to offer status id
@params: status
 */
var allCampaignsByStatusValidator = {

    status: Joi.number().required().description('Mandatory Field.'),
    offset: Joi.number().required().description('Mandatory field'),
    limit: Joi.number().required().description('Mandatory field'),
    sSearch: Joi.any().description("Non mandatory filed"),
    cityId: Joi.any().description("Non mandatory filed"),
    dateTime: Joi.any().description("Non mandatory field")

}

/*
Get qualified trips count
 */
var qualifiedTripsCountValidator = {
    params: {
        campaignId: Joi.string().required().description('Mandatory Filed. Used to get the promo campaign details')
    }
}

var allCampaignsHandler = (request, reply) => {
    promoCampaigns.getAllCampaigns({}, (err, campaigns) => {
        if (err) {
            logger.error('No response: ' + JSON.stringify(err));
            return reply({
                message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language]
            }).code(500);
        }
        var campaignsData = [];
        async.forEach(campaigns, (item, callbackloop) => {
            campaignsData.push({
                'id': item._id.toString(),
                'titile': item.title,
                'code': item.code,
                'startDate': item.startTime,
                'endDate': item.endTime,
                'status': item.status,
                'globalUsageLimit': item.globalUsageLimit,
                'totalClaims': item.globalClaimCount,
                'qualifiedTrips': item.qualifyingTrips,
                'perUserLimit': item.perUserLimit



            });
            return callbackloop(null);
        }, (loopErr) => {

            return reply({
                message: error['customer']['200'][request.headers.language],
                data: campaignsData
            }).code(200);




            return reply({
                message: "success",
                data: campaignsData
            }).code(200);
        });
    });
}

// Get all campaigns by status
var allCampaignsByStatusHandler = (request, reply) => {

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

            promoCampaigns.getAllCampaignsByStatus(requestData, (err, campaigns) => {

                if (err) {
                    logger.error('No response: ' + JSON.stringify(err));
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                }
                var campaignsData = [];
                async.forEach(campaigns, (item, callbackloop) => {
                    campaignsData.push({
                        'id': item._id.toString(),
                        'title': item.title,
                        'code': item.code,
                        'startDate': item.startTime,
                        'endDate': item.endTime,
                        'cities': item.cities,
                        'category': item.category,
                        'zones': item.zones,
                        'status': item.status,
                        'globalUsageLimit': item.globalUsageLimit,
                        'totalClaims': item.globalClaimCount,
                        'qualifiedTrips': item.qualifyingTrips,
                        'perUserLimit': item.perUserLimit,
                        'unlockedCodes': item.unlockedCodes


                    });
                    return callbackloop(null);
                }, (loopErr) => {
                    data = campaignsData;
                    return resolve()
                });
            })
        });
    }


    let totalPromoCampaignCount = (request, reply) => {

        return new Promise((resolve, reject) => {

            promoCampaigns.getCountByStatus(requestData.status, (countDataError, countDataResponse) => {

                if (countDataError) {
                    logger.error('No response while getting count:' + JSON.stringify(err))
                    return reject(error['genericErrMsg']['500'][request.headers.language]);
                } else {
                    totalCount = countDataResponse;
                    return resolve();
                }

            });

        });

    }


    getAllCampaignsByStatus()

    .then(totalPromoCampaignCount)

    .then((response) => {
        return reply({
            message: error['promoCampaigns']['200'][request.headers.language],
            totalCount: totalCount,
            data: data
        }).code(200);

    }).catch((err) => {
        logger.error("Post referral new user referral code error: ", err);
        return reply({
            message: Joi.any().default(i18n.__('genericErrMsg')['500'])[request.headers.language]
        }).code(500);
    });


}

let campaignDetailsByIdValidator = {
    campaignId: Joi.string().required().description("Mandatory field for campaign id")
}

let camapignDetailsByIdHandler = (request, reply) => {

    let campaignId = request.params.campaignId;

    promoCampaigns.getCampaignById(campaignId, (error, response) => {
        logger.info(response);
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





// export handler and validator
module.exports = {
    allCampaignsHandler,
    allCampaignsByStatusValidator,
    allCampaignsByStatusHandler,
    campaignDetailsByIdValidator,
    camapignDetailsByIdHandler
    // getQualifiedTripsCountById,
}