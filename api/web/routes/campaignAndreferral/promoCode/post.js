// Post a new offer
require("moment");
const underscore = require('underscore');
const Joi = require("joi");
const async = require("async");
const logger = require('winston');
const Promise = require('promise');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const promoCampaigns = require('../../../../models/promoCampaigns/promoCampaigns');
const claims = require('../../../../models/claims/claims');
const error = require('../../../../statusMessages/responseMessage');
const promoCodes = require('../../../../models/promoCodes/promoCodes');
const newOrder = require('../../../../models/bookingsUnassigned');
const commonFunctions = require('../commonMethods/functions');
let walletApp = require('../../../../models/promoCampaigns/walletApp');




// Validate the fields
let couponCodeValidator = {
    payload: {
        title: Joi.string().required().description('Mandatory field. '),
        code: Joi.string().description('Mandatory field. '),
        adminLiability: Joi.string().required().description('Mandatory Field'),
        storeLiability: Joi.string().required().description('Mandatory Field'),
        cities: Joi.any().required().description('Mandatory field. '),
        // category: Joi.any().required().description('Mandatory field'),
        zones: Joi.any().required().description('Mandatory field. '),
        rewardType: Joi.number().required().description('Mandatory field. '),
        paymentMethod: Joi.number().required().description('Mandatory field. '),
        isApplicableWithWallet: Joi.number().required().description('Mandatory field. '),
        discount: Joi.any().required().description('Mandatory field. '),
        startTime: Joi.any().required().description('Mandatory field. '),
        endTime: Joi.any().required().description('Mandatory field. '),
        globalUsageLimit: Joi.number().required().description('Mandatory field. '),
        perUserLimit: Joi.number().required().description('Mandatory field. '),
        globalClaimCount: Joi.number().required().description('Mandatory field. '),
        store: Joi.any().required().description('Mandatory field. '),
        applicableOn: Joi.number().required().description('Mandatory field'),
        termsAndConditions: Joi.any().required().description('Mandatory field for terms and conditions'),
        description: Joi.any().description('Non mandatory field.'),
        howItWorks: Joi.any().description('Non mandatory field'),
        minimumPurchaseValue: Joi.any().description("Minimum purchase value")


    }
};

