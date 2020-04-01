require("moment");
const underscore = require('underscore');
const Joi = require("joi");
const async = require("async");
const logger = require('winston');
const Promise = require('promise');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const postPromo = require('../../models/promoCampaigns/couponCode');
const promoCampaigns = require('../../models/promoCampaigns/promoCampaigns');
const claims = require('../../models/promoCampaigns/claims');
const error = require('../../statusMessages/responseMessage');
const promoUers = require('../../models/promoCampaigns/promoUsers');
const promoCodes = require('../../models/promoCodes/promoCodes');

function couponCode(count) {
    var randomText = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < count; i++)
        randomText += possible.charAt(Math.floor(Math.random() * possible.length));
    return randomText;
}

function checkPromoCode(data, finalCallBack) {

    let currentDate = new Date();
    let currentISODate = currentDate.toISOString();
    let offeredCampaign = [];
    let message = {};
    let discount = 0;
    let dataId = [];
    let discountValue = 0;


    
    let promoId = [];
    let claimId = [];
    let promoDatas = [];
    let cartValue = data.requestData.cartValue;
    let deliveryFee = data.requestData.deliveryFee;
    let ResponseMessage = "";
    var finalPayableAmount = data.requestData.finalPayableAmount;

    let discountType = 0;
    let promoPaymentMothod = 0;
    let isApplicableWithWallet = 0;


    async.waterfall([
        function (callBack) {
            promoCodes.validateCoupon(data.requestData, (error, promoData) => {
                if (error) {
                    return callBack({
                        errMsg: "Database error",
                        statusCode: 405
                    })
                } else if (promoData.length == 0) {
                    return callBack({
                        errMsg: "Invalid Code",
                        statusCode: 405
                    });
                } else {
                    promoDatas.push(promoData[0]);
                    return callBack(null, promoData);

                }
            });
        },
        // Check if the user has the code unlocked in the claims collection 
        function (promoData, callBack) {

            promoId = promoDatas[0]._id.toString();
            promoPaymentMothod = promoDatas[0].paymentMethod;
            isApplicableWithWallet = promoDatas[0].isApplicableWithWallet || 0;
            let paymentMethodString = promoDatas[0].paymentMethodString || "";

            if (promoDatas.length == 0) {
                return callBack({ errMsg: "This promo code is not valid.", statusCode: 405 });
            } else if (promoPaymentMothod == 3 && isApplicableWithWallet == 1) {
                return callBack(null, true);
            } else if (promoPaymentMothod == 3 && data.requestData.payByWallet == 0) {
                return callBack(null, true);
            }else if(data.requestData.paymentMethod == promoPaymentMothod && isApplicableWithWallet == 0 ){
                return callBack(null, true);
            }else if(isApplicableWithWallet == data.requestData.payByWallet && data.requestData.paymentMethod == 0){
                return callBack(null, true);
            }else if (promoPaymentMothod == data.requestData.paymentMethod && data.requestData.payByWallet == 0) {
                return callBack(null, true);
            } else if (promoPaymentMothod == data.requestData.paymentMethod && isApplicableWithWallet == 1) {
                return callBack(null, true);
            } else if (promoPaymentMothod == data.requestData.paymentMethod && isApplicableWithWallet == data.requestData.payByWallet) {
                return callBack(null, true);
            } else {
                return callBack({ errMsg: "This promo code is valid only for " + paymentMethodString + " transactions.", statusCode: 405 });
            }
        },
        function (promoValidate, callBack) {
            if (promoValidate == true) {
                var userId = data.requestData.userId;
                var checkLockClaimData = {
                    promoId: promoId,
                    userId: userId
                }

                claims.lockedAndClaimedCount(checkLockClaimData, (checkLockPromoError, checkLockPromResponse) => {
                    if (promoDatas[0].perUserLimit <= checkLockPromResponse) {
                        return callBack({ errMsg: "You have reached maximum number of usage", statusCode: 405 });
                    } else {
                        claims.globalLockedAndClaimedCount(checkLockClaimData, (checkLockPromoError2, checkLockPromResponse2) => {


                            if (promoDatas[0].globalUsageLimit <= checkLockPromResponse2) {
                                return callBack({ errMsg: "Sorry , Code is not available currently", statusCode: 405 });
                            } else {
                                return callBack(null, promoDatas);
                            }
                        });
                    }
                });
            } else {
                return callBack({ errMsg: "Sorry , Code is not available currently", statusCode: 405 });
            }
        },
        function (promoDatas, callBack) {
            if (promoDatas.length == 0) {
                return callBack({ errMsg: "This promo code is not valid.", statusCode: 405 });
            } else {
                if (cartValue && cartValue > 0 && promoDatas[0].minimumPurchaseValue > cartValue) {
                    return callBack({ errMsg: "Booking amount is not sufficient to use this promo code.", statusCode: 405 });
                } else {
                    /*
                    @applicableOn 
                                1 = cart value
                                2 = delivery fee
                                3 = both
                     */
                    // Calculation for discount
                    var billingAmount = data.requestData.amount;
                    var discountData = promoDatas[0].discount;
                    discountType = discountData.typeId;
                    discountValue = discountData.value;
                    if (promoDatas[0].applicableOn == 1) {
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
                    } else if (promoDatas[0].applicableOn == 2) {
                        // logger.info("applicable on delviery fee")
                        /*
                        applicable on delivery fee
                         */

                        if (discountData.typeId == 1) {
                            if (discountData.value > deliveryFee) {
                                discount = deliveryFee;
                                ResponseMessage = "Yay!! You’ve earned yourself a free delivery!!"

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
                        /*
                            @applicable on both
                         */
                        logger.error("applicable on both");

                        if (discountData.typeId == 1) {
                            if (finalPayableAmount <= discountData.value) {
                                discount = finalPayableAmount;
                            } else {
                                discount = discountData.value;
                            }


                        } else {
                            var totalAmount = deliveryFee + cartValue;
                            var percentage = discountData.value;
                            // var discountAmount = totalAmount * (percentage / 100);
                            var discountAmount = finalPayableAmount * (percentage / 100);
                            if (discountAmount > discountData.maximumDiscountValue) {
                                discount = discountData.maximumDiscountValue;
                            } else {
                                discount = discountAmount;
                            }
                        }
                    }
                }
                // Check time stamp is valid
                if (((promoDatas[0].startTime) < currentISODate) && ((promoDatas[0].endTime) > currentISODate)) {
                    // Check if user key exists in the promo data arary
                    if ("users" in promoDatas[0]) {
                        var promoUser = underscore.findWhere(promoDatas[0].users, {
                            userId: data.requestData.userId
                        });
                        // Check if current uesr exits in the array
                        if (promoUser) {

                            // check if per user limit crossed
                            // if not crossed the add to claim give discount
                            if (promoUser.claimCount == promoDatas[0].perUserLimit || promoUser.claimCount > promoDatas[0].perUserLimit) {
                                return callBack({
                                    errMsg: "You have already exhausted this coupon code on you previous order.",
                                    statusCode: 405
                                });

                            } else {
                                // add to claim 
                                // give discount
                                let updateClaimData = {
                                    "userId": data.requestData.userId,
                                    "promoId": promoDatas[0]._id.toString(),
                                    "lockedTimeStamp": currentDate,
                                    "unlockedTimeStamp": "N/A",
                                    "claimTimeStamp": "N/A",
                                    "discount": promoDatas[0].discount,
                                    "status": 'Locked'
                                };
                                return callBack(null, updateClaimData);
                            }
                        } else {
                            // If not exists then add to claim and give discount
                            let updateClaimData = {
                                "userId": data.requestData.userId,
                                "promoId": promoDatas[0]._id.toString(),
                                "lockedTimeStamp": currentDate,
                                "unlockedTimeStamp": "N/A",
                                "claimTimeStamp": "N/A",
                                "discount": promoDatas[0].discount,
                                "status": 'Locked'
                            };
                            return callBack(null, updateClaimData);

                        }
                    } else {
                        // Add user and give discount
                        // entry in claims collection with status unlocked
                        let updateClaimData = {
                            "userId": data.requestData.userId,
                            "promoId": promoDatas[0]._id.toString(),
                            "lockedTimeStamp": currentDate,
                            "unlockedTimeStamp": "N/A",
                            "claimTimeStamp": "N/A",
                            "discount": promoDatas[0].discount,
                            "status": 'Locked'
                        };
                        return callBack(null, updateClaimData);
                    }

                } else {
                    // Coupon expired
                    return callBack({ errMsg: "This promo code has expired", statusCode: 405 });
                }
            }
        },
    ], (error, result) => {
        if (error) {
            return finalCallBack(error);
        } else {
            return finalCallBack(null, {
                errMsg: 'Coupon code applied',
                discountAmount: discount,
                discountType: discountType,
                discountValue: discountValue,
                promoPaymentMothod: promoPaymentMothod,
                isApplicableWithWallet: isApplicableWithWallet,
                promoId: promoDatas[0]._id.toString(),
                finalAmount: cartValue - discount
            });
        }
    });
}


function sendEmail(emailTemplateName, DataToReplce, subject, toEmail) {



    // email.getTemplateAndSendEmail({
    //     templateName: emailTemplateName,
    //     toEmail: toEmail,
    //     subject: subject,
    //     keysToReplace: DataToReplce
    // }, () => {

    // });
    return resolve(true);
}


module.exports = {
    couponCode,
    checkPromoCode,
    sendEmail
}