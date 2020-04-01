// patch a campaign

require("moment");
const Joi = require("joi");
const async = require("async");
const logger = require('winston');
const Promise = require('promise');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const patch = require('../../../../models/referralCampaigns/referralCampaigns');
const error = require('../../../../statusMessages/responseMessage');



let referralCampaignUpdateValidator = {
    payload: {
        campaignId: Joi.any().required().description('Mandatory Field.'),
        status: Joi.number().required().description('Mandatory Field. For status (1 -> "enabled", 2 -> "disabled", 3 -> "expired"). For approve status (1 - "approved", 2 - "pending" or 3 - "rejected")')
    }
}

// Post a new offer then reply the response
let referralCampaignUpdateHandler = (request, reply) => {
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

    patch.updateReferralsStatus(data, (err, res) => {
        if (err) {
            logger.error('Error while updating new offer : ' + err);
            return reply({ message: "Error while updating" }).code(500);
        }
        return reply({ message: "success" }).code(200);

    });
}
/// update referal Campaign
let referralCampaignValidator = {
    payload: {
        referalId: Joi.string().required(),
        title: Joi.string().required().description('Mandatory field.'),
        cities: Joi.any().required().description('Mandatory field.'),
        zones: Joi.any().required().description('Mandatory field.'),
        currency: Joi.any().required().description('currency Mandatory field.'),
        currencySymbol: Joi.any().required().description('currencySymbol Mandatory field.'),

        description: Joi.string().required().allow('').description('Mandatory field.'),
        termsConditions: Joi.string().allow('').required().description('Mandatory field.'),
        howITWorks: Joi.string().allow('').description("Mandatory field"),

        rewardType: Joi.number().required().description('Mandatory field. 1-wallet credit, 2- coupon delivery'),
        // paymentMethod: Joi.number().required().description('Mandatory field. 1- card, 2-cash, 3-wallet'),

        startTime: Joi.string().required().description('Mandatory field. In iso format'),
        endTime: Joi.string().required().description('Mandatory field. In iso format'),

        offerAvailImmediateRefUser: Joi.boolean().required().description('Mandatory field. true-offerAvailImmediateRefUser, false-offerAvailImmediateRefUser'),
        referrerlRewardType: Joi.number().required().description('Mandatory field. 1- wallet credit, 2- coupon delivery'),
        referrerlDiscountType: Joi.number().required().description('Mandatory field. 1- fixed, 2-percentage'),
        referrerlDiscountAmt: Joi.number().required().description('Mandatory field. '),
        referrerWalletCreditAmount: Joi.number().required().description('Mandatory field. '),
        referralCategory: Joi.any().description('referralCategory field. '),
        referrerMaxDiscount: Joi.number().description('referralCategory field. '),

        offerAvailImmediateNewUser: Joi.boolean().required().description('Mandatory field. true- offerAvailImmediateNewUser, false- offerAvailImmediateNewUser'),
        newUserRewardType: Joi.number().required().description('Mandatory field. 1- wallet credit, 2- coupon delivery'),
        newUserDiscountType: Joi.number().required().description('Mandatory field. 1- fixed, 2-percentage'),
        newUserDiscountAmt: Joi.number().required().description('Mandatory field. '),
        newUserWalletCreditAmount: Joi.number().required().description('Mandatory field. '),
        newUserCategory: Joi.any().description('referralCategory field. '),
        newUserMaxDiscount: Joi.number().description('referralCategory field. '),

        perUserLimit: Joi.number().required().description('Mandatory field. '),

        rewardTriggerType: Joi.number().required().description('Mandatory field. 1- tripe count , 2- total business'),

        tripCount: Joi.number().allow('').description('Mandatory field. number of trips the new user needs to do to unlock the referral bonus 1'),
        newUserBillingAmtTrigger: Joi.number().allow('').description('Mandatory field. 100(amount of business the new user needs to give the app before the rewards are unlocked)')
    }
}

let referralCampaignHandler = (req, reply) => {
    if (req.payload.referrerlDiscountType == 1) {
        var referrerDiscountType = "fixed";
    } else {
        var referrerDiscountType = "percentage";
    }

    if (req.payload.newUserDiscountType == 1) {
        var newUserDiscountType = "fixed";
    } else {
        var newUserDiscountType = "percentage";
    }

    if (req.payload.rewardTriggerType == 1) {
        var rewardTriggerTypeString = "Trip Count"
    }
    else if (req.payload.rewardTriggerType == 2) {
        var rewardTriggerTypeString = "Total Business"
    } else {
        /*Default*/
        var rewardTriggerTypeString = 1;
    }

    if (req.payload.referrerlRewardType == 1) {
        var referrerlRewardTypeName = "Wallet Credit"
    } else if (req.payload.referrerlRewardType == 2) {
        var referrerlRewardTypeName = "Coupon Delivery"
    }

    if (req.payload.newUserRewardType == 1) {
        var newUserRewardTypeName = "Wallet Credit"
    } else if (req.payload.newUserRewardType == 2) {
        var newUserRewardTypeName = "Coupon Delivery"
    }

    var referralCampaignData = {
        "referalId": req.payload.referalId,
        "title": req.payload.title,

        'currency': req.payload.currency,
        'currencySymbol': req.payload.currencySymbol,
        "cities": req.payload.cities,
        "zones": req.payload.zones || '',
        "description": req.payload.description,
        "rewardTriggerType": req.payload.rewardType,
        "rewardTriggerTypeString": rewardTriggerTypeString,
        "startTime": req.payload.startTime,
        "endTime": req.payload.endTime,
        "referrerDiscount": {
            "offerAvailImmediate": req.payload.offerAvailImmediateRefUser,
            "rewardType": req.payload.referrerlRewardType,
            "rewardTypeName": referrerlRewardTypeName,
            "discountType": req.payload.referrerlDiscountType,
            "discountAmt": req.payload.referrerlDiscountAmt,
            "discountTypeName": referrerDiscountType,
            "walletCreditAmount": req.payload.referrerWalletCreditAmount,
            "category": req.payload.referralCategory || [],
            "maximumDiscountValue": req.payload.referrerMaxDiscount || 0,
        },
        "newUserDiscount": {
            "offerAvailImmediate": req.payload.offerAvailImmediateNewUser,
            "rewardType": req.payload.newUserRewardType,
            "rewardTypeName": newUserRewardTypeName,
            "discountType": req.payload.newUserDiscountType,
            "discountAmt": req.payload.newUserDiscountAmt,
            "discountTypeName": newUserDiscountType,
            "walletCreditAmount": req.payload.newUserWalletCreditAmount,
            "category": req.payload.newUserCategory || [],
            "maximumDiscountValue": req.payload.newUserMaxDiscount || 0,
        },

        "perUserLimit": req.payload.perUserLimit,
        "rewardTriggerType": req.payload.rewardTriggerType,
        "tripCount": req.payload.tripCount,

        "newUserBillingAmtTrigger": req.payload.newUserBillingAmtTrigger,
        "termsConditions": req.payload.termsConditions,
        "howITWorks": req.payload.howITWorks
    }


    patch.updateReferral(referralCampaignData, (err, res) => {
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
module.exports = { referralCampaignUpdateValidator, referralCampaignUpdateHandler, referralCampaignHandler, referralCampaignValidator }  