// Post a new offer then reply the response
let couponCodeHandler = (request, reply) => {
    let startTimeStamp = request.payload.startTime;
    let endTimeStamp = request.payload.endTime;
    let dateTime = require('node-datetime');
    let dt = dateTime.create();
    let formatted = dt['_created'];
    let applicableOnString = ''
    let applicableOn = parseInt(request.payload.applicableOn);

    if (applicableOn = 1) {
        applicableOnString = "cart"
    } else if (applicableOn == 2) {
        applicableOnString = "deliveryFee"
    } else {
        applicableOnString = "both"
    }

    /*
    @Reward type string
    1 = 

     */

    /*
    Payment method  string
    ---------------
    1 = card,
    2 = cash,
    3 = wallet,
    4 = Any
     */

    let paymentMethodString = "";
    let paymentMethod = request.payload.paymentMethod;

    // switch (request.payload.paymentMethod) {
    //     case 1:
    //         paymentMethodString = "card";
    //         break;
    //     case 2:
    //         paymentMethodString = "cash";
    //         break;
    //     case 3:
    //         paymentMethodString = "wallet";
    //         break;
    //     case 4:
    //         paymentMethodString = "any";
    //         break;
    // }

    switch (parseInt(request.payload.paymentMethod)) {
        case 1:
            paymentMethodString = "Card";
            if (request.payload.isApplicableWithWallet == 1)
                paymentMethodString = "Card + Wallet";
            break;
        case 2:
            paymentMethodString = "Cash";
            if (request.payload.isApplicableWithWallet == 1)
                paymentMethodString = "Cash + Wallet";
            break;
        case 3:
            paymentMethodString = "Card + Cash";
            if (request.payload.isApplicableWithWallet == 1)
                paymentMethodString = "Any";
            break;
        default:
            break;
    }


    let offersData = {
        title: request.payload.title,
        code: request.payload.code,
        storeLiability: parseInt(request.payload.storeLiability),
        adminLiability: parseInt(request.payload.adminLiability),
        status: 2,
        statusString: 'active',
        promoType: "couponCode",
        cities: request.payload.cities,
        // category: request.payload.category,
        // cityNames: request.payload.cityNames,
        zones: request.payload.zones || "",
        // rewardType: request.payload.rewardType,
        // rewardTypeString: "string",
        paymentMethod: request.payload.paymentMethod,
        paymentMethodString: paymentMethodString,
        isApplicableWithWallet: request.payload.isApplicableWithWallet || 0,
        minimumPurchaseValue: parseInt(request.payload.minimumPurchaseValue),
        discount: request.payload.discount,
        startTime: startTimeStamp,
        endTime: endTimeStamp,
        globalUsageLimit: request.payload.globalUsageLimit,
        perUserLimit: request.payload.perUserLimit,
        globalClaimCount: request.payload.globalClaimCount,
        store: request.payload.store,
        created: formatted,
        createdIso: new Date(),
        applicableOn: request.payload.applicableOn,
        applicableOnString: applicableOnString,
        termsAndConditions: request.payload.termsAndConditions,
        description: request.payload.description,
        howItWorks: request.payload.howItWorks
    };
    // Add data to both promoCampaings and promoCodes collection

    promoCodes.postCouponCode(offersData, (err, res) => {
        if (err) {

            return reply({
                message: "Error while posting new promo",
                data: {
                    status: false
                }
            }).code(500);
        } else {
            return reply({
                message: "Coupon code added successfully",
                data: {
                    status: true
                }
            }).code(200);

        }

    });
}
var postRequestValidator = {
    payload: {
        userId: Joi.string().required().description('Mandatory field. '),
        couponCode: Joi.string().required().description('Mandatory Field'),
        cityId: Joi.string().required().description('Mandatory field. '),
        zoneId: Joi.string().allow('').description('Mandatory field. '),
        paymentMethod: Joi.number().required().description('Mandatory field. '),
        // vehicleType: Joi.number().required().description('Mandatory field'),
        storeIds: Joi.any().required().description('Mandatory field'),
        deliveryFee: Joi.number().required().description('Mandatory fiedl'),
        cartValue: Joi.number().required().description('Mandatory field.'),
        payByWallet: Joi.number().integer().default(0).description('payByWallet :1- wallet 0-not select wallet').error(new Error("Paid by wallet is missing")),
        finalPayableAmount: Joi.number().required().description('Mandatory field')
    }
};

// Post a new request then check available campaigns 
var postRequestHandler = (request, reply) => {
    request.payload = request;
    var currentDate = new Date();
    var currentISODate = currentDate.toISOString();

    var requestData = {
        couponCode: request.payload.couponCode,
        userId: request.payload.userId,
        cityId: request.payload.cityId,
        storeIds: request.payload.storeIds,
        paymentMethod: request.payload.paymentMethod,
        payByWallet: request.payload.payByWallet,
        created: currentISODate,
        deliveryFee: request.payload.deliveryFee,
        cartValue: request.payload.cartValue,
        vehicleType: request.payload.vehicleType,
        finalPayableAmount: request.payload.finalPayableAmount
    };
    var offeredCampaign = [];

    var data = {
        requestData: requestData
    }

    commonFunctions.checkPromoCode(data, function (error, response) {
        if (error) {
            return reply({
                message: error.errMsg,
                code: 405,
            });
        } else {
            return reply(null, {
                message: response.errMsg,
                data: {
                    paymentType: response.promoPaymentMothod,
                    payByWallet: response.isApplicableWithWallet,
                    discountAmount: response.discountAmount,
                    discountType: response.discountType,
                    discountValue: response.discountValue,
                    finalAmount: response.finalAmount,
                    promoId: response.promoId
                }
            });
        }
    });
}

