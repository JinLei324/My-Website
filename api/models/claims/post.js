const Joi = require("joi");

const async = require("async");

const logger = require('winston');

const Promise = require('promise');

const ObjectID = require('mongodb').ObjectID;

const claims = require('../../../models/promoCampaigns/claims');

const promoCampaigns = require('../../../models/promoCampaigns/promoCampaigns');

const promoUsers = require('../../../models/promoCampaigns/promoUsers');

const users = require('../../../models/promoCampaigns/users');

const moment = require("moment");

const fcm = require('../fcm/fcm');

const error = require('../../../statusMessages/responseMessage');

// Validate the fields
let updateClaimsValidator = {
    payload: {
        promoId: Joi.any().required().description('Mandatory field. '),

        claimId: Joi.any().allow('').description('Madatory field'),

        status: Joi.string().required().description('Mandatory field. '),

        bookingFlag: Joi.string().required().description('Mandatory Field. 0 if booking cancelled. 1 if booking completed'),

        firstName: Joi.string().required().description('Mandatory field. First name of the user'),

        bookingId: Joi.string().required().description('Mandatory field. '),

        userId: Joi.string().required().description('Mandatory field')


    }
};
/*
@ Function to update the claim
@ Generate the promo code if bookingFlag is 1
 */

let updateClaimHandler = (request, reply) => {

    var id = request.payload.promoId;

    var bookingId = request.payload.bookingId;

    var status = request.payload.status;

    var userId = request.payload.userId;

    var bookingFlag = request.payload.bookingFlag;

    var firstName = request.payload.firstName;

    var claimId = request.payload.claimId;

    var claimId = claimId[0]

    var code = firstName.substring(1, 3).toUpperCase() + randomText(4);

    var timeStamp = moment().unix();
    var userDetailsData = [];
    var campaignDetails = [];
    // Get user details
    logger.error('request received');
    if (bookingFlag == 1) {
        async.waterfall([
            function (callBack) {
                // get user details
                users.getUserDetails(userId, (getUserDetailsError, getUserDetailsResponse) => {
                    if (getUserDetailsResponse) {
                        userDetailsData.push(getUserDetailsResponse[0]);
                    }
                    return callBack(null, getUserDetailsResponse);
                });
            },
            // Get campaign details
            function (getUserDetailsResponse, callBack) {
                promoCampaigns.getCampaignById(id[0], (campaignError, campaignDetailsResponse) => {
                    if (campaignDetailsResponse) {
                        campaignDetails.push(campaignDetailsResponse[0]);
                    }

                    return callBack(null, campaignDetailsResponse);
                });
            },
            function (campaignDetailsResponse, callBack) {
                promoUsers.getUser(userId, (promoUserError, promoUserData) => {
                    return callBack(null, promoUserData);
                });
            },
            function (promoUserData, callBack) {
                /*
                @check if user has already unlocked the promocode 
                else make a promo code and deliver it the user make an entry in the promo users collection
                 */
                if (promoUserData.length !== 0) {
                    // Check if user has unlocked the promo code
                    var data = {
                        promoId: id[0],
                        userId: userId
                    }
                    var checkUserData = "";

                    promoUsers.checkUserPromo(data, (checkUserError, checkUserResponse) => {
                        if (checkUserResponse.length == 0) {
                            var data = {
                                "action": 31,
                                "pushType": '',
                                "title": 'Promo code',
                                "msg": 'Please use "' + code + '" on your next order to claim your offer',
                                "data": '',
                                "deviceType": parseInt(userDetailsData[0].Devices[0].DeviceType),
                                "fcmTopic": userDetailsData[0].deviceToken
                            };
                            fcm.notifyFcmTopic(data);
                            var unlockedPromoCodeUpdateData = {
                                "userId": userId,
                                "promoCode": code,
                                "promoId": id[0],
                                "unlockDate": timeStamp,
                                "expiryDate": campaignDetails[0].endTime,
                                "perUserClaimLimit": campaignDetails[0].perUserLimit,
                            }
                            promoUsers.updateUnlockedPromoCodes(unlockedPromoCodeUpdateData, (promoCodeUpdateError, promoCodeUpdateResponse) => {
                                return callBack(null, promoCodeUpdateResponse);

                            });
                        } else {
                            return callBack(null, "Success");
                        }
                    });


                } else {
                    logger.error("delivering coupon code.....");
                    // @ generate code and deliver to the user by push notification, sms, or email
                    var data = {
                        "action": 31,
                        "pushType": '',
                        "title": 'Promo code',
                        "msg": 'Please use "' + code + '" on your next ride to claim your offer',
                        "data": '',
                        "deviceType": 1,
                        "fcmTopic": userDetailsData[0].deviceToken
                    };
                    fcm.notifyFcmTopic(data);
                    // Insert user
                    var addPromoUser = {
                        userId: userId,
                        promoCode: code,
                        promoId: id[0],
                        unlockDate: timeStamp,
                        expiryDate: campaignDetails[0].endTime,
                        perUserClaimLimit: campaignDetails[0].perUserLimit,
                        claimId: claimId,
                        status: "unlocked"
                    };
                    promoUsers.insertNewUser(addPromoUser, (addPromoError, addPromoResponse) => {
                        return callBack(null, addPromoResponse);
                    });
                    // return callBack(null, "success");
                }
            },
            function (addPromoResponse, callBack) {
                // Update claims
                var claimUpdateData = {
                    claimId: claimId,
                    status: "unlocked"
                };
                claims.updateStatus(claimUpdateData, (updateClaimError, updateClaimResponse) => {
                    return callBack(null, addPromoResponse)
                });
            }
        ],

            (error, result) => {
                if (error) {
                    return reply(e).code(e.statusCode);
                } else {
                    return reply({
                        statusCode: 200,
                        message: 'Success',
                        promoStatus: status,
                        dataId: id[0]

                    });
                }
            });
    } else {
        // remove booking from promo campaigns collection
        promoCampaigns.removeBooking(bookingId, (error, response) => {
            if (response) {
                return reply({
                    statusCode: 200,
                    message: 'Success'
                });
            } else {
                return reply({
                    statusCode: 400,
                    message: 'unable to update',
                });
            }

        });
    }
}

