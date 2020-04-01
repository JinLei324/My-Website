/*
@Post the promo request
@async call to validate to check city, zone, global claim count, global usage limit, payment method, status, timestamp
@
 */

const Joi = require("joi");
const http = require("http");
const async = require("async");
const moment = require("moment");
const logger = require('winston');
const Promise = require('promise');
const request = require("request");
const superAgent = require('superagent')
const underscore = require('underscore');
const ObjectID = require('mongodb').ObjectID;

const config = require('../../config');
const customer = require('../../models/customer');
const notifications = require('../../library/fcm');
const promoCode = require('../../models/promoCodes');
const inputTripLogs = require('../../models/logs');
const claimModel = require('../../models/claims');
const email = require('../../web/commonModels/email/customer');
const orderAnalytics = require('../../models/bookingAnalytics');
const transaction = require('../../web/commonModels/wallet/transcation');
const promoCampaigns = require('../../models/promoCampaigns/promoCampaigns');
const referralCodeModel = require('../../models/referralCampaigns/referralCode');
const validatePromoCodes = require('../../models/validatePromoCodes/validatePromoCodes');
const referralCampaignModel = require('../../models/referralCampaigns/referralCampaigns');
const campaignQualifiedTripLogs = require('../../models/promoCampaigns/campaignQualifiedTrips');
const campaignUnlockedTripLogModel = require('../../models/campaignUnlockedLogs/campaignUnlockedLogs');
const referralUnlockedLog = require('../../models/referralCampaignUnlockedLogs/referralCampaignUnlockedLog');

let referralCampaignData = '';
let discount = 0;
// Validate the fields