let claimCouponValidator = {
    payload: {
        claimId: Joi.string().required().description('Mandatory field.'),
        bookingId: Joi.number().required().description("Mandatory field")

    }
};
let claimCouponHandler = (request, reply) => {
    request.payload = request;
    let currentDate = new Date();
    let currentISODate = currentDate.toISOString();
    let claimId = request.payload.claimId;
    let bookingId = request.payload.bookingId;
    let claimData = [];
    let promoData = [];
    let promoId = '';
    let userId = '';
    let currentTimeStamp = moment().unix();
    // let dt = dateTime.create();
    // let formatted = dt['_created'];
    let transactionId = 'WAL' + "-" + moment().unix() + "-" + (Math.random() * (Math.floor(999) - Math.ceil(111)) + 111);



    async.waterfall([
        function (callBack) {
            // Get the claim details and assign it to cliamDatas array
            claims.getClaimByClaimId(claimId, (error, claimDatas) => {
                if (error) {
                    return reply({
                        errMsg: "Database error",
                        statusCode: 405
                    });
                } else if (claimDatas.length == 0) {
                    return reply({
                        errMsg: "Invalid claim ID",
                        statusCode: 405
                    });
                } else if (claimDatas[0].status == "claimed") {
                    return reply({
                        errMsg: "Coupon code already claimed",
                        statusCode: 405
                    });
                } else {
                    claimData.push(claimDatas[0]);
                    promoId = claimData[0].promoId;
                    userId = claimData[0].userId;
                    return callBack(null, claimData);
                }
            });
        },

        /*
        @function to increase claim count
         */
        function (claimData, callBack) {
            var updateClaimCountData = {
                promoId: promoId,
                userId: userId
            }
            promoCodes.increaseClaimCount(updateClaimCountData, (increaseClaimCountError, increaseClaimResponse) => {
                logger.error("Increase claim count response")
                logger.error(increaseClaimCountError);
                return callBack(null, increaseClaimResponse);
            });
        },
        // Function to update claims status and booking id
        function (ccResponse, callBack) {
            updateClaimData = {
                claimId: claimId,
                status: "claimed",
                bookingId: bookingId,
                claimTimeStamp: new Date()
            }
            claims.updateBookingAndClaim(updateClaimData, (updateClaimError, updateClaimResponse) => {
                return callBack(null, updateClaimResponse);
            });
        },
        /*
        @ Get app wallet data
        @ From latest record collect closing amount then deduct the amount from closing amount
        @ Post the new data into wallet app collection
         */

        // function (updateClaimResponse, callBack) {
        //     walletApp.getAllData({}, (err, adminWalletDataResponse) => {
        //         if (err) {
        //             logger.info("Unable to get app wallet data");
        //         } else if (adminWalletDataResponse.length == 0) {
        //             logger.info("Admin wallet data is not available")
        //         } else {
        //             return callBack(null, adminWalletDataResponse);
        //         }

        //     });
        // },

        // function (adminWalletDataResponse, callBack) {

        //     var adminUpdateData = {
        //         "txnId": transactionId,
        //         "userId": 1,
        //         "txnType": "DEBIT",
        //         "trigger": "BONUS",
        //         "comment": "Promocode reward credit to customer",
        //         "currency": "SAR",
        //         "openingBal": adminWalletDataResponse[0].closingBal,
        //         "amount": claimData.discountValue,
        //         "closingBal": adminWalletDataResponse[0].closingBal - claimData.discountValue,
        //         "paymentType": "N/A",
        //         "timestamp": new Date(),
        //         "orderId": "N/A",
        //         "bookingType": 2,
        //         "paymentTxnId": "N/A",
        //         "intiatedBy": "N/A",
        //         "orderSeqId": "N/A"
        //     };
        //     walletApp.updateAppWallet(adminUpdateData, (err, updateAdminWalletResponse) => {
        //         if (err) {
        //             // return reply({
        //             //     statusCode: 503,
        //             //     message: 'Database Error'
        //             // }).code(503);
        //         } else {
        //             return callBack(null, updateAdminWalletResponse);
        //         }
        //     });
        // }




    ],
        (error, result) => {
            if (error) {
                return reply(e).code(e.statusCode);
            } else {
                return reply({
                    statusCode: 200,
                    message: 'Promo code claimed successfully',
                });
            }
        });

}


