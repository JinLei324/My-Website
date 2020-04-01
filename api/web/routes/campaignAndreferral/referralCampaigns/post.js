// Post a new offer

require("request");
const underscore = require('underscore');
const Joi = require("joi");
const async = require("async");
const logger = require('winston');
const Promise = require('promise');
const superAgent = require('superagent')
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const referralCodeModel = require('../../../../models/referralCampaigns/referralCode');
const referralCampaigns = require('../../../../models/referralCampaigns/referralCampaigns');
const commonFunctions = require('../commonMethods/functions');
const claims = require('../../../../models/claims/claims');
const user = require('../../../../models/customer');
const email = require('../../../commonModels/email/customer');
const rabbitMq = require('../../../../library/rabbitMq');

// Validate the fields
let referralCodeValidator = {
    payload: {
        userId: Joi.string().required().description('Mandatory field. '),
        userType: Joi.string().required().description('Mandatory field. 1 for customer 2 for provider'),
        firstName: Joi.string().required().description('Mandatory field. '),
        lastName: Joi.string().required().description('Mandatory field. '),
        email: Joi.string().required().description('Mandatory field. '),
        countryCode: Joi.string().required().description('Mandatory field. '),
        phoneNumber: Joi.string().required().description('Mandatory field. '),
        referralCode: Joi.string().allow('').description('Mandatory field.'),
        cityId: Joi.string().required().description('Mandatory field.'),
        zoneId: Joi.string().allow('').description('Non Mandatory field.'),
        currency: Joi.string().allow('').description('Non Mandatory field'),
        currencySymbol: Joi.string().allow('').description('Non mandatory field')
    }
};

// Validate add referral code
let referralCampaignValidator = {
    payload: {
        title: Joi.string().required().description('Mandatory field.'),
        cities: Joi.any().required().description('Mandatory field.'),
        zones: Joi.any().required().description('Mandatory field.'),
        currency: Joi.any().required().description('currency Mandatory field.'),
        currencySymbol: Joi.any().required().description('currencySymbol Mandatory field.'),

        description: Joi.string().required().allow('').description('Mandatory field.'),
        termsConditions: Joi.string().allow('').required().description('Mandatory field.'),
        howITWorks: Joi.string().allow('').description("Mandatory field"),

        rewardType: Joi.number().required().description('Mandatory field. 1-wallet credit, 2- coupon delivery'),
        paymentMethod: Joi.number().required().description('Mandatory field. 1- card, 2-cash, 3-wallet'),

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
};



// Add a new referral campaign

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
        "title": req.payload.title,
        "promoType": "referralCampaign",
        "status": 2,
        "statusString": "active",
        "cities": req.payload.cities,
        'currency': req.payload.currency,
        'currencySymbol': req.payload.currencySymbol,
        "zones": req.payload.zones || "",
        "description": req.payload.description,
        // "rewardTriggerType": req.payload.rewardType,
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
        "codesGenerated": 0,
        "totalClaims": 0,
        "qualifyingTrips": 0,
        "unlockedCount": 0,
        "newUserBillingAmtTrigger": req.payload.newUserBillingAmtTrigger,
        "termsConditions": req.payload.termsConditions,
        "howITWorks": req.payload.howITWorks
    }

    // Insert data into referral campaigns collection
    referralCampaigns.postReferralCampaign(referralCampaignData, (err, res) => {

        return reply({
            statusCode: 200,
            message: 'Success',
        });
    });
}