const postRequestHandler = (requestDatas, reply) => {
    // logger.error("Received data at the worker's handler", requestDatas);
    let currentDate = new Date();
    let currentISODate = currentDate.toISOString();
    let dateTime = require('node-datetime');
    let dt = dateTime.create();
    let formatted = dt._created;
    let referrerCustomerDetails = '';
    let referrerDetails = '';
    let customerDetails = '';
    let requestData = {
        bookingId: requestDatas.bookingId,
        userId: requestDatas.userId,
        customerName: requestDatas.customerName,
        cityId: requestDatas.cityId,
        cityName: requestDatas.cityName,
        zoneId: requestDatas.cityId,
        paymentMethod: requestDatas.paymentMethod,
        paymentMethodString: requestDatas.paymentMethodString,
        bookingTime: requestDatas.bookingTime,
        deliveryFee: requestDatas.deliveryFee,
        cartValue: requestDatas.cartValue,
        currency: requestDatas.currency,
        currencySymbol: requestDatas.currencySymbol,
        created: formatted,
        email: requestDatas.email,
        cartId: requestDatas.cartId
    };
    let offeredCampaign = [];
    let message = {};
    let userDetails = "";
    let campaignDetails = "";

    /*
    @post input trip logs
     */
    const postNewInputTripLogData = () => {
        return new Promise((resolve, reject) => {
            inputTripLogs.postInputLogs(requestData, (error, response) => {
            });
            return resolve();
        });
    }

    /*
    @Function to validate the campaign details
     */
    const validatePromoCampaign = () => {
        return new Promise((resolve, reject) => {
            validatePromoCodes.validateCampaign(requestData, (error, promoDatas) => {


                if (error) {
                    return reject(error);
                } else if (promoDatas.length == 0) {

                    return reject("No promo campaigns found");
                } else {
                    return resolve(promoDatas);
                }
            })


        });
    }

    /*
    @Function to validate and initiate all available campaigns for the trip
     */
    const checkAndInitiateDiscount = (promoDatas) => {
        // logger.info("Validating booking for discount ......");
        return new Promise((resolve, reject) => {
            var availablePromoIds = [];
            // Check in promo datas array if user exits or not
            promoDatas.forEach(function (entry) {
                /*
                @post qualified trip log data
                 */
                /*
                Check if globalClaimCount is greater than or equals to globalUsageLimit then change the status of the campaign to expire
                 */
                if (entry.globalUsageLimit <= entry.globalClaimCount) {//Global usage limit rechaed
                    // logger.info("Global usage limit rechaed");

                    /*Expire the offer*/
                    let updateStatusData = {
                        campaignIds: [entry._id],
                        status: 4
                    }
                    promoCampaigns.updateStatus(updateStatusData, (updateStatusError, updateStatusResponse) => {
                        // logger.info("Campaign expired successfully");
                        return reject();
                    });

                } else {

                    if ("users" in entry) { //user is use once
                        /*
                        @find if user already exists in the user array
                         */
                        var promoUser = underscore.findWhere(entry.users, {
                            userId: requestData.userId
                        });
                        // if user exists


                        if (promoUser) {//already user use this campaign
                            // logger.error('User found');
                            if (promoUser.claimCount == entry.perUserLimit || promoUser.claimCount > entry.perUserLimit) {

                                // Do nothing
                            } else {
                                // logger.info("valid cart ,existing user ");

                                validateAndInitiateDiscount(requestData, requestDatas, promoUser, entry, 0, requestData.cartValue + requestData.deliveryFee);
                                return resolve();
                            }
                        } else {//user first time use this campign
                            // logger.error("User not found. Updating booking data..............");
                            var userData = {
                                "promoId": entry._id,
                                "userId": requestData.userId,
                                "bookings": [{
                                    "cartId": requestDatas.cartId,
                                    "bookingId": requestData.bookingId,
                                    "bookingTime": formatted,
                                    "cityId": requestData.cityId,
                                    "zoneId": requestData.zoneId,
                                    "cartValue": requestData.cartValue,
                                    "deliveryFee": requestData.deliveryFee,
                                    "paymentMethod": requestData.paymentMethod,
                                    "timeStamp": new Date()
                                }],
                                "unlockDate": formatted,
                                "claimCount": 0,
                                "totalBusiness": requestData.cartValue + requestData.deliveryFee
                            };
                            let promoUserData = {
                                claimCount: 0,
                                bookings: []
                            }
                            promoCampaigns.addUserToPromotion(userData, () => { });
                            validateAndInitiateDiscount(requestData, requestDatas, promoUserData, entry, 1, requestData.cartValue + requestData.deliveryFee);
                            return resolve();
                        }

                    } else {//first time

                        var userData = {
                            "promoId": entry._id,
                            "userId": requestData.userId,
                            "bookings": [{
                                "cartId": requestDatas.cartId,
                                "bookingId": requestData.bookingId,
                                "bookingTime": formatted,
                                "cityId": requestData.cityId,
                                "zoneId": requestData.zoneId,
                                "deliveryFee": requestData.deliveryFee,
                                "cartValue": requestData.cartValue,
                                "paymentMethod": requestData.paymentMethod
                            }],
                            "unlockDate": formatted,
                            "claimCount": 0,
                            "totalBusiness": requestData.deliveryFee + requestData.cartValue

                        };
                        promoCampaigns.addUserToPromotion(userData, () => { });
                        validateAndInitiateDiscount(requestData, requestDatas, promoUser, entry, 1, requestData.cartValue + requestData.deliveryFee);
                        return resolve();
                    }

                }

            });
        })


    }

    postNewInputTripLogData()

        .then(validatePromoCampaign)

        .then(checkAndInitiateDiscount)

        .then((response) => {

            // logger.error("Campaign validated successfully. Discount data processed");
        }).catch((err) => {

            logger.error("Validating available campiagn request error: ", err);
        });


    /*===================================================================================================
        Check if any previous referral campaign pending for the user
     */

    const checkPendingDiscount = () => {
        return new Promise((resolve, reject) => {
            logger.info("Checking pending discount for the user -------------------");
            let userId = requestData.userId;
            customer.getUserDetails(userId, (detailsErr, detailsResponse) => {
                if (detailsErr) {
                    // logger.info("Database error")

                    return reject(detailsErr);
                } else if (detailsResponse.length == 0) {
                    // logger.info("No data found")
                    return reject("User details not found");
                } else {
                    // logger.info("Checking for referral discount key");
                    customerDetails = detailsResponse[0];

                    if ("referralDiscountStatus" in customerDetails) {
                        if (customerDetails.referralDiscountStatus == 0) {
                            // logger.info("Referral discount peding . Initiating request for referral campaign validation")
                            referralCodeModel.getReferrerDetailsByNewUserId(requestData.userId, (referrerError, referrerResponse) => {
                                if (referrerError) {
                                    // logger.info("Referrer details not found");
                                } else {
                                    referrerDetails = referrerResponse;
                                }
                            });
                            return resolve(customerDetails);
                        } else {
                            return reject("Offer discount claimed");
                        }
                    } else {

                        return reject(customerDetails)
                    }
                }
            });
        });
    }

    /*
    @Get the campiagn details
     */
    const getCampaignDetails = (customerDetails) => {
        logger.info("Getting referral campaign details");
        return new Promise((resolve, reject) => {
            referralCampaignModel.getCampaignById(customerDetails.campaignId, (campaignDetailsError, campaignDetailsResponse) => {
                if (campaignDetailsError) {

                    return reject(campaignDetailsError);
                } else if (campaignDetailsResponse.length == 0) {
                    return reject("Unable to get campaign details");
                } else {
                    if (campaignDetailsResponse[0].status == 2) {
                        // logger.info("Campaign details found and campaign status is active");
                        referralCampaignData = campaignDetailsResponse[0];
                        return resolve(campaignDetailsResponse[0]);
                    } else {
                        return reject("Campaign Expired");
                    }
                }
            });
        });
    }

    const getReferrerCustomer = (data) => {
        return new Promise((resolve, reject) => {
            customer.getUserDetails(customerDetails.referralData.referrerId, (referrerDetailsError, referrerDetailsResponse) => {
                if (referrerDetailsResponse) {
                    referrerCustomerDetails = referrerDetailsResponse[0]
                    return resolve(data)
                } else {
                    return resolve(data)
                }
            });
        });
    }

    /*
        -> check reward trigger type
        -> if trip count
            -> check in order analytics collection if matches
                -> check reward type 
                    ->  wallet credit 
                    -> coupon delivery
        -> if total business
                -> check in order analytics collection if matches
                -> check reward type 
                    ->  wallet credit 
                    -> coupon delivery
        */
    const validateReferralCampaignDiscount = (referralCampiagnsData) => {
        logger.info("Preparing data for discount for both users", customerDetails.referralData.referrerId);
        return new Promise((resolve, reject) => {

            let userId = requestData.userId;
            orderAnalytics.getByUserId(requestData.userId, (error, response) => {
                if (error) {
                    return reject("data not found");
                } else if (response === null && response.length == 0) {
                    return reject("Order analytics data not found");
                } else {
                    orderAnalyticsData = response;
                    // logger.info("customer reward trigger type is ", referralCampiagnsData.rewardTriggerType);
                    if (referralCampiagnsData.rewardTriggerType == 1) {//booking count
                        let tripCount = referralCampiagnsData.tripCount;
                        /*
                        Add data to campaign qualified trip count
                         */
                        let qualifiedTripData = {
                            cartId: requestDatas.cartId,
                            campaignId: referralCampiagnsData._id.toString(),
                            bookingId: requestDatas.bookingId,
                            userId: requestDatas.userId,
                            customerName: requestDatas.customerName,
                            cityId: requestDatas.cityId,
                            zoneId: requestDatas.cityId,
                            paymentMethod: requestDatas.paymentMethod,
                            paymentMethodString: requestDatas.paymentMethodString,
                            bookingTime: requestDatas.bookingTime,
                            deliveryFee: requestDatas.deliveryFee,
                            cartValue: requestDatas.cartValue,
                            currency: requestDatas.currency,
                            currencySymbol: requestDatas.currencySymbol,
                            created: formatted,
                            email: requestDatas.email,
                            campaignTitle: referralCampiagnsData.title

                        }
                        campaignQualifiedTripLogs.allQualifiedTripLog(qualifiedTripData, (error, response) => { });
                        /*
                        Increase qualifiedTripCount
                         */

                        referralCampaignModel.increaseQualifiedTripCount(referralCampiagnsData._id.toString(), () => { })
                        // Get user order/booking details from order/booking analytics

                        if (orderAnalyticsData) {
                            if (orderAnalyticsData.totalNumberOfBooking >= tripCount) {
                                // logger.info("Trip count conditon matched for referral campaign discount");
                                /*
                                    @give discount to referrer
                                    @give discount to new user
                                    @update users collection pendingDiscount = false
                                 */
                                return resolve();
                            } else {
                                return reject("Trip count condition does not match for referral campign discount");
                            }
                        } else {
                            return reject("Trip count condition does not match for referral campign discount");
                        }
                    } else {//total bussiness
                        let totalBusinessAmountRequired = referralCampiagnsData.newUserBillingAmtTrigger;
                        if (totalBusinessAmountRequired <= orderAnalyticsData.totalBusinessAmount) {
                            // logger.info("Total business condition matched. Processing discount for new user and referrer.....");
                            /*
                                @give discount to referrer
                                @give discount to new user
                                @update users collection pendingDiscount = false
                             */
                            return resolve();
                        } else {
                            return reject();
                        }
                    }
                }
            });
        });
    }

    const initiateReferralDiscount = () => {

        logger.info("Initiating discount for both users")

        return new Promise((resolve, reject) => {
            let newUserDiscount = referralCampaignData.newUserDiscount;
            let referrerDiscount = referralCampaignData.referrerDiscount;

            /*
            Process for new user
             */

            if (typeof (customerDetails.newUserInitiate) !== 'undefined' && customerDetails.newUserInitiate == false) {
                initiateReferralCampaignDiscount(newUserDiscount, 1, requestData, referralCampaignData, customerDetails, customerDetails, referrerCustomerDetails);
            }
            /*
            Process for referrer
             */
            let refeeereDetailsForWalletCredit = {
                cartValue: requestData.cartValue,
                deliveryFee: requestData.cartValue,
                email: referrerDetails.email,
                firstName: referrerDetails.firstName,
                First_name: customerDetails.firstName,
                userId: referrerDetails.userId,
                customerName: requestData.firstName,
                bookingId: 'N/A',
                paymentType: 'N/A',
                orderSeqId: 'N/A--',
                currency: requestData.currency,
                currencySymbol: requestData.currencySymbol,
                discount: referrerDiscount,

            }

            /*
            Get referrer details 
             */

            if (typeof (customerDetails.referrerInitiate) !== 'undefined' && customerDetails.referrerInitiate == false) {
                initiateReferralCampaignDiscount(referrerDiscount, 2, refeeereDetailsForWalletCredit, referralCampaignData, referrerDetails, referrerCustomerDetails, referrerCustomerDetails);
            }
            return resolve();
        });


    }

    /*
    @update users collection 
     */

    const updateUserReferralDiscountStatus = () => {
        // logger.info("Updating user collection for referral discount status")
        return new Promise((resolve, reject) => {
            let updateData = {
                "userId": requestData.userId,
                "status": 2
            }
            customer.updateUserReferralDiscountStatus(updateData, (error, response) => {
                if (error) {
                    return reject()
                } else {
                    return resolve();
                }
            })
        });

    }


    checkPendingDiscount()

        .then(getCampaignDetails)
        .then(getReferrerCustomer)
        .then(validateReferralCampaignDiscount)

        .then(initiateReferralDiscount)

        .then(updateUserReferralDiscountStatus)

        .then((response) => {
            logger.error("Pending discount check processed");
        }).catch((err) => {
            logger.error("pending discount check error --- :");
        });

}