// Unlock promo code

let unlockPromoCodeValidator = {
    payload: {
        claimId: Joi.string().required().description('Mandatory field.'),
    }
};

let unlockCouponHandler = (request, reply) => {
    request.payload = request;
    let updateClaimData = {
        claimId: request.payload.claimId,
        status: "unlocked",
        unlockedTimeStamp: new Date(),
        bookingId: request.payload.bookingId
    }

    let getClaimData = () => {
        logger.error("Checking if promo code is already claimed----------------");
        return new Promise((resolve, reject) => {
            claims.getClaimByClaimId(updateClaimData.claimId, (getClaimDataError, getCalim) => {
                if (getClaimDataError) {
                    return reject(getClaimDataError);
                } else if (getCalim[0].status === "claimed") {
                    return reject("Promo code already claimed");
                } else {
                    return resolve();
                }

            })
        });
    };
    let updateClaim = () => {

        logger.info("Updating cliam data")

        return new Promise((resolve, reject) => {
            claims.updateUnlockedStatus(updateClaimData, (updateClaimError, updateClaimResponse) => {
                if (updateClaimError) {
                    return reject(updateClaimError);
                } else {
                    return resolve();
                }

            })

        });
    }

    getClaimData()

        .then(updateClaim)

        .then((response) => {
            return reply({
                message: "Promo code updated successfully",
            });
        }).catch((err) => {
            logger.error("Promo code update error: ", err);
            return reply({
                message: err.message
            });
        });


}

