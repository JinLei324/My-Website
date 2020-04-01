// Post a new offer

require("request");
const Joi = require("joi");
const async = require("async");
const moment = require('moment');
const logger = require('winston');
const Promise = require('promise');
let isoDate = new Date().toISOString();
const superAgent = require('superagent')
const underscore = require('underscore');
const ObjectID = require('mongodb').ObjectID;

const config = require('../../config');
const customer = require('../../models/customer');
const notifications = require('../../library/fcm');
const claimModel = require('../../models/claims/claims');
const promoCampaingsHander = require('./promoCampaigns');
const email = require('../../web/commonModels/email/customer');
const promoCodes = require('../../models/promoCodes/promoCodes');
const referralCodeModel = require('../../models/referralCampaigns/referralCode');
const referralCampaigns = require('../../models/referralCampaigns/referralCampaigns');
const referralUnlockedLog = require('../../models/referralCampaignUnlockedLogs/referralCampaignUnlockedLog');

const referralCodeHandler = (requestData, reply) => {
    let currentTimeStamp = moment().unix();
    let firstName = requestData.firstName;
    let referralCode = requestData.referrerCode;
    let refferalCode = firstName.substring(0, 2).toUpperCase() + randomCode(3);
    let referralId = '';
    let referrerData = '';
    let referralCampaignDetails = '';
    let newUserCouponCode = randomCode(5);
    let referrerCouponCode = randomCode(5);
    let cityId = requestData.cityId;
    let zoneId = requestData.zoneId;
    let currency = requestData.currency;
    let currentDateTime = new Date();
    let newUserDetails = '';
    let referrerDetails = '';
    let referralData = {
        "userId": requestData.userId,
        "userType": requestData.userType,
        "registeredOn": currentDateTime,
        "firstName": requestData.firstName,
        "lastName": requestData.lastName,
        "email": requestData.email,
        "countryCode": requestData.countryCode,
        "phoneNumber": requestData.phoneNumber,
        "cityId": requestData.cityId,
        "referralCode": refferalCode,
        "totalRefers": 0,
        "referrals": []
    };
    /*
 @Post referral code for new user
  */
    const postReferralCode = () => {
        return new Promise((resolve, reject) => {
            referralCodeModel.postReferralCode(referralData, (err, res) => {
                if (err) {
                    return reject(err);
                } else {
                    // Send email
                    // email.newSingupReferal({
                    //     toName: referralData.firstName + ' ' + referralData.lastName || '',
                    //     to: referralData.email,
                    //     referalCode: refferalCode
                    // }, () => { });
                    email.getTemplateAndSendEmail({
                        templateName: 'newUserReferralEmail.html',
                        toEmail: referralData.email,
                        trigger: "offers",
                        subject: 'Your referral code',
                        keysToReplace: {
                            customerName: referralData.firstName + ' ' + referralData.lastName || '',
                            newUserReferralCode: refferalCode
                        }
                    }, () => {
                    });
                    return resolve(res);
                }
            });
        });
    };

    /*
    @ Check referral code is valid or not
     */
    const getReferralDetails = () => {
        return new Promise((resolve, reject) => {
            referralCodeModel.getDetailsByCode(referralCode, (error, referrDetails) => {
                if (error) {
                    return reject(error);
                } else if (referrDetails.length == 0) {
                    return reject();
                } else {
                    /*
                        Get new user details and store it in new user details
                     */
                    customer.getUserDetails(requestData.userId, (getUserDetailsError, getUserDetailsResponse) => {
                        if (getUserDetailsResponse) {
                            newUserDetails = getUserDetailsResponse[0];
                        }
                    });
                    referrerData = referrDetails;
                    return resolve(referrDetails);
                }

            });
        })
    }


    /*
    Get referrer details
     */

    const getReferrerDetailsById = () => {
        return new Promise((resolve, reject) => {
            customer.getUserDetails(referrerData[0].userId, (getUserDetailsError, getUserDetailsResponse) => {
                if (getUserDetailsResponse) {
                    referrerDetails = getUserDetailsResponse[0];
                    return resolve();
                } else {
                    return reject()
                }
            });
        })
    }


    /*
    @ Check if there is any referral campaign available in the city
     */

    const checkRunningCampaign = () => {
        return new Promise((resolve, reject) => {
            if (!zoneId) {
                zoneId = '';
            }
            let campaignData = {
                'cityId': cityId,
                'zoneId': zoneId,
                'isoDate': isoDate
            };
            referralCampaigns.validateReferral(campaignData, (validateReferralErr, validateReferralResponse) => {
                if (validateReferralErr) {
                    return reject(validateReferralErr);
                } else if (validateReferralResponse.length === 0) {
                    logger.info("No campaigns found");
                    return reject("No campaigns found");
                } else {
                    return resolve(validateReferralResponse);
                }
            });
        })
    }

    /*
    If referral campaign found then check details and give discount 
    @rewardTriggerType 1= trip count, 2= total business

    @rewardType 1= wallet credit, 2= coupon delivery

    @discount type 1= fixed 2= percentage

     */
    /*
    @update reffer data
     */
    const updateReferrerData = () => {
        return new Promise((resolve, reject) => {
            let requestReferrerData = {
                id: referrerData[0]._id.toString(),
                userId: referralData.userId,
                registeredOn: currentDateTime,
                userType: referralData.userType,
                firstname: referralData.firstName,
                lastName: referralData.lastName,
                email: referralData.email,
                countryCode: referralData.countryCode,
                phoneNumber: referralData.phoneNumber,
                referralCode: refferalCode

            };
            referralCodeModel.updateReferals(requestReferrerData, (updateErr, updateRes) => {
                if (updateRes) {
                    return resolve();
                } else {
                    return reject();
                }
            });
        });
    };

    const initiateDiscount = (referralCampaignDatas) => {
        return new Promise((resolve, reject) => {
            /*
                 Increase codes generated count to 1
              */
            referralCampaigns.increaseCodeGeneratedCount(referralCampaignDatas[0]._id.toString(), () => { });
            /*
            Update campaign id inside new user data
             */

            let dataToUpdateNewUser = {
                userId: referralData.userId,
                campaignId: referralCampaignDatas[0]._id.toString(),
                referrerName: referrerData[0].firstName + referrerData[0].lastName,
                referrerId: referrerData[0].userId,
            }
            referralCodeModel.updateCampaignIdWithNewUser(dataToUpdateNewUser, () => { })

            /*
            Update campaign id inside referrer data for new user
             */
            let dataToUpdateReferrer = {
                newUserId: referralData.userId,
                referrerId: referrerData[0].userId,
                campaignId: referralCampaignDatas[0]._id.toString()
            }
            referralCodeModel.updateCampaignIdWithReferrerData(dataToUpdateReferrer, () => { });

            var referralCampaignData = referralCampaignDatas[0]

            /*
            @ reward trigger type 1 = trip count, 2= total business
             */
            //LAXMAN CODE
            let newUserInitiate = false;
            let referrerInitiate = false;
            let newUserDiscountDetails = referralCampaignData.newUserDiscount;
            let referrerDiscountDetails = referralCampaignData.referrerDiscount;
            let referrerMLM = referralCampaignData.referrerMLM;
            let getUserDetails = referrerData[0];
            // let referrerId = getUserDetails._id.toString();
            if (referralCampaignData.newUserDiscount.offerAvailImmediate && referralCampaignData.newUserDiscount.offerAvailImmediate == true) {
                newUserInitiate = true;
                if (newUserDiscountDetails.rewardType == 1) {
                    // Credit into user Wallet

                    logger.info("Crediting discount to new user wallet ");
                    /*
                    Wallet credit data
                    */
                    let walletCreditData = {
                        campaignFlag: "newUserReferralCampaign",
                        bookingId: "N/A",
                        email: requestData.email,
                        customerName: requestData.firstName,
                        userId: requestData.userId,
                        amount: newUserDiscountDetails.discountAmt,
                        currency: newUserDetails.currency || 'USD',
                        currencySymbol: newUserDetails.currencySymbol || '$',
                        userType: 1,
                        cityId: "N/A",
                        cityName: "N/A"
                    }
                    // 3wallet credit new user
                    promoCampaingsHander.walletUpdateHandler(walletCreditData);

                    let claimDataToUpdate = {
                        "cartId": 'N/A',
                        "userId": requestData.userId,
                        "promoId": referralCampaignDatas[0]._id.toString(),
                        "userName": requestData.firstName + requestData.lastName,
                        "userEmail": requestData.email,
                        "userPhone": requestData.phoneNumber,
                        "couponCode": "N/A",
                        "currency": requestData.currency,
                        "currencySymbol": requestData.currencySymbol,
                        "cartValue": requestData.cartValue,
                        "discountValue": newUserDiscountDetails.discountAmt,
                        "deliveryFee": requestData.deliveryFee,
                        "lockedTimeStamp": new Date(),
                        "applicableOn": "cartValue",
                        "unlockedTimeStamp": new Date(),
                        "claimTimeStamp": new Date(),
                        "discount": newUserDiscountDetails,
                        "status": "claimed",
                        "bookings": ""
                    }
                    claimModel.addClaimData(claimDataToUpdate, (error, response) => {
                        logger.info("add claim data response");
                        logger.info(response);
                    });

                    /*
                    Increase unlocked count
                    */
                    referralCampaigns.increaseUnlockedCodeCount(referralCampaignData._id.toString(), () => { });
                    /*
                    Add data to referral unlocked log
                    */
                    let unlockedTripData = {
                        campaignId: referralCampaignDatas[0]._id.toString(),
                        campaignTitle: referralCampaignDatas[0].title,
                        userName: requestData.firstName + requestData.lastName,
                        userId: requestData.userId,
                        referreId: referrerData[0].userId,
                        referralCode: referralCode,
                        rewardType: "Wallet Credit",
                        couponCode: "N/A",
                        newUserDiscount: referralCampaignDatas[0].newUserDiscount,
                        referrerDiscount: referralCampaignDatas[0].referrerDiscount,
                        deliveredTo: requestData.firstName + requestData.lastName,
                        timeStamp: new Date()
                    }
                    referralUnlockedLog.postReferralUnlockedTripData(unlockedTripData, () => { });

                    /*
                    Send push notification new user
                    */
                    let request = {
                        fcmTopic: newUserDetails.fcmTopic,
                        action: 111,
                        pushType: 7,
                        title: config.APP_NAME,
                        msg: "Congratulations! You've earned a wallet credit of " + newUserDiscountDetails.discountAmt + ".",
                        data: [],
                        deviceType: newUserDetails.mobileDevices.deviceType
                    }
                    notifications.notifyFcmTopic(request, (e, r) => { });
                } else {
                    // Coupon for new user

                    logger.info("New user reward type is coupon delivery")
                    logger.info("Posting new coupon code and delivering via email to new user");
                    /*
                    Increase unlocked count
                    */
                    referralCampaigns.increaseUnlockedCodeCount(referralCampaignData._id.toString(), () => { });
                    /*
                    Add data to referral unlocked log
                    */

                    let unlockedTripData = {
                        campaignId: referralCampaignDatas[0]._id.toString(),
                        campaignTitle: referralCampaignDatas[0].title,
                        userName: requestData.firstName + requestData.lastName,
                        referralCode: referralCode,
                        rewardType: "Coupon Delivery",
                        couponCode: newUserCouponCode,
                        userId: requestData.userId,
                        referreId: referrerData[0].userId,
                        newUserDiscount: referralCampaignDatas[0].newUserDiscount,
                        referrerDiscount: referralCampaignDatas[0].referrerDiscount,
                        deliveredTo: requestData.firstName + requestData.lastName,
                        timeStamp: new Date()
                    }
                    referralUnlockedLog.postReferralUnlockedTripData(unlockedTripData, () => { });

                    // Generate coupon code 

                    var campaignPromoCodeDate = {
                        "title": "This promo code generated for referrer towards referral campaign",
                        "code": newUserCouponCode,
                        "adminLiability": 100,
                        "storeLiability": "0",
                        "status": 2,
                        "promoType": "referralPromo",
                        "cities": referralCampaignData.cities,
                        "zones": "0",
                        "rewardType": 1,
                        "paymentMethod": 3,
                        "discount": {
                            typeId: newUserDiscountDetails.discountType,
                            typeName: newUserDiscountDetails.discountTypeName,
                            value: newUserDiscountDetails.discountAmt
                        },
                        "category": newUserDiscountDetails.category || [],
                        "startTime": referralCampaignData.startTime,
                        "endTime": referralCampaignData.endTime,
                        "globalUsageLimit": 1,
                        "perUserLimit": 1,
                        "globalClaimCount": 0,
                        "vehicleType": 4,
                        "termsAndConditions": referralCampaignDatas[0].termsAndConditions,
                        "description": referralCampaignDatas[0].description,
                        "howItWorks": referralCampaignDatas[0].howItWorks,
                        "userId": requestData.userId
                    };
                    postPromoCode(campaignPromoCodeDate);

                    let claimDataToUpdate = {
                        "cartId": 'N/A',
                        "userId": requestData.userId,
                        "promoId": referralCampaignDatas[0]._id.toString(),
                        "userName": requestData.firstName + requestData.lastName,
                        "userEmail": requestData.email,
                        "userPhone": requestData.phoneNumber,
                        "couponCode": "N/A",
                        "currency": requestData.currency,
                        "currencySymbol": requestData.currencySymbol,
                        "cartValue": requestData.cartValue,
                        "discountValue": newUserDiscountDetails.discountAmt,
                        "deliveryFee": requestData.deliveryFee,
                        "lockedTimeStamp": new Date(),
                        "applicableOn": "cartValue",
                        "unlockedTimeStamp": new Date(),
                        "claimTimeStamp": new Date(),
                        "discount": newUserDiscountDetails,
                        "status": "claimed",
                        "bookings": ""
                    }

                    claimModel.addClaimData(claimDataToUpdate, (error, response) => {
                    });

                    /*
                    Send push notification
                    */

                    let request = {
                        fcmTopic: newUserDetails.fcmTopic,
                        action: 111,
                        pushType: 7,
                        title: config.APP_NAME,
                        msg: "Congratulations! You've earned a discount coupon" + newUserCouponCode + ". Use this on your next purchase to receive discounts.",
                        data: [],
                        deviceType: newUserDetails.mobileDevices.deviceType
                    }
                    notifications.notifyFcmTopic(request, (e, r) => { });
                    email.newUserReferralEarnedPromoCode({
                        toName: newUserDetails.firstName || '',
                        to: newUserDetails.email,
                        promoCode: newUserCouponCode,
                        details: referralCampaignDatas[0].description,
                        howItWorks: referralCampaignDatas[0].howITWorks,
                        termsCondition: referralCampaignDatas[0].termsConditions

                    }, () => { });
                }
            }
            if (referralCampaignData.referrerDiscount.offerAvailImmediate && referralCampaignData.referrerDiscount.offerAvailImmediate == true) {
                referrerInitiate = true;
                if (referrerDiscountDetails.rewardType == 1) {
                    // Credit into user Wallet

                    logger.info("crediting wallet amount to the referrer");

                    let walletCreditDataForReferrer = {
                        campaignFlag: "referralCampaign",
                        bookingId: "N/A",
                        userId: referrerDetails._id.toString(),
                        email: referrerDetails.email,
                        customerName: referrerDetails.firstName,
                        amount: referrerDiscountDetails.discountAmt,
                        currency: referrerDetails.currency || 'USD',
                        currencySymbol: referrerDetails.currencySymbol || '$',
                        userType: 1,
                        cityId: "N/A",
                        cityName: "N/A"

                    }
                    //3embed wallet credit for old user
                    promoCampaingsHander.walletUpdateHandler(walletCreditDataForReferrer)
                    /*
                    Increase unlocked count
                    */
                    referralCampaigns.increaseUnlockedCodeCount(referralCampaignData._id.toString(), () => { });
                    /*
                    Add data to referral unlocked log
                    */
                    let unlockedTripData = {
                        campaignId: referralCampaignDatas[0]._id.toString(),
                        campaignTitle: referralCampaignDatas[0].title,
                        userName: requestData.firstName + requestData.lastName,
                        referralCode: referralCode,
                        rewardType: "Wallet Credit",
                        couponCode: "N/A",
                        userId: requestData.userId,
                        referreId: referrerData[0].userId,
                        newUserDiscount: referralCampaignDatas[0].newUserDiscount,
                        referrerDiscount: referralCampaignDatas[0].referrerDiscount,
                        deliveredTo: getUserDetails.firstName + getUserDetails.lastName,
                        timeStamp: new Date()
                    }
                    referralUnlockedLog.postReferralUnlockedTripData(unlockedTripData, () => { });

                    /*
                    Send push notification
                    */
                    let request = {
                        fcmTopic: referrerDetails.fcmTopic,
                        action: 111,
                        pushType: 7,
                        title: config.APP_NAME,
                        msg: "Congratulations! You've earned a wallet credit of " + referrerDiscountDetails.discountAmt + ".",
                        data: [],
                        deviceType: referrerDetails.mobileDevices.deviceType
                    }
                    notifications.notifyFcmTopic(request, (e, r) => { });
                } else {
                    // Coupon for refferer user

                    logger.info("Referrer reward type is coupon delivery");
                    logger.info("Posting new promo code and delivering via email to referrer");
                    // Generate coupon code and send by email
                    var campaignPromoCodeDate = {
                        "title": "This promo code generated for referrer towards referral campaign",
                        "code": referrerCouponCode,
                        "adminLiability": 100,
                        "storeLiability": "0",
                        "status": 2,
                        "promoType": "referralPromo",
                        "cities": referralCampaignData.cities,
                        "zones": "0",
                        "rewardType": 1,
                        "paymentMethod": 3,
                        "discount": {
                            typeId: referrerDiscountDetails.discountType,
                            typeName: referrerDiscountDetails.discountTypeName,
                            value: referrerDiscountDetails.discountAmt
                        },
                        "category": referrerDiscountDetails.category || [],
                        "startTime": referralCampaignData.startTime,
                        "endTime": referralCampaignData.endTime,
                        "globalUsageLimit": 1,
                        "perUserLimit": 1,
                        "globalClaimCount": 0,
                        "vehicleType": 4,
                        "termsAndConditions": referralCampaignDatas[0].termsConditions,
                        "description": referralCampaignDatas[0].description,
                        "howItWorks": referralCampaignDatas[0].howITWorks,
                        "userId": referrerDetails._id.toString()
                    };
                    postPromoCode(campaignPromoCodeDate);

                    /*
                    Increase unlocked count
                    */
                    referralCampaigns.increaseUnlockedCodeCount(referralCampaignData._id.toString(), () => { });
                    /*
                Send push notification
                    */

                    let request = {
                        fcmTopic: referrerDetails.fcmTopic,
                        action: 111,
                        pushType: 7,
                        title: config.APP_NAME,
                        msg: "Congratulations! You've earned a wallet credit of " + referrerDiscountDetails.discountAmt + ".",
                        data: [],
                        deviceType: referrerDetails.mobileDevices.deviceType
                    }
                    notifications.notifyFcmTopic(request, (e, r) => { });

                    /*
                    Add data to referral unlocked log
                    */
                    let unlockedTripData = {
                        campaignId: referralCampaignDatas[0]._id.toString(),
                        campaignTitle: referralCampaignDatas[0].title,
                        userName: requestData.firstName + requestData.lastName,
                        referralCode: referralCode,
                        rewardType: "Coupon Delivery",
                        userId: requestData.userId,
                        referreId: referrerData[0].userId,
                        couponCode: referrerCouponCode,
                        newUserDiscount: referralCampaignDatas[0].newUserDiscount,
                        referrerDiscount: referralCampaignDatas[0].referrerDiscount,
                        deliveredTo: getUserDetails.firstName + getUserDetails.lastName,
                        timeStamp: new Date()
                    }
                    referralUnlockedLog.postReferralUnlockedTripData(unlockedTripData, () => { });

                    email.promoCode({
                        toName: referrerDetails.firstname || '',
                        to: referrerDetails.email,
                        newUserName: requestData.firstName,
                        promoCode: referrerCouponCode,
                        details: referralCampaignDatas[0].description,
                        howItWorks: referralCampaignDatas[0].howITWorks,
                        termsCondition: referralCampaignDatas[0].termsConditions

                    }, () => { });
                }

                if (referralCampaignData.mlmStatus && referralCampaignData.mlmStatus == true) {
                    let mlmLevels = referrerMLM.mlmLevels || 0;
                    let mlmLevelsArr = [];
                    for (i = 1; i <= mlmLevels; i++) {
                        mlmLevelsArr.push(i);
                    }
                    let userData = referrerDetails;
                    userData.userId = userData._id.toString();
                    logger.info("mlm level array", mlmLevelsArr);
                    async.eachSeries(mlmLevelsArr, function (level, callbackLoop) {
                        logger.info("checking level of :", level);
                        referralCodeModel.getReferrerDetailsByNewUserId(userData.userId, (err, resData) => {
                            if (err) {
                                callbackLoop(err);
                            } else if (resData) {
                                userData = resData;
                                customer.getUserDetails(resData.userId, (getrefmlmErr, getrefmlmRes) => {
                                    if (getrefmlmRes) {
                                        var refMlmData = getrefmlmRes[0];
                                        //give benefit
                                        logger.info(level + " got credit for email " + refMlmData.email);
                                        if (referrerDiscountDetails.rewardType == 1) {
                                            // Credit into user Wallet
                                            logger.info("crediting wallet amount to the referrer level" + level);
                                            let walletCreditDataForReferrer = {
                                                campaignFlag: "referralCampaign",
                                                bookingId: "N/A",
                                                userId: refMlmData._id.toString(),
                                                email: refMlmData.email,
                                                customerName: refMlmData.firstName,
                                                amount: referrerMLM.discountAmt,
                                                currency: refMlmData.currency || 'USD',
                                                currencySymbol: refMlmData.currencySymbol || '$',
                                                userType: 1,
                                                cityId: "N/A",
                                                cityName: "N/A"
                                            }
                                            //3embed wallet credit for old user
                                            promoCampaingsHander.walletUpdateHandler(walletCreditDataForReferrer)
                                            /*
                                            Increase unlocked count
                                            */
                                            referralCampaigns.increaseUnlockedCodeCount(referralCampaignData._id.toString(), () => { });
                                            /*
                                            Add data to referral unlocked log
                                            */
                                            let unlockedTripData = {
                                                campaignId: referralCampaignDatas[0]._id.toString(),
                                                campaignTitle: referralCampaignDatas[0].title,
                                                userName: requestData.firstName + requestData.lastName,
                                                referralCode: referralCode,
                                                rewardType: "Wallet Credit",
                                                couponCode: "N/A",
                                                userId: requestData.userId,
                                                referreId: refMlmData._id.toString(),
                                                newUserDiscount: referralCampaignDatas[0].newUserDiscount,
                                                referrerDiscount: referralCampaignDatas[0].referrerDiscount,
                                                deliveredTo: refMlmData.firstName + " " + refMlmData.lastName,
                                                timeStamp: new Date()
                                            }
                                            referralUnlockedLog.postReferralUnlockedTripData(unlockedTripData, () => { });

                                            /*
                                            Send push notification
                                            */
                                            let request = {
                                                fcmTopic: refMlmData.fcmTopic,
                                                action: 111,
                                                pushType: 7,
                                                title: config.APP_NAME,
                                                msg: "Congratulations! You've earned a wallet credit of " + referrerDiscountDetails.discountAmt + ".",
                                                data: [],
                                                deviceType: refMlmData.mobileDevices.deviceType
                                            }
                                            notifications.notifyFcmTopic(request, (e, r) => { });
                                        } else {
                                            // Coupon for refferer user
                                            let referrerCouponCodeMLM = randomCode(5);
                                            logger.info("Referrer reward type is coupon delivery for lvl ", level);
                                            logger.info("Posting new promo code and delivering via email to referrer lvl ", level);
                                            // Generate coupon code and send by email
                                            var campaignPromoCodeDate = {
                                                "title": "This promo code generated for referrer towards referral campaign",
                                                "code": referrerCouponCodeMLM,
                                                "adminLiability": 100,
                                                "storeLiability": "0",
                                                "status": 2,
                                                "promoType": "referralPromo",
                                                "cities": referralCampaignData.cities,
                                                "zones": "0",
                                                "rewardType": 1,
                                                "paymentMethod": 3,
                                                "discount": {
                                                    typeId: referrerDiscountDetails.discountType,
                                                    typeName: referrerDiscountDetails.discountTypeName,
                                                    value: referrerDiscountDetails.discountAmt
                                                },
                                                "category": referrerDiscountDetails.category || [],
                                                "startTime": referralCampaignData.startTime,
                                                "endTime": referralCampaignData.endTime,
                                                "globalUsageLimit": 1,
                                                "perUserLimit": 1,
                                                "globalClaimCount": 0,
                                                "vehicleType": 4,
                                                "termsAndConditions": referralCampaignDatas[0].termsConditions,
                                                "description": referralCampaignDatas[0].description,
                                                "howItWorks": referralCampaignDatas[0].howITWorks,
                                                "userId": refMlmData._id.toString()
                                            };
                                            postPromoCode(campaignPromoCodeDate);

                                            /*
                                            Increase unlocked count
                                            */
                                            referralCampaigns.increaseUnlockedCodeCount(referralCampaignData._id.toString(), () => { });
                                            /*
                                        Send push notification
                                            */

                                            let request = {
                                                fcmTopic: refMlmData.fcmTopic,
                                                action: 111,
                                                pushType: 7,
                                                title: config.APP_NAME,
                                                msg: "Congratulations! You've earned a wallet credit of " + referrerDiscountDetails.discountAmt + ".",
                                                data: [],
                                                deviceType: refMlmData.mobileDevices.deviceType
                                            }
                                            notifications.notifyFcmTopic(request, (e, r) => { });

                                            /*
                                            Add data to referral unlocked log
                                            */
                                            let unlockedTripData = {
                                                campaignId: referralCampaignDatas[0]._id.toString(),
                                                campaignTitle: referralCampaignDatas[0].title,
                                                userName: requestData.firstName + requestData.lastName,
                                                referralCode: referralCode,
                                                rewardType: "Coupon Delivery",
                                                userId: requestData.userId,
                                                referreId: refMlmData._id.toString(),
                                                couponCode: referrerCouponCodeMLM,
                                                newUserDiscount: referralCampaignDatas[0].newUserDiscount,
                                                referrerDiscount: referralCampaignDatas[0].referrerDiscount,
                                                deliveredTo: refMlmData.firstName + refMlmData.lastName,
                                                timeStamp: new Date()
                                            }
                                            referralUnlockedLog.postReferralUnlockedTripData(unlockedTripData, () => { });

                                            email.promoCode({
                                                toName: refMlmData.firstname || '',
                                                to: refMlmData.email,
                                                newUserName: requestData.firstName,
                                                promoCode: referrerCouponCodeMLM,
                                                details: referralCampaignDatas[0].description,
                                                howItWorks: referralCampaignDatas[0].howITWorks,
                                                termsCondition: referralCampaignDatas[0].termsConditions

                                            }, () => { });
                                        }
                                        callbackLoop(null);
                                    } else {
                                        callbackLoop("No Referrer");
                                    }
                                });
                            } else {
                                callbackLoop("No Referrer");
                            }
                        });
                    }, function (err) {
                        logger.info(err);
                        logger.info("completed mlm ");
                    });
                }
            }
            let referrerCustomerData = {
                "referrerId": referrerData[0].userId,
                "referrerEmail": referrerData[0].email,
                "referrerName": referrerData[0].firstName + referrerData[0].lastName
            }
            if (referrerInitiate == true && newUserInitiate == true) {
                updateUsers(requestData.userId, 1, referrerInitiate, newUserInitiate, referralCampaignData._id.toString(), referrerCustomerData, refferalCode);
                return resolve();
            } else {
                updateUsers(requestData.userId, 0, referrerInitiate, newUserInitiate, referralCampaignData._id.toString(), referrerCustomerData, refferalCode);
                return resolve();
            }
        });
    }

    postReferralCode()
        .then(getReferralDetails)
        .then(getReferrerDetailsById)
        .then(updateReferrerData)
        .then(checkRunningCampaign)
        .then(initiateDiscount)
        .then((response) => {
            logger.info("Request executed successfully");
            return reply(null)

        }).catch((err) => {
            logger.error("Post referral new user referral code error: ", err);
            return reply(null)
        });

}