// Generate coupon code
const generateCouponCode = (count) => {
    var randomText = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < count; i++)
        randomText += possible.charAt(Math.floor(Math.random() * possible.length));
    return randomText;
}


/*
validate campaign and initiate discount function 

 */
const validateAndInitiateDiscount = (requestData, requestDatas, userData, promoData, newFlag, currentBusinessAmount) => {

    // logger.info("promo user data=====================", promoData);
    // logger.info("new flag", newFlag);

    if (newFlag == 1) {
        userData = {
            claimCount: 0,
            bookings: []
        }
    }
    let CurrentDate = moment().unix();
    let entry = promoData;//promocampign data
    let promoUser = userData;
    let currentDate = new Date();
    let currentISODate = currentDate.toISOString();
    let dateTime = require('node-datetime');
    let dt = dateTime.create();
    let formatted = dt._created;

    if ((entry.startTime) < currentISODate && (entry.endTime) > currentISODate) {//campign is valid
        if (newFlag == 0) {//new user update
            var updateData = {
                "amount": requestData.cartValue + requestData.deliveryFee,
                "promoId": entry._id,
                "userId": requestData.userId,
                "booking": {
                    "cartId": requestDatas.cartId,
                    "bookingId": requestData.bookingId,
                    "bookingTime": formatted,
                    "cityId": requestData.cityId,
                    "zoneId": requestData.zoneId,
                    "cartValue": requestData.cartValue,
                    "deliveryFee": requestData.deliveryFee,
                    "paymentMethod": requestData.paymentMethod,
                    "timeStamp": new Date()
                },
                "claimCount": promoUser.claimCount
            };
            promoCampaigns.updateBooking(updateData, (updateClaimError, updateClaim) => { });
        }
        /* Check if promo users booking count matches the trip count condition and 
             per user claim count is less than users claim count*/

        if (promoUser.claimCount < entry.perUserLimit) {//check claim count 
            // logger.error('promo user claim count is less than per user limit');
            /*Add data to qualiified trip data*/
            let qualifiedTripData = {
                cartId: requestDatas.cartId,
                campaignId: entry._id.toString(),
                bookingId: requestDatas.bookingId,
                userId: requestDatas.userId,
                customerName: requestDatas.customerName,
                cityId: requestDatas.cityId,
                zoneId: requestDatas.cityId,
                paymentMethod: requestDatas.paymentMethod,
                paymentMethodString: requestDatas.paymentMethodString,
                bookingTime: requestDatas.bookingTime,
                deliveryFee: requestDatas.deliveryFee,
                cartValue: requestDatas.cartValue,
                currency: requestDatas.currency,
                currencySymbol: requestDatas.currencySymbol,
                created: formatted,
                email: requestDatas.email,
                campaignTitle: entry.title

            }
            campaignQualifiedTripLogs.allQualifiedTripLog(qualifiedTripData, (error, response) => { });
            /*
            Increase qualifying trip data
             */
            promoCampaigns.increaseQualifiedTripCount(entry._id.toString(), () => { })

            /*
            check reward trigger type
                -> if reward trigger type is total business the check in orderAnalytics collection , if matched then initiate discount
                -> else check trip count  and give discount
             */
            // logger.info("reward Trigger type", entry.rewardTriggerType);

            if (entry.rewardTriggerType == 2) {//Total bussisness
                /*
                @get data from orderAnalytics by userId
                 */
                /*
                    -> check if total business amount required matches the condition
                    -> else do nothing 
                    -> if condition matches then check reward type and give disount 
                */

                if (newFlag == 1) {
                    var totalBusinessByUser = currentBusinessAmount;
                } else {
                    var totalBusinessByUser = promoUser.totalBusiness + currentBusinessAmount
                }







                if (((promoUser.claimCount + 1) * entry.totalBusinessAmountRequired) <= totalBusinessByUser) {

                    initiateCampaignDiscount(entry, requestDatas);
                } else {

                }

            } else {//booking count

                if ((promoUser.bookings.length + 1) % entry.tripCount === 0) {
                    logger.error('bookings length matched trip count condition');

                    // Check if promo global usage count conditions matches the global claim count

                    if (entry.globalUsageLimit > entry.globalClaimCount) {



                        // If reward type = wallet credit then wallet credit and send email

                        var discountData = entry.discount;
                        /*
                        Initiate discount 
                         */
                        initiateCampaignDiscount(entry, requestDatas);
                        // promoCampaigns.increaseQualifiedTripCount(entry._id.toString(), (increaseQualifiedTripCountError, increaseQualifiedTripCountResponse) => {

                        // })


                    } else {

                        // Do nothing 
                    }

                } else {
                    logger.error('Booking updated');
                }
            }
        } else {//user limit exceeds

            // logger.info("Per user limit exceeds");
        }

    } else {//no campign now




        // logger.info("No campaigns available for now.");
        // Do nothing
    }
}