// Post a new refferal code
let referralCodeHandler = (request, reply) => {

    request.payload = request;



    let currentTimeStamp = moment().unix();
    let firstName = request.payload.firstName;
    let referralCode = request.payload.referralCode;
    // let randomCode = commonFunctions.couponCode();
    let newUserRefferalCode = firstName.substring(0, 2).toUpperCase() + randomCode(3);
    let referralId = '';
    let referrerData = '';
    let referralCampaignData = '';
    let newUserCouponCode = randomCode(5);
    let cityId = request.payload.cityId;
    let isoDate = new Date().toISOString();

    let referralData = {
        "userId": request.payload.userId,
        "userType": request.payload.userType,
        "registeredOn": currentTimeStamp,
        "timeStamp": new Date(),
        "firstName": request.payload.firstName,
        "lastName": request.payload.lastName,
        "email": request.payload.email,
        "countryCode": request.payload.countryCode,
        "phoneNumber": request.payload.phoneNumber,
        "cityId": cityId,
        "referralCode": newUserRefferalCode || "",
        "totalRefers": 0,
        "referrals": []
    };

    let queueData = {
        "userId": request.payload.userId,
        "userType": request.payload.userType,
        "registeredOn": currentTimeStamp,
        "firstName": request.payload.firstName,
        "lastName": request.payload.lastName,
        "email": request.payload.email,
        "countryCode": request.payload.countryCode,
        "phoneNumber": request.payload.phoneNumber,
        "cityId": cityId,
        "referralCode": newUserRefferalCode || "",
        "referrals": [],
        "referrerCode": referralCode,
        "currency": request.payload.currency
    }

    //save the referral code data to the referrals collection

    let postReferralCode = () => {
        logger.info("Adding new referral code to the referrals collection");
        return new Promise((resolve, reject) => {
            referralCodeModel.postReferralCode(referralData, (err, res) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    };

    // Update users

    let updateUsers = () => {
        return new Promise((resolve, reject) => {
            logger.info("Updating users collection with referral code.......");
            var userData = {
                userId: referralData.userId,
                referralCode: newUserRefferalCode
            }
            user.addReferralCampaingsToUser(userData, (updateUserErr, updateUserResponse) => {
                if (updateUserErr) {
                    logger.info("pass1");
                    return reject(updateUserErr);
                } else {
                    logger.info("pass2");
                    return resolve();
                }
            });
        })
    }

    // 

    // Send email 
    let sendEmail = () => {
        logger.info("sending email........");
        return new Promise((resolve, reject) => {
            // email.newSingupReferal({
            //     toName: referralData.firstName + ' ' + referralData.lastName || '',
            //     to: referralData.email,
            //     referalCode: newUserRefferalCode

            // }, () => {

            // });
            email.getTemplateAndSendEmail({
                templateName: 'newUserReferralEmail.html',
                toEmail: referralData.email,
                trigger: "offers",
                subject: 'Your referral code',
                keysToReplace: {
                    customerName: referralData.firstName + ' ' + referralData.lastName || '',
                    newUserReferralCode: newUserRefferalCode
                }
            }, () => {
            });
            return resolve(true);
        })
    }


    if (referralCode.length == 0) {
        logger.info("Referral code not found......");
        // Check if referral code is not present then generate the code and save it to the users collection

        postReferralCode()

            .then(updateUsers)

            .then(sendEmail)

            .then((response) => {
                return reply({
                    message: "Referral code created successfully",
                });
            }).catch((err) => {
                logger.error("Post referral new user referral code error: ", err);
                return reply({
                    message: err.message
                });
            });

    } else {
        logger.info("Referral code found.............");
        logger.info("")
        referralCodeModel.getDetailsByCode(referralCode, (error, referrDetails) => {
            logger.info("checking valid code.....");
            if (error) {
                logger.info('error');
                return reply({
                    statusCode: 200,
                    message: 'Unable to get details',
                });
            } else if (referrDetails.length == 0) {
                logger.info("Code not found");
                return reply({
                    statusCode: 200,
                    message: 'Invalid code',
                });
            } else {
                logger.info("Valid referral code.......");
                logger.info("Inserting data to queue........");
                // insert the data into queue
                rabbitMq.sendToQueue(rabbitMq.queueReferralCampaign, queueData, (err, doc) => { });
                return reply({
                    statusCode: 200,
                    message: 'Request received',
                });
            }

        });
    }

}


function randomCode(count) {
    var randomText = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < count; i++)
        randomText += possible.charAt(Math.floor(Math.random() * possible.length));
    return randomText;
}


let response = {
    status: {
        200: {
            message: "Refferal code created successfully"
        },
        500: {
            message: "Error while creating referral code"
        }
    }
}

// export handler and validator
module.exports = {
    referralCodeValidator,
    referralCodeHandler,
    referralCampaignValidator,
    referralCampaignHandler,
    response

}