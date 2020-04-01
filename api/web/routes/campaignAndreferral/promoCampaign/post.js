// Post a new offer

require("moment");
const Joi = require("joi");
const async = require("async");
const logger = require('winston');
const Promise = require('promise');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const postPromo = require('../../../../models/promoCampaigns/promoCampaigns');
const error = require('../../../../statusMessages/responseMessage');


// Validate the fields
let offersValidator = {
    payload: {
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
        tripCount: Joi.any().allow().description('Mandatory field. '),
        discountValue: Joi.number().required().description('Mandatory field'),
        description: Joi.any().description('Mandatory field'),
        termsConditions: Joi.any().description('Mandatory field'),
        howITWorks: Joi.any().description('Mandatory field')


    }
};

// Post a new offer then reply the response
let offersHandler = (request, reply) => {
    // let startTimeStamp = moment(request.payload.startTime, "DD-MM-YYYY HH:mm:ss").format('x');
    // let endTimeStamp = moment(request.payload.endTime, "DD-MM-YYYY HH:mm:ss").format('x');

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
        title: request.payload.title,
        code: request.payload.code,
        storeLiability: request.payload.storeLiability,
        adminLiability: request.payload.adminLiability,
        status: 2,
        promoType: "campaign",
        cities: request.payload.cities,
        zones: request.payload.zones || "",
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
        tripCount: request.payload.tripCount || 0,
        created: currentISODate,
        howITWorks: request.payload.howITWorks,
        description: request.payload.description,
        termsConditions: request.payload.termsConditions
    };

    postPromo.postCampaign(offersData, (err, res) => {
        if (err) {
            logger.error('Error while posting new offer : ' + err);
            return reply({
                message: "Error while posting new promo",
                data: {
                    status: false
                }
            }).code(500);
        }
        return reply({
            message: "Promo added successfully",
            data: {
                status: true
            }
        }).code(200);

    });
}
let response = {
    status: {
        200: {
            message: "Promo added successfully"
        },
        500: {
            message: "Error while posting new promo"
        }
    }
}

// export handler and validator
module.exports = {
    offersValidator,
    offersHandler,
    response
}