function randomCode(count) {
    let randomText = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < count; i++)
        randomText += possible.charAt(Math.floor(Math.random() * possible.length));
    return randomText;
}


/*
@Function to update users colletion with referral discount data
@referralDiscountStatus 0- Pending, 1 - claimed

@params: referralDiscountStatus: 0/1
        campaignId: campaignId
        
 */

function updateUsers(userId, referralDiscountStatus, referrerInitiate, newUserInitiate, campaignId, referrerData, refferalCode) {
    logger.info("updating user data.....", refferalCode);
    var referralDataDetails = {
        "userId": userId,
        "referralDiscountStatus": referralDiscountStatus,
        "referrerInitiate": referrerInitiate,
        "newUserInitiate": newUserInitiate,
        "campaignId": campaignId,
        "referrerData": referrerData,
        "referralCode": refferalCode || ""
    }
    customer.updateUserData(referralDataDetails, (updateReferralDataError, updateReferralDataResponse) => {
        logger.info("updating user data response console");
        if (updateReferralDataResponse) {
            return true;
        } else {
            return false;
        }
    });
}

function postPromoCode(data) {
    promoCodes.postCouponCode(data, (postPromoCodeError, postPromoCodeResponse) => {
        if (postPromoCodeResponse) {
            return true;
        } else {
            return false;
        }
    })
}

// export handler and validator
module.exports = {
    referralCodeHandler,
    postPromoCode
}