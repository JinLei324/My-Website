// patch a campaign

require("moment");
const Joi = require("joi");
const async = require("async");
const logger = require('winston');
const Promise = require('promise');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const postPromo = require('../../../../models/promoCampaigns/promoCampaigns');
const error = require('../../../../statusMessages/responseMessage');



let campaignUpdateValidator = {
    payload: {
        campaignId: Joi.any().required().description('Mandatory Field.'),
        status: Joi.number().required().description('Mandatory Field. For status (1 -> "enabled", 2 -> "disabled", 3 -> "expired"). For approve status (1 - "approved", 2 - "pending" or 3 - "rejected")')
    }
}

// Post a new offer then reply the response
let campaignUpdateHandler = (request, reply) => {
    var campaignId = request.payload.campaignId;
    var campaignMongoIds = [];
    campaignId.forEach(function (entry) {
        var campaignMongoId = new ObjectID(entry);
        campaignMongoIds.push(campaignMongoId);
    });
    let dateTime = require('node-datetime');
    let dt = dateTime.create();
    let formatted = dt;
    let data = {
        "campaignIds": campaignMongoIds,
        "status": request.payload.status
    };

    postPromo.updateStatus(data, (err, res) => {
        if (err) {

            logger.error('Error while updating new offer : ' + err);
            return reply({ message: "Error while updating" }).code(500);
        }
        return reply({ message: "success" }).code(200);

    });
}

//update promo campaign
let promoCampaignUpdateValidator = {
    payload: {
        campaignId: Joi.string().required(),
        title: Joi.string().required().description('Mandatory field. '),
        code: Joi.string().description('Mandatory field. '),
        adminLiability: Joi.string().required().description('Mandatory Field'),
        storeLiability: Joi.string().required().description('Mandatory Field'),
        rewardTriggerType: Joi.number().required().description('Mandatory Field'),
        totalBusinessAmountRequired: Joi.number().allow("").description('Non mandatory field'),
        cities: Joi.any().required().description('Mandatory field. '),
        category: Joi.any().required().description('category field. '),
        zones: Joi.any().required().description('Mandatory field. '),
        rewardType: Joi.number().required().description('Mandatory field. '),
        paymentMethod: Joi.number().required().description('Mandatory field. '),
        isApplicableWithWallet: Joi.number().required().description('0-Not 1-Yes Mandatory field. '),        
        discount: Joi.any().required().description('Mandatory field'),
        usage: Joi.number().required().description('Mandatory field. '),
        startTime: Joi.any().required().description('Mandatory field. '),
        endTime: Joi.any().required().description('Mandatory field. '),
        globalUsageLimit: Joi.number().required().description('Mandatory field. '),
        perUserLimit: Joi.number().required().description('Mandatory field. '),
        globalClaimCount: Joi.number().required().description('Mandatory field. '),
        tripCount: Joi.number().required().description('Mandatory field. '),

        description: Joi.any().description('Mandatory field'),
        termsConditions: Joi.any().description('Mandatory field'),
        howITWorks: Joi.any().description('Mandatory field')
    }
}

let promoCampaignUpdateHandler = (request, reply) => {
    var currentDate = new Date();
    var currentISODate = currentDate.toISOString();
    let dateTime = require('node-datetime');
    let dt = dateTime.create();
    let formatted = dt['_created'];
    if (request.payload.discountType == 1) {
        var discountData = {
            discountType: 1,
            value: request.payload
        }
    } else if (request.payload.discountType == 2) {
        var discountData = {
            discountType: 1,
            value: request.payload,
            maxDiscount: requet.payload.maxDiscount
        }
    }

    let offersData = {
        campaignId: new ObjectID(request.payload.campaignId),
        title: request.payload.title,
        code: request.payload.code,
        storeLiability: request.payload.storeLiability,
        adminLiability: request.payload.adminLiability,
        status: 2,
        promoType: "campaign",
        cities: request.payload.cities,
        zones: request.payload.zones || '',
        category: request.payload.category || [],
        rewardTriggerType: request.payload.rewardTriggerType,
        totalBusinessAmountRequired: request.payload.totalBusinessAmountRequired,
        rewardType: request.payload.rewardType,
        paymentMethod: request.payload.paymentMethod,
        isApplicableWithWallet : request.payload.isApplicableWithWallet,
        discount: request.payload.discount,
        usage: request.payload.usage,
        startTime: request.payload.startTime,
        endTime: request.payload.endTime,
        globalUsageLimit: request.payload.globalUsageLimit,
        perUserLimit: request.payload.perUserLimit,
        globalClaimCount: request.payload.globalClaimCount,
        unlockedCodes: 0,
        qualifyingTrips: 0,
        vehicleType: 0,
        tripCount: request.payload.tripCount,
        created: new Date(),
        howITWorks: request.payload.howITWorks,
        description: request.payload.description,
        termsConditions: request.payload.termsConditions
    };
    postPromo.updatePromoCampaign(offersData, (err, res) => {
        if (err) {

            logger.error('Error while updating new offer : ' + err);
            return reply({ message: "Error while updating" }).code(500);
        }
        return reply({ message: "success" }).code(200);

    });
}


let response = {
    status: {
        200: { message: "success" },
        500: { message: "Error while updating" }
    }
}
module.exports = { campaignUpdateValidator, campaignUpdateHandler, promoCampaignUpdateHandler, promoCampaignUpdateValidator }  