// function to claim coupon code
let claimCouponCodeValidator = {
    payload: {
        userId: Joi.string().required().description("Mandatory field. Used to check if the user has unlocked any promo code or not"),
        couponCode: Joi.string().required().description("Mandatory field. Used to check the promo is valid or not to avail the offer"),
        cartValue: Joi.number().required().description("Mandatory field. used for discount on this value if coupon is only applicable on cart value"),
        deliveryFee: Joi.number().required().description("Mandatory field. Used for discount on this value if coupon is only applicable on delviery fee ")
    }
};

let claimCouponCodeHandler = (request, reply) => {

    let userId = request.payload.userId;

    let couponCode = request.payload.couponCode;

    let deliveryFee = request.payload.deliveryFee;

    let cartValue = request.payload.cartValue;

    let campaignDetails = [];

    let checkPromoUserData = [];

    let CurrentDate = moment().unix();


    /*check in claims collection by claim id if the user has unlocked that promo code or not
     If status is not unlocked then exit
     if the user has unlocked the promo code
     check expiry date . if it is expired then exit
     if not expired then check per user limit
     if per user limit exceeds then exit
     if not exceeds then then 
    
        @ get the promo details
        @ check applicable on cart, delivery fee or total
        @ check discount type is fixed or percentage
        
        ------For percentage--------
        
        @ if percentage then find the percentage value 
        @ check maximum discount value
        @ check which one is lesser between maximum discount value and calculated value

        -------For fixed -----
        get the value

    #Give the discount
     */
    // 
    // async.waterfall([
    //         function(callBack) {
    //             let promoUsersData = {
    //                 'userId': userId,
    //                 'code': couponCode
    //             };
    //             /*
    //             @Get the data matching the user id and code
    //              */
    //             promoUsers.checkUserPromoCode(promoUsersData, (checkUserCodeError, checkUserCodeResponse) => {
    //                 return callBack(null, checkUserCodeResponse);
    //             });
    //         },
    //         function (checkUserCodeResponse, callBack){
    //             // Check if the user has unlocked that promo code
    //             // Check if the user has 


    //         }


    //     }],
    //     (error, result) => {
    //         if (error) {
    //             return reply(e).code(e.statusCode);
    //         } else {
    //             return reply({
    //                 statusCode: 200,
    //                 message: 'Success',
    //                 promoStatus: status,
    //                 dataId: id[0]

    //             });
    //         }
    //     });
}









function randomText(count) {
    var randomText = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < count; i++)
        randomText += possible.charAt(Math.floor(Math.random() * possible.length));
    return randomText;
}

/*
@Function to update promoUsers collection
 */
// function checkAndUpdatePromoUsers(updateData){
//     async.waterfall([
//         // 
//         ],
//         (error, result) => {
//             if (error) {
//                 return reply(e).code(e.statusCode);
//             } else {
//                 return reply({
//                     statusCode: 200,
//                     message: 'Success',
//                     promoStatus: status,
//                     dataId: id[0]

//                 });
//             }
//         });
// }



// export handler and validator
module.exports = {
    updateClaimHandler,
    updateClaimsValidator
}