// Lock promo code
let lockCouponCodeHandler = (request, reply) => {



    // request = request.payload;
    var currentDate = new Date();
    var currentISODate = currentDate.toISOString();

    var currency = request.currency;

    var CurrentDate = moment().unix();
    var dateTime = require('node-datetime');
    var dt = dateTime.create();
    var formatted = dt._created;
    var requestData = {
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerContactNumber: request.customerContactNumber,
        couponCode: request.couponCode,
        userId: request.userId,
        cityId: request.cityId,
        categoryId: request.categoryId || "",
        paymentMethod: request.paymentMethod,
        created: formatted,
        cartValue: request.cartValue,
        deliveryFee: request.deliveryFee,
        vehicleType: request.vehicleType
    };
    var offeredCampaign = [];
    var message = {};
    var discount = 0;
    var dataId = [];
    var promoId = [];
    var claimId = "";
    var promoDatas = [];
    var cartValue = request.cartValue;
    var deliveryFee = request.deliveryFee;
    var applicableOnString = '';
    async.waterfall([
        function (callBack) {
            promoCodes.validateCoupon(requestData, (error, promoData) => {

                if (promoData.length == 0) {


                    return callBack({
                        errMsg: "Coupon code doesn't match any daata",
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

            if (promoDatas.length == 0) {
                return callBack({
                    errMsg: "Invalid promo code",
                    statusCode: 405
                });
            } else {
                var promoId = promoDatas[0]._id.toString();
                var userId = requestData.userId;
                var checkLockClaimData = {
                    promoId: promoId,
                    userId: userId
                }
                claims.lockedAndClaimedCount(checkLockClaimData, (checkLockPromoError, checkLockPromResponse) => {
                    return callBack(null, checkLockPromResponse);
                });
            }
        },
        function (checkLockPromResponse, callBack) {
            if (promoDatas[0].perUserLimit <= checkLockPromResponse) {

                return callBack({
                    errMsg: "You have reached maximum number of usage",
                    statusCode: 405
                });
            } else {
                return callBack(null, promoDatas);
            }

        },

        function (promoDatas, callBack) {



            if (promoDatas.length == 0) {

                return callBack({
                    errMsg: "Invalid promo code ",
                    statusCode: 405
                });
            } else {

                if (cartValue && cartValue > 0 && promoDatas[0].minimumPurchaseValue > cartValue) {
                    return callBack({
                        errMsg: "Booking amount is not sufficient to use this promo code.",
                        statusCode: 405
                    });
                } else {
                    logger.info("minimum purchase value condition matched");
                    /*
                    @applicableOn 
                                1 = cart value
                                2 = delivery fee
                                3 = both
                     */

                    // Calculation for discount


                    var discountData = promoDatas[0].discount;

                    logger.info("applicable on ------------ ", promoDatas[0].applicableOn);



                    if (promoDatas[0].applicableOn == 1) {
                        logger.info("Applicable on cart value");
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


                    } else if (promoDatas[0].applicableOn == 2) {
                        logger.info("applicable on delviery fee")
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
                        logger.info("Applicable on both");
                        logger.error("testing")
                        /*
                            @applicable on both
                         */
                        applicableOnString = "both"

                        if (discountData.typeId == 1) {
                            discount = discountData.value;
                            if (request.cartValue <= discountData.value) {
                                discount = request.cartValue;
                            } else {
                                discount = discountData.value;
                            }


                        } else {
                            var totalAmount = deliveryFee + cartValue;
                            var percentage = discountData.value;
                            var discountAmount = totalAmount * (percentage / 100);
                            if (discountAmount > discountData.maximumDiscountValue) {
                                discount = discountData.maximumDiscountValue;
                            } else {
                                discount = discountAmount;
                            }
                        }
                    }

                    // Check timestamp is valid
                    if (((promoDatas[0].startTime) < currentISODate) && ((promoDatas[0].endTime) > currentISODate)) {

                        // Check if user key exists in the promo data arary

                        if ("users" in promoDatas[0]) {
                            var promoUser = underscore.findWhere(promoDatas[0].users, {
                                userId: requestData.userId
                            });


                            // Check if current uesr exits in the array
                            if (promoUser) {

                                // check if per user limit crossed
                                // if not crossed the add to claim give discount
                                if (promoUser.claimCount == promoDatas[0].perUserLimit || promoUser.claimCount > promoDatas[0].perUserLimit) {

                                    return callBack({
                                        errMsg: "Maximum usage limit reached",
                                        statusCode: 405
                                    });

                                } else {

                                    // add to claim 
                                    // give discount
                                    let updateClaimData = {
                                        "cartId": request.cartId,
                                        "couponCode": request.couponCode,
                                        "currency": currency,
                                        "currencySymbol": request.currencySymbol,
                                        "cartValue": cartValue,
                                        "deliveryFee": deliveryFee,
                                        "discountValue": discount,
                                        "applicableOn": applicableOnString,
                                        "userId": requestData.userId,
                                        "promoId": promoDatas[0]._id.toString(),
                                        "lockedTimeStamp": currentDate,
                                        "unlockedTimeStamp": "N/A",
                                        "cartId": request.cartId,
                                        "bookingId": request.bookingId,
                                        "claimTimeStamp": "N/A",
                                        "discount": promoDatas[0].discount,
                                        "status": 'Locked'
                                    };
                                    return callBack(null, updateClaimData);
                                }
                            } else {

                                // If not exists then add to claim and give discount
                                let updateClaimData = {
                                    "cartId": request.cartId,
                                    "couponCode": request.couponCode,
                                    "currency": currency,
                                    "currencySymbol": request.currencySymbol,
                                    "cartValue": cartValue,
                                    "deliveryFee": deliveryFee,
                                    "discountValue": discount,
                                    "applicableOn": applicableOnString,
                                    "userId": requestData.userId,
                                    "promoId": promoDatas[0]._id.toString(),
                                    "lockedTimeStamp": currentDate,
                                    "unlockedTimeStamp": "N/A",
                                    "cartId": request.cartId,
                                    "bookingId": request.bookingId,
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
                                "cartId": request.cartId,
                                "couponCode": request.couponCode,
                                "currency": currency,
                                "currencySymbol": request.currencySymbol,
                                "cartValue": cartValue,
                                "deliveryFee": deliveryFee,
                                "discountValue": discount,
                                "applicableOn": applicableOnString,
                                "userId": requestData.userId,
                                "promoId": promoDatas[0]._id.toString(),
                                "lockedTimeStamp": currentDate,
                                "unlockedTimeStamp": "N/A",
                                "cartId": request.cartId,
                                "bookingId": request.bookingId,
                                "claimTimeStamp": "N/A",
                                "discount": promoDatas[0].discount,
                                "status": 'Locked'
                            };
                            return callBack(null, updateClaimData);
                        }

                    } else {
                        // Coupon expired
                        return callBack({
                            errMsg: "Coupon Expired",
                            statusCode: 405
                        })
                    }
                }
            }
        },

        // Add to claim and give discount
        function (updateClaimData, callBack) {

            claims.addClaim(updateClaimData, (updateUserClaimError, updateUserClaim) => {

                // Wallet credited

                return callBack(null, updateUserClaim);
            });
        },
        function (updateUserClaim, callBack) {
            /*
            Find claim id
             */
            let getClaimData = {
                userId: request.userId,
                cartId: request.cartId
            }
            claims.getClaimIdByUserIdAndCartId(getClaimData, (getClaimIdError, getClaimIdResponse) => {
                claimId = getClaimIdResponse[0]._id.toString()
                return callBack(null, true);
            })
        }

    ],

        (error, result) => {
            let errorMsg = '';
            if (error) {
                errorMsg = error.errorMsg;
            }
            errorMsg = 'Coupon code applied';
            // if (error) {
            //     return reply(error).code(error.statusCode);
            // } else {

            //     return reply({
            //         statusCode: 200,
            //         errMsg: 'Coupon code applied',
            //         bookingAmount: requestData.amount,
            //         finalAmount: discount,
            //         claimId: claimId
            //     });
            // }
            newOrder.findOneAndUpdate(request.bookingId, {
                '$set': {
                    claimId: claimId,
                    claimMessage: errorMsg
                }
            }, (err, res) => {
                if (err) {
                    logger.error('Error occurred during claim update order placing (patchOrderClaimId): ' + JSON.stringify(err));
                    return reply(null, {
                        statusCode: 500,
                        errMsg: err,
                        bookingAmount: requestData.amount,
                        finalAmount: discount,
                        claimId: claimId
                    });
                }
                return reply(null, {
                    statusCode: 200,
                    errMsg: 'Coupon code applied',
                    bookingAmount: requestData.cartValue,
                    finalAmount: discount,
                    claimId: claimId
                });
            });

            // newOrder.patchOrderClaimId({
            //     orderId: request.bookingId,
            //     claimId: claimId,
            //     claimMessage: errorMsg
            // }, (err, res) => {
            //     if (err) {
            //         logger.error('Error occurred during claim update order placing (patchOrderClaimId): ' + JSON.stringify(err));
            //         return reply(null, {
            //             statusCode: 500,
            //             errMsg: err,
            //             bookingAmount: requestData.amount,
            //             finalAmount: discount,
            //             claimId: claimId
            //         });
            //     }

            // });

        });
}


let response = {
    status: {
        200: {
            message: "Coupon code added successfully"
        },
        500: {
            message: "Error while posting new promo"
        }
    }
}

// export handler and validator
module.exports = {
    couponCodeValidator,
    couponCodeHandler,
    postRequestHandler,
    postRequestValidator,
    claimCouponValidator,
    claimCouponHandler,
    lockCouponCodeHandler,
    unlockCouponHandler,
    unlockPromoCodeValidator

}