/*
@Function to post new promo code
 */

const postNewPromoCode = (promoCodeData) => {
    // logger.info("Posting new promo code for referral discount data ==========================================================");
    // logger.info(promoCodeData);
    promoCode.postCouponCode(promoCodeData, (postError, postResponse) => {

        if (postError) {
            return false;
        } else {
            // logger.info("New promo code created successfully");
            return true;
        }
    });
}

/*
    @ check reward type 
            -> wallet credit 
            -> coupon delivery
 */

const initiateReferralCampaignDiscount = (referralDiscountData, userType, requestData, referralCampaignData, customerDetails, userDetailsFromUsersData, referrerCustomerDetails) => {
    /*
    @rewardType 1 = wallet credit
                2 = coupon delivery
     */

    var walletCreditAmount = 0;
    /*Increasing claim count*/
    referralCampaignModel.increaseClaimCount(referralCampaignData._id.toString(), () => { });
    async.series([
        function calculateDiscountvalue(callBack) {
            let totalAmount = requestData.cartValue + requestData.deliveryFee;
            logger.info("total amount", totalAmount);
            if (referralDiscountData.rewardType == 1) {//wallet
                // logger.info("Crediting data to wallet for the customer---", userType);
                if (referralDiscountData.discountType = 1) {//fixed
                    if (referralDiscountData.discountAmt > totalAmount) {
                        // logger.info("discount amount 1 = ", totalAmount)
                        walletCreditAmount = totalAmount;
                        callBack(null, true);
                    } else {
                        walletCreditAmount = referralDiscountData.discountAmt
                        // logger.info("Discount amount 2 = ", referralDiscountData.discountAmt)
                        callBack(null, true);
                    }
                } else {//percantage
                    var percentage = referralDiscountData.value;
                    var discountAmount = totalAmount * (percentage / 100);
                    walletCreditAmount = discountAmount;

                    // logger.info("Discount value 3 = ", discountAmount)
                    callBack(null, true);

                }
            } else {//coupon code
                /*
                Generate coupon code and save into coupon codes collection and deliver via email
                 */
                // logger.info("Generating coupon for discount delivery + user type ======= ", userType);

                var promoCodeForReferralBonus = generateCouponCode(5);
                var campaignPromoCodeData = {
                    "title": "This promo code generated for referrer towards referral campaign",
                    "code": promoCodeForReferralBonus,
                    "adminLiability": 100,
                    "storeLiability": 0,
                    "status": 2,
                    "promoType": "referralPromo",
                    "cities": referralCampaignData.cities,
                    "zones": "0",
                    "rewardType": 1,
                    "paymentMethod": 3,
                    "discount": {
                        typeId: referralDiscountData.discountType,
                        typeName: referralDiscountData.discountTypeName,
                        value: referralDiscountData.discountAmt
                    },
                    "category": referralDiscountData.category || [],
                    "startTime": referralCampaignData.startTime,
                    "endTime": referralCampaignData.endTime,
                    "globalUsageLimit": 1,
                    "perUserLimit": 1,
                    "globalClaimCount": 0,
                    "vehicleType": 4,
                    "termsAndConditions": referralCampaignData.termsAndConditions,
                    "description": referralCampaignData.description,
                    "howItWorks": referralCampaignData.howItWorks,
                    "userId": customerDetails._id.toString()

                };

                /*
                Push notification
                */
                let request = {
                    fcmTopic: userDetailsFromUsersData.fcmTopic,
                    action: 111,
                    pushType: 7,
                    title: config.APP_NAME,
                    msg: "Congratulations! You've earned a discount coupon " + promoCodeForReferralBonus + " . Use this on your next booking to receive discounts.",
                    data: [],
                    deviceType: userDetailsFromUsersData.mobileDevices ? userDetailsFromUsersData.mobileDevices.deviceType : 1
                }
                notifications.notifyFcmTopic(request, (e, r) => { });



                postNewPromoCode(campaignPromoCodeData)

                if (userType == 1) {
                    /*
                    Update user campaign claim status
                     */

                    /*
                        Add data to referral campaign unlocked data
                    */

                    let unlockedTripData = {
                        campaignId: referralCampaignData._id.toString(),
                        campaignTitle: referralCampaignData.title,
                        userName: requestData.customerName,
                        referralCode: referrerCustomerDetails.referralCode,
                        rewardType: "Coupon deliver",
                        couponCode: promoCodeForReferralBonus,
                        newUserDiscount: referralCampaignData.newUserDiscount,
                        referrerDiscount: referralCampaignData.referrerDiscount,
                        deliveredTo: requestData.customerName,
                        timeStamp: new Date()
                    }
                    referralUnlockedLog.postReferralUnlockedTripData(unlockedTripData, () => { })
                    referralCampaignModel.increaseUnlockedCodeCount(referralCampaignData._id.toString(), () => { });

                    email.newUserReferralEarnedPromoCode({
                        toName: requestData.firstName || '',
                        to: requestData.email,
                        promoCode: promoCodeForReferralBonus,
                        details: referralCampaignData.description,
                        howItWorks: referralCampaignData.howITWorks,
                        termsCondition: referralCampaignData.termsConditions


                    }, () => { });
                    return callBack(new Error('Coupon delivered'));
                    // });
                } else {

                    /*
                           Add data to referral campaign unlocked data
                       */

                    let unlockedTripData = {
                        campaignId: referralCampaignData._id.toString(),
                        campaignTitle: referralCampaignData.title,
                        userName: requestData.First_name,
                        referralCode: referrerCustomerDetails.referralCode,
                        rewardType: "Coupon deliver",
                        couponCode: promoCodeForReferralBonus,
                        newUserDiscount: referralCampaignData.newUserDiscount,
                        referrerDiscount: referralCampaignData.referrerDiscount,
                        deliveredTo: customerDetails.firstName,
                        timeStamp: new Date()
                    }
                    referralUnlockedLog.postReferralUnlockedTripData(unlockedTripData, () => { });

                    referralCampaignModel.increaseUnlockedCodeCount(referralCampaignData._id.toString(), () => { });

                    email.promoCode({
                        toName: customerDetails.firstName || '',
                        to: customerDetails.email,
                        newUserName: requestData.First_name,
                        promoCode: promoCodeForReferralBonus,
                        details: referralCampaignData.description,
                        howItWorks: referralCampaignData.howITWorks,
                        termsCondition: referralCampaignData.termsConditions

                    }, () => { });
                    return callBack(new Error('Coupon delivered'));
                }



                // referralCampaignModel.postPromoCode(campaignPromoCodeDate);
                /*
                Increase claim count
                 */


                // callBack(null, true);
            }
        },
        function creditToWallet(callBack) {
            // logger.info('credit to wallet function check balance');
            // logger.info(walletCreditAmount);

            let walletCreditData = {
                campaignFlag: "referralCampaign",
                bookingId: requestData.bookingId,
                userId: requestData.userId,
                email: requestData.email,
                customerName: requestData.customerName,
                amount: walletCreditAmount,
                currency: requestData.currency || 'USD',
                currencySymbol: requestData.currencySymbol || '$',
                userType: 1,
                cityId: requestData.cityId || "N/A",
                cityName: requestData.cityName || "N/A"
            }
            walletUpdateHandler(walletCreditData);
            let claimDataToUpdate = {
                "cartId": requestData.cartId || 'N/A',
                "userId": requestData.userId || 'N/A',
                "promoId": referralCampaignData._id.toString(),
                "userName": requestData.customerName || 'N/A',
                "userEmail": requestData.email,
                "userPhone": "",
                "couponCode": "",
                "currency": requestData.currency || '',
                "currencySymbol": requestData.currencySymbol || '',
                "cartValue": requestData.cartValue,
                "discountValue": walletCreditAmount,
                "deliveryFee": requestData.deliveryFee,
                "lockedTimeStamp": new Date(),
                "applicableOn": "BOTH",
                "unlockedTimeStamp": new Date(),
                "claimTimeStamp": new Date(),
                "discount": requestData.discount,
                "status": "claimed",
                "bookings": ""
            }
            // logger.info('credit to wallet function check balance');
            claimModel.addClaimData(claimDataToUpdate, () => { });

            if (userType == 1) {
                let unlockedTripData = {
                    campaignId: referralCampaignData._id.toString(),
                    campaignTitle: referralCampaignData.title,
                    userName: requestData.customerName,
                    referralCode: referrerCustomerDetails.referralCode,
                    rewardType: "Wallet Credit 3",
                    couponCode: 'N/A',
                    newUserDiscount: referralCampaignData.newUserDiscount,
                    referrerDiscount: referralCampaignData.referrerDiscount,
                    deliveredTo: requestData.customerName,
                    timeStamp: new Date()
                }

                referralUnlockedLog.postReferralUnlockedTripData(unlockedTripData, () => { })
                referralCampaignModel.increaseUnlockedCodeCount(referralCampaignData._id.toString(), () => { });

            } else {
                let unlockedTripData = {
                    campaignId: referralCampaignData._id.toString(),
                    campaignTitle: referralCampaignData.title,
                    userName: requestData.First_name,
                    referralCode: referrerCustomerDetails.referralCode,
                    rewardType: "Wallet Credit 4",
                    couponCode: "N/A",
                    newUserDiscount: referralCampaignData.newUserDiscount,
                    referrerDiscount: referralCampaignData.referrerDiscount,
                    deliveredTo: customerDetails.firstName || "",
                    timeStamp: new Date()
                }
                referralUnlockedLog.postReferralUnlockedTripData(unlockedTripData, () => { })
                referralCampaignModel.increaseUnlockedCodeCount(referralCampaignData._id.toString(), () => { });

            }


            let request = {
                fcmTopic: userDetailsFromUsersData.fcmTopic,
                action: 111,
                pushType: 7,
                title: config.APP_NAME,
                msg: "Congratulations! You've earned a wallet credit of " + requestData.currency + ' ' + walletCreditAmount + ".",
                data: [],
                deviceType: userDetailsFromUsersData.mobileDevices ? userDetailsFromUsersData.mobileDevices.deviceType : 1,
            }
            notifications.notifyFcmTopic(request, (e, r) => { });



            return callBack(new Error('Added discount to wallet'));
        },

    ],
        function (error, result) {
            if (error) {
                logger.error("Message " + error);
            } else {
                // logger.info("Wallet credited successfully");
            }

        })
}

/*
Function to give campaign discount 
 */
const initiateCampaignDiscount = (entry, requestDatas) => {

    // logger.info("initiate campaign discount function");
    // logger.info("reward type  ", entry);

    /*Add data to unlocked trip logs collection*/




    let delvieryFee = requestDatas.delvieryFee;
    let cartValue = requestDatas.cartValue;
    let discountData = entry.discount;
    if (entry.rewardType == 1) {//fixed amount
        if (entry.applicableOn == 1) {
            // logger.info("Applicable on cart value");
            /*
            applicable on cart value
             */
            applicableOnString = "cartValue"
            if (discountData.typeId == 1) {
                discount = discountData.value;

            } else {

                var percentage = discountData.value;
                var discountAmount = cartValue * (percentage / 100);
                if (discountAmount > discountData.maximumDiscountValue) {
                    discount = discountData.maximumDiscountValue;
                } else {
                    discount = discountAmount;
                }
            }


        } else if (entry.applicableOn == 2) {
            // logger.info("applicable on delviery fee")
            /*
            applicable on delivery fee
             */
            applicableOnString = "deliveryFee"
            if (discountData.typeId == 1) {
                if (discountData.value > deliveryFee) {
                    discount = deliveryFee;

                } else {
                    discount = discountData.value
                }

            } else {

                var percentage = discountData.value;
                var discountAmount = deliveryFee * (percentage / 100);
                if (discountAmount > discountData.maximumDiscountValue) {
                    discount = discountData.maximumDiscountValue;
                } else {
                    discount = discountAmount;
                }
            }

        } else {
            // logger.info("Applicable on both");
            // logger.error("testing")
            /*
                @applicable on both
             */
            applicableOnString = "both"

            if (discountData.typeId == 1) {
                discount = discountData.value;

            } else {
                // var totalAmount = deliveryFee + cartValue;
                var totalAmount = cartValue;
                var percentage = discountData.value;
                var discountAmount = totalAmount * (percentage / 100);
                if (discountAmount > discountData.maximumDiscountValue) {
                    discount = discountData.maximumDiscountValue;
                } else {
                    discount = discountAmount;
                }
            }
        }

        /*
         discount discount data end 
         */

        /*
        wallet credit to user
         */
        let walletCreditData = {
            campaignFlag: "promoCampaign",
            bookingId: requestDatas.bookingId,
            userId: requestDatas.userId,
            amount: discount,
            email: requestDatas.email,
            customerName: requestDatas.customerName,
            currency: requestDatas.currency || 'USD',
            currencySymbol: requestDatas.currencySymbol || '$',
            userType: 1,
            cityId: requestDatas.cityId || "N/A",
            cityName: entry.cities[0] ? entry.cities[0].cityName : "N/A"
        }

        walletUpdateHandler(walletCreditData);
        /*
        Increase global claim count
        Increase user claim count 
         */
        let claimCountUpdateData = {
            userId: requestDatas.userId,
            promoId: entry._id.toString()
        }
        promoCampaigns.increaseClaimCount(claimCountUpdateData, () => { });

        let unlockedTripLogData = {
            promoId: entry._id.toString(),
            promoTitle: entry.title,
            userName: requestDatas.customerName,
            cartId: requestDatas.cartId,
            bookingId: requestDatas.bookingId,
            bookingTimeStamp: requestDatas.bookingTime,
            currency: requestDatas.currency,
            currencySymbol: requestDatas.currencySymbol,
            unlockedCode: "N/A",
            walletCreditAmount: discount,
            campaignRewardType: "wallet Credit",
            timestamp: new Date()
        }
        campaignUnlockedTripLogModel.postData(unlockedTripLogData, (postUnlockLogError, postUnlockResponse) => { });
        let claimDataToUpdate = {
            "cartId": requestDatas.cartId,
            "userId": requestDatas.userId,
            "promoId": entry._id.toString(),
            "status": 2,
            "userName": requestDatas.customerName,
            "userEmail": requestDatas.email,
            "userPhone": "",
            "couponCode": "",
            "currency": requestDatas.currency,
            "currencySymbol": requestDatas.currencySymbol,
            "cartValue": requestDatas.cartValue,
            "discountValue": discount,
            "deliveryFee": requestDatas.deliveryFee,
            "lockedTimeStamp": new Date(),
            "applicableOn": 1,
            "unlockedTimeStamp": new Date(),
            "claimTimeStamp": "",
            "discount": entry.discount,
            "status": "Unlocked",
            "bookings": ""
        }

        claimModel.addClaimData(claimDataToUpdate, (error, response) => { });

    } else {//promocode 

        // Generate code
        var newpromoCode = generateCouponCode(5);
        // add to promo codes
        var campaignPromoCodeData = {
            "title": "promo code generated for campaign",
            "userId": requestDatas.userId,
            "code": newpromoCode,
            "adminLiability": 100,
            "storeLiability": 0,
            "cities": entry.cities,
            "category": entry.category || [],
            "zones": "0",
            "rewardType": entry.rewardType,
            "paymentMethod": entry.paymentMethod,
            "isApplicableWithWallet": entry.isApplicableWithWallet,
            "discount": entry.discount,
            "startTime": entry.startTime,
            "endTime": entry.endTime,
            "globalUsageLimit": 1,
            "perUserLimit": 1,
            "globalClaimCount": 0,
            "vehicleType": 4,
            "termsAndConditions": entry.termsConditions || "",
            "description": entry.description || "",
            "howItWorks": entry.howITWorks || "",
            "status": 2,
        }
        postNewPromoCode(campaignPromoCodeData);
        /*
        @increase globalClaimCount to 1
        @increase user claim count to 1
        @update user total business
         */
        let claimCountUpdateData = {
            userId: requestDatas.userId,
            promoId: entry._id.toString()
        }
        promoCampaigns.increaseClaimCount(claimCountUpdateData, () => { });
        /*
        Increase unlocked count 
         */

        let unlockedTripLogData = {
            promoId: entry._id.toString(),
            promoTitle: entry.title,
            userName: requestDatas.customerName,
            cartId: requestDatas.cartId,
            bookingId: requestDatas.bookingId,
            timeStamp: requestDatas.bookingTime,
            currency: requestDatas.currency,
            currencySymbol: requestDatas.currencySymbol,
            unlockedCode: newpromoCode,
            walletCreditAmount: 0,
            campaignRewardType: "Coupon Delivery",
            timestamp: new Date()

        }

        campaignUnlockedTripLogModel.postData(unlockedTripLogData, (postUnlockLogError, postUnlockResponse) => { });

        let claimDataToUpdate = {
            "cartId": requestDatas.cartId,
            "userId": requestDatas.userId,
            "promoId": entry._id.toString(),
            "status": 2,
            "userName": requestDatas.customerName,
            "userEmail": requestDatas.email,
            "userPhone": "",
            "couponCode": newpromoCode,
            "currency": requestDatas.currency,
            "currencySymbol": requestDatas.currencySymbol,
            "cartValue": requestDatas.cartValue,
            "discountValue": 0,
            "deliveryFee": requestDatas.deliveryFee,
            "lockedTimeStamp": new Date(),
            "applicableOn": 1,
            "unlockedTimeStamp": new Date(),
            "claimTimeStamp": "",
            "discount": entry.discount,
            "status": "Unlocked",
            "bookings": ""
        }

        claimModel.addClaimData(claimDataToUpdate, (error, response) => { });

        email.promoCampaignPromoCode({
            toName: requestDatas.customerName || '',
            to: requestDatas.email,
            promoCode: newpromoCode,
            details: entry.description || "",
            howItWorks: entry.howITWorks || "",
            termsCondition: entry.termsConditions || ""

        }, () => { });
    }
}

/*
Function to wallet credit 
 */
/**
 * API - to get walletUpdateHandler detail for perticular users
 */
const walletUpdateHandler = (request) => {
    // logger.info("wallet update data");
    // logger.info(request);
    // if (request.campaignFlag == "promoCampaign") {
    //     email.promoCampaignWalletCredit({
    //         toName: request.customerName || '',
    //         to: request.email,
    //         amount: request.currencySymbol + ' ' + request.amount.toString()

    //     }, () => { });
    // } else if (request.campaignFlag == "newUserReferralCampaign") {

    //     /*Referral campaign wallet credit*/
    //     email.referalWalletCredit({
    //         toName: request.customerName || '',
    //         to: request.email,
    //         amount: request.currencySymbol + ' ' + request.amount.toString()

    //     }, () => { });
    // } else if (request.campaignFlag == "referralCampaign") {

    //     /*Referral campaign wallet credit*/
    //     email.referUserReferalWalletCredit({
    //         toName: request.customerName || '',
    //         to: request.email,
    //         amount: request.currencySymbol + ' ' + request.amount.toString()

    //     }, () => {

    //     });
    // }
    transaction.campaginDiscount({
        bookingId: request.bookingId,
        userId: request.userId,
        amount: request.amount,
        currency: request.currency || 'USD',
        currencySymbol: request.currencySymbol || '$',
        userType: 1,
        cityId: request.cityId || "N/A",
        cityName: request.cityName || "N/A"
    }, (err, res) => {
    })
}

module.exports = {
    postRequestHandler,
    initiateCampaignDiscount,
    walletUpdateHandler
}