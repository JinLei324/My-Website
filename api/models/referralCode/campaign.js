var campaigns = require('../campaigns');
const cities = require('../cities');
const customer = require('../customer');
// var Status = require('../statusMsg/status');
var Bcrypt = require('bcrypt');
var Joi = require('joi');
var ObjectID = require('mongodb').ObjectID;//to convert stringId to mongodb's objectId
var Async = require('async');
var Request = require("request");
var MOMENT = require('moment');
var CRYPTO = require('crypto');
// var EMAIL = require('./emails');
// var error = require('../statusMsg/errorMessage'); 

// var CONFIG = require('../config/config.json');
// var STATUS = require('../statusMsg/status');
// var AUTH = require('../authentication');//auth module
// var JWT = require('jsonwebtoken');
// var MOMENT = require('moment');
// var ASYNC = require('async');

module.exports = CAMPAIGN = {};//export the methods

/* +__+__+__+__+__+__+__+__+ GENERATE NEW REFERRAL CODE +__+__+__+__+__+__+__+__+ */

/**
 * Method to generate a new referral code and also verify the new code is unique
 * @param {*} codeLength - the length of the referralCode to generate
 */
function getReferralCodeAsync(codeLength) {

    return new Promise((resolve, reject) => {

        chars = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ";
        var rnd = CRYPTO.randomBytes(codeLength)
            , value = new Array(codeLength)
            , len = chars.length;

        for (var i = 0; i < codeLength; i++) {
            value[i] = chars[rnd[i] % len]
        }
        campaigns.read({ code: value.join('').toUpperCase() }, (err, doc) => {
            if (err)
                return reject(err);

            if (doc === null)
                return resolve(value.join('').toUpperCase());

            return resolve(false);
        });
    });
}
;

/**
 * Method to generate a new referral code recursively until found unique
 */
function GETCODE() {

    return getReferralCodeAsync(6)
        .then(code => {

            if (!code)
                return GETCODE().then(code => {
                    return code
                });//recursive

            return code;
        });
}
;

/**
 * API to get a new code
 */
CAMPAIGN.getCode = function (userType, callback) {

    GETCODE().then(code => {

        return callback(null, code);
    });
};


/* +__+__+__+__+__+__+__+__+ VALIDATE & APPLY PROMOCODE +__+__+__+__+__+__+__+__+ */

/**
 * Method to validate the promocode
 * @param {*} req - code, userId, lat, long, paymentType
 * @logic ->
 * 1.check if the user is withing the cities of operation, & get the cityId
 * 2.check if promocode is valid & exists
 * 3.check for promocode expirations
 */
validatePromoCode = (req, callback) => {



    ASYNC.waterfall([

        function (cb) {
            var condition = {
                'polygons': {
                    $geoIntersects: {
                        $geometry: {
                            type: "Point",
                            coordinates: [parseFloat(req.long), parseFloat(req.lat)]
                        }
                    }
                }
            };
            MONGO.SelectOne('cities', condition, (err, city) => {
                if (err)
                    return cb(STATUS.status(3));

                if (city === null)
                    return cb({ errNum: 400, errFlag: 1, errMsg: 'Promocode not applicable in this city' });

                return cb(null, city._id);
            });
        }, //check if the user is withing the cities of operation, & get the cityId

        function (cityId, cb) {


            MONGO.SelectOne(
                'campaigns',
                { code: req.code, cityId: new ObjectID(cityId) },
                (err, doc) => {

                    if (err)
                        return cb(STATUS.status(3));

                    if (doc === null)
                        return cb({ errNum: 400, errFlag: 1, errMsg: 'Invalid PromoCode' });

                    return cb(null, doc);
                });
        }, //check if such a promocode exists

        function (doc, cb) {

            //USERID VALIDATION - FOR USER PROMOTIONS/REFERRALS (code only applicable for the specified user)
            if (typeof doc.userId != 'undefined' && req.userId != doc.userId.toString())
                return cb({ errNum: 400, errFlag: 1, errMsg: 'PromoCode not applicable for you' });


            //IS ACTIVE VALIDATION
            if (doc.status != 1)
                return cb({ errNum: 400, errFlag: 1, errMsg: 'PromoCode expired' });


            //TIME VALIDATION
            if (MOMENT().unix() < doc.startDate)
                return cb({ errNum: 400, errFlag: 1, errMsg: 'PromoCode cannot be used now, try after sometime' });//START DATETIME

            if (MOMENT().unix() > doc.endDate)
                return cb({ errNum: 400, errFlag: 1, errMsg: 'PromoCode expired' });//END DATETIME


            //MAXIMUM GLOBAL USAGE VALIDATION
            if (doc.maxUsage > 0 &&
                typeof doc.usedCount != 'undefined' &&
                doc.usedCount >= doc.maxUsage)
                return cb({ errNum: 400, errFlag: 1, errMsg: 'PromoCode expired' });


            //PAYMENT TYPE VALIDATION ( 1-Cash, 2-Card, 3-Applicable on both)
            if (doc.paymentType != 3 && req.paymentType != doc.paymentType)
                return cb({ errNum: 400, errFlag: 1, errMsg: 'PromoCode not applicable on selected payment type' });


            //APPLIEDON VALIDATION / NUMBER OF TRIPS (1-One time use, 2-X number of trips)
            if (Array.isArray(doc.users)) {

                var codeUsedBy = doc.users.find(user => user.id.toString() === req.userId);

                if (typeof codeUsedBy != 'undefined' && codeUsedBy.count >= doc.noOfTrips)
                    return cb({ errNum: 400, errFlag: 1, errMsg: 'PromoCode cannot be used anymore' });
            }

            return cb(null, doc);
        }, //check for promocode expiration multiple conditions

    ], (err, results) => {
        if (err)
            return callback(err);

        return callback(null, results);
    });
};

/**
 * API to validate the promocode
 * @param {*} req - code, authToken(userId), lat, long, paymentType
 */
CAMPAIGN.validatePromoCode = (req, reply) => {
    validatePromoCode(
        {
            code: req.payload.code,
            userId: req.auth.credentials._id,
            lat: req.payload.lat,
            long: req.payload.long,
            paymentType: req.payload.paymentType
        },
        (err, doc) => {
            if (err)
                return reply(err);

            return reply({ errNum: 200, errFlag: 0, errMsg: 'PromoCode applied successfully' });
        });
};

/**
 * Method to apply the promocode & claim the benefits
 * @param {*} shipmentId
 * @logic ->
 * 1.check if id is valid & get the shipment details
 * 2.also check if a promocode was already applied
 * 3.validate the promocode (to avoid bypassing)
 * 4.update the promocode doc with usedCount & userId
 * 5.update the shipment doc with the discount
 */
CAMPAIGN.applyPromoCode = (shipmentId, callback) => {

    if (!ObjectID.isValid(shipmentId))
        return callback({ errMsg: 'Invalid shipment id' });

    ASYNC.waterfall([
        function (cb) {
            MONGO.SelectOne(
                'ShipmentDetails',
                { _id: new ObjectID(shipmentId) },
                (err, doc) => {
                    if (err)
                        return cb({ errMsg: 'err in shipment', err: err });

                    if (doc === null)
                        return cb({ errMsg: 'Shipment not found' });

                    // if (typeof doc.promoCode === 'undefined')
                    //     return cb({ errMsg: 'No promocode to apply' });
                    if (typeof doc.coupon_code === 'undefined')
                        return cb({ errMsg: 'No promocode to apply' });

                    if (typeof doc.accouting['discountType'] != 'undefined')
                        return cb({ errMsg: 'PromoCode already applied' });

                    return cb(null, doc);
                });
        }, //check if the shipment is valid & if promocode is already applied

        function (shipment, cb) {

            validatePromoCode({
                // code: shipment.promoCode,
                code: shipment.coupon_code,
                userId: shipment.slave_id,
                lat: shipment.pickup_location.latitude,
                long: shipment.pickup_location.longitude,
                paymentType: shipment.payment_type
            }, (err, result) => {
                if (err)
                    return cb(err);

                return cb(null, result, shipment);
            });
        }, //validate the promocode

        function (doc, shipment, cb) {

            if (!Array.isArray(doc.users))
                doc['users'] = [];//check if the promocode is already used by other users

            var indexToUpdate = doc.users.findIndex(user => user.id.toString() === shipment.slave_id.toString());//find the index if the user has already used the promocode

            if (indexToUpdate < 0)
                doc['users'].push({ id: new ObjectID(shipment.slave_id), count: 1 });//push the user details
            else
                doc['users'][indexToUpdate]['count'] += 1;//increment the usage count

            var updateQuery = {
                query: { _id: new ObjectID(doc._id) },
                data: {
                    $inc: { usedCount: 1 }, //increment the overall usage count
                    $set: { users: doc.users }
                }
            };
            MONGO.FINDONEANDUPDATE('campaigns', updateQuery, (err, result) => {
                if (err)
                    return cb(STATUS.status(3));

                return cb(null, doc, shipment);
            });
        }, //update the promocode doc with usedCount & userId

        function (doc, shipment, cb) {

            var discountDetails = {
                'accouting.discountType': doc.discountType,
                'accouting.discount': doc.discount
            };

            if (doc.discountType == 2)
                discountDetails['accouting.maxDiscount'] = doc.maxDiscount;//if discount type is percentage

            var updateQuery = {
                query: { _id: new ObjectID(shipment._id) },
                data: { $set: discountDetails }
            };
            MONGO.FINDONEANDUPDATE('ShipmentDetails', updateQuery, (err, result) => {
                if (err)
                    return cb(STATUS.status(3));

                return cb(null, 'done');
            });
        }//update the shipment doc or apply the discount

    ], (err, result) => {
        if (err) {

            return callback(err);
        }

        return callback(result);
    });
}

/**
 * API to apply promocode
 * @param {*} req - shipmentId
 */
CAMPAIGN.applyPromoCodeAPI = (req, reply) => {
    CAMPAIGN.applyPromoCode(req.payload.shipmentId, (err, result) => {
        if (err)
            return reply(err);

        return reply(result);
    });
}

/* +__+__+__+__+__+__+__+__+ CREDIT TO WALLET +__+__+__+__+__+__+__+__+ */

/**
 * [TODO]
 * Method to credit amount to the wallet
 * @param {*} userId - id of the user to credit to wallet
 * @param {*} campaignDetails - contains details about the campaigns
 * @param {*} callback
 */
function creditToWallet(userId, campaignDetails, callback) {
    return callback(null, true);
}

/* +__+__+__+__+__+__+__+__+ CREATE PROMOCODE & SEND EMAIL +__+__+__+__+__+__+__+__+ */

/**
 * Method to send an email of the new promo code
 * @param {*} userID - id of the user
 * @param {*} code - the promo code
 * @param {*} callback
 */
function sendReferralEmail(userId, code, validUpto, callback) {
    customer.read({ _id: new ObjectID(userId) }, (err, doc) => {
        if (err)
            return callback(err)

        if (doc === null)
            return callback(null);



        // EMAIL.formatAndSendEmail(
        //     {
        //         templateName: 'Coupons',
        //         params: { username: doc.name, code: code, validUpto: validUpto },
        //         toEmail: doc.email
        //     },

        // EMAIL.getTemplateAndSendEmail(
        //     {
        //         templateName: 'promoCode.html',
        //         toEmail: doc.email,
        //         subject: 'Promocode',
        //         keysToReplace: { code: code }
        //     }, () => {
        //     });//send promocode email

        return callback(null, 'done');
    });
}

/**
 * Method to create a new promocode and send out an email to the specified user
 * @param {*} campaign - campaign details
 * @param {*} userId - the receiver
 * @param {*} userType - referrer, referee
 * @param {*} callback - asynchronous
 * @logic ->
 * 1.generate a new promocode
 * 2.generate promocode conditions based on campaign details
 * 3.send out an email
 */
function createPromoCodeAndSendEmail(campaign, userId, userType, callback) {



    var promotionDetails = {};

    Async.waterfall([
        function (cb) {

            GETCODE().then(code => {

                return cb(null, code);
            });
        }, //generate a new promocode

        function (code, cb) {

            promotionDetails = {
                couponType: 'USER REFERRAL',
                code: code,
                rewardType: campaign.referralType,
                userId: new ObjectID(userId),
                cityId: new ObjectID(campaign.cityId),
                discountType: campaign[userType].discountType,
                discount: campaign[userType].discount || 0,
                maxDiscount: campaign[userType].maxDiscount || 0,
                startDate: MOMENT().unix(),
                endDate: MOMENT().add(parseInt(campaign[userType].daysValid), 'days').endOf('day').unix(),
                maxUsage: campaign[userType].maxUsage || 1,
                location: campaign.location,
                status: 1,
                usedCount: 0
            }

            if (typeof campaign.xrides != 'undefined' && typeof campaign.xrides.paymentType != 'undefined')
                promotionDetails.paymentType = campaign.xrides.paymentType;
            else
                promotionDetails.paymentType = 3;//by default on both
            campaigns.insert(promotionDetails, (err, result) => {
                if (err)
                    return cb(err);

                return cb(null, code);
            });
        }//create a new promocode doc in the campaigns collection
    ], (err, code) => {
        if (err)
            return callback(err);

        sendReferralEmail(userId, code, MOMENT.unix(promotionDetails.endDate).format('DD-MMM-YYYY'), () => {
        });//send an email to the user

        return callback(null, true);
    });
}

/* +__+__+__+__+__+__+__+__+ SIGNUP REFERRALS +__+__+__+__+__+__+__+__+ */

/**
 * Method to claim the signup referrals
 * @param {*} campaign - campaign details
 * @param {*} userId - the receiver
 * @param {*} userType - referrer, referee
 * @param {*} callback - asynchronous
 * @logic ->
 * 1.check the referralType ( 1-newSignup, 2-XRides)
 * 2.check for rewardType ( 1-promocode, 2-wallet)
 */
function claimSignupReferral(campaign, userId, userType, callback) {

    Async.waterfall([

        function (cb) {

            if (parseInt(campaign.referralType) == 1)
                return cb(null, true);//benefits can be claimed immediately (newSignup)
            else {

                switch (userType) {

                    case 'referee':
                        if (campaign.xrides.immediateTransferTo == 2)
                            return cb(null, true);//benefits can be claimed immediately for referee

                        break;

                    case 'referrer':
                        if (campaign.xrides.immediateTransferTo == 1)
                            return cb(null, true);//benefits can be claimed immediately for referrer

                        break;
                }

                return cb(null, false);//benefits cannot be claimed immediately
            }
        }, //check for the referralType to claim the benefits immediately

        function (claim, cb) {
            if (claim) {

                switch (parseInt(campaign.rewardType)) {

                    case 1:

                        createPromoCodeAndSendEmail(campaign, userId, userType, (err, result) => {
                            if (err)
                                return cb(err);

                            return cb(null, result);
                        });
                        break;

                    case 2:
                    default:

                        creditToWallet(campaign, userId, (err, result) => {
                            if (err)
                                return cb(err);

                            return cb(null, result);
                        });
                        break;
                }
            } else
                return cb(null, false);
        }//create promocode & send email or credit to wallet based on rewardType
    ], (err, result) => {
        if (err)
            return callback(err);



        return callback(null, result);
    });
}

/**
 * Method to validate the referral code
 * @param {*} req - code, lat, long
 * @param {*} callback
 * @logic ->
 * 1.check if the referral code is valid
 * 2.check if the referrer & referee cities are same
 */
function validateReferralCode(req, callback) {

    let code = req.code,
        lat = req.lat,
        long = req.long;

    // let collection = (req.type == 1) ? 'masters' : 'slaves';

    Async.waterfall([
        function (cb) {
            customer.read({ $or: [{ referralCode: code }, { referralcode: code }] }, (err, referrer) => {
                if (err)
                    return cb(Status.status(3));

                if (referrer === null)
                    return cb({ errNum: 400, errMsg: 'Invalid referral code', errFlag: 1 });

                return cb(null, referrer);
            });
        }, //check if the referral code exists

        function (referrer, cb) {

            var con = {
                'polygons': {
                    $geoIntersects: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(long), parseFloat(lat)]
                        }
                    }
                }
            };
            cities.read(con, (err, city) => {
                if (err)
                    return cb(Status.status(3));

                if (city === null)
                    return cb({ errNum: 400, errMsg: 'We are not operating in this city', errFlag: 1 });

                if (typeof referrer.cityId === 'undefined')
                    referrer.cityId = 0;


                //check if the referee & referrer cities are same
                let response = (referrer.cityId.toString() === city._id.toString()) ? referrer : false;

                return cb(null, response);
            });
        }, //get the cityId & also check if the referral is valid in this city
    ], (err, result) => {
        if (err)
            return callback(err);

        return callback(null, result);
    });
}



/**
 * Method to claim the referral benefits for slaves
 * @param {*} req - userId, code, cityId
 * @param {*} callback
 * @logic ->
 * 1.validate the referralCode, get referrer & cityId
 * 2.check for the campaign details
 * 3.check for referee benefits & claim it
 * 4.check for referrer benefits & claim it
 */
CAMPAIGN.slaveSignUpReferral = (req, callback) => {



    if (typeof req.code === 'undefined' || req.code === null || req.code === '')
        return callback(null, 'no referralCode');

    if (!ObjectID.isValid(req.userId))
        return callback(null, 'no userId');

    var userId = new ObjectID(req.userId);//id of the new user signedup
    var referrer = {};//get the referrer details
    var campaignDetails = {};//get the campaign details

    Async.series([

        function (cb) {
            validateReferralCode(req, (err, doc) => {
                if (err)
                    return cb(err);



                if (!doc)
                    return cb({ errMsg: 'Invalid referral code' });

                referrer = doc;

                req.cityId = doc.cityId;

                return cb(null, 'done');
            });
        }, //validate the referralCode, get the referrer details & cityId

        function (cb) {

            let condition = {
                cityId: new ObjectID(req.cityId),
                status: 1,
                couponType: 'REFERRAL'
            };

            campaigns.read(condition, (err, doc) => {
                if (err)
                    return cb({ errMsg: 'err in campaigns', err: err });

                if (doc === null)
                    return cb({ errMsg: 'No campaigns currently acitve in this city' });

                campaignDetails = doc;



                return cb(null, doc);
            });
        }, //check if there are any campaigns currently acitve in the city

        function (cb) {

            if (typeof campaignDetails.referee != 'undefined') {

                claimSignupReferral(campaignDetails, req.userId, 'referee', (err, result) => {
                    if (err)
                        return cb(err);

                    //referralPending status (referralType 2 - for x-rides, so it will be set to true)
                    let referralPending = (campaignDetails.referralType == 2 &&
                        campaignDetails.xrides.immediateTransferTo == 2) ? true : !result;
                    var updateQuery = {
                        $set: {
                            referralUsed: new ObjectID(referrer._id),
                            referralPending: referralPending,
                            campaignId: new ObjectID(campaignDetails._id)
                        }
                    }
                    customer.findOneAndUpdate(req.userId, updateQuery, (err, result) => {
                        if (err)
                            return cb(err);

                        return cb(null, 'done');
                    });//update the referralUsed, referralPending & campaignId
                });
            } else
                return cb(null, 'done');
        }, //check if there is any benefits for referee & claim it

        function (cb) {

            if (typeof campaignDetails.referrer != 'undefined') {

                claimSignupReferral(campaignDetails, referrer._id, 'referrer', (err, result) => {
                    if (err)
                        return cb(err);

                    return cb(null, 'done');
                });
            } else
                return cb(null, 'done');
        }, //check if there is any benefits for referrer & claim it

    ], (err, results) => {
        if (err) {

            return callback(err);
        }
        var updateQuery = { $addToSet: { referralUsedBy: userId } };
        customer.findOneAndUpdate(referrer._id, updateQuery, (err, result) => {
        });//update the referrer doc with the referred userId, so one user can only use once

        return callback(null, { statusCode: 200, message: 'Successfully signed up with referral code' });
    });
}

/**
 * Method to claim the referral benefits for masters
 * @param {*} req - userId, code, cityId
 * @param {*} callback
 */
CAMPAIGN.masterSignUpReferral = (req, callback) => {

    if (typeof req.code === 'undefined' || req.code === null || req.code === '')
        return callback(null, 'no referralCode');

    if (!ObjectID.isValid(req.userId))
        return callback(null, 'no userId');

    var userId = new ObjectID(req.userId);//id of the new user signedup
    var referrer = {};//get the referrer details

    ASYNC.series([
        function (cb) {
            MONGO.SelectOne(
                'masters',
                {
                    _id: { $ne: userId },
                    referralCode: req.code,
                    referralUsedBy: { $nin: [userId] }
                },
                (err, doc) => {
                    if (err)
                        return cb(STATUS.status(3));

                    if (doc === null)
                        return cb({ statusCode: 400, message: 'Invalid referral code' });

                    referrer = doc;

                    return cb(null, doc);
                });
        }, //check if the referral code is valid & also get the referrer details

    ], (err, results) => {
        if (err)
            return callback(err);

        MONGO.FINDONEANDUPDATE(
            'masters',
            {
                query: { _id: new ObjectID(referrer._id) },
                data: { $addToSet: { referralUsedBy: userId } }
            },
            () => {
            });//update the referrer doc with the referee id, so one user can only use once

        MONGO.FINDONEANDUPDATE(
            'masters',
            {
                query: { _id: userId },
                data: { $set: { referralUsed: new ObjectID(referrer._id) } }
            },
            () => {
            });//update the referee doc with the referrer id

        return callback(null, { statusCode: 200, message: 'Successfully signed up with referral code' });
    });
}

/**
 * APi to check for signup referral for slaves
 */
CAMPAIGN.signUpReferralCheck = (req, reply) => {

    var type = (req.payload.type == 1) ? 'master' : 'slave';

    CAMPAIGN[type + 'SignUpReferral'](req.payload, (err, result) => {
        if (err)
            return reply(err);

        return reply(null, result);
    });
}

/* +__+__+__+__+__+__+__+__+ PENDING REFERRALS +__+__+__+__+__+__+__+__+ */

/**
 * Method to claim the pending referrals after X-RIDES
 * @param {*} campaign - campaign details
 * @param {*} userId - the receiver
 * @param {*} userType - referrer, referee
 * @param {*} callback - asynchronous
 * @logic ->
 * 1.check for the immediate transfer flag (1-referrer, 2-referee (would have already received benefits on signup))
 * 2.check for the rewardType and act based on that (1-promocode, 2-credit to wallet)
 */
function claimPendingReferralBenefits(campaign, userId, userType, callback) {

    ASYNC.waterfall([

        function (cb) {



            switch (userType) {

                case 'referee':
                    if (campaign.xrides.immediateTransferTo == 2)
                        return cb(null, false);//would have already got the benefits on signup

                    break;

                case 'referrer':
                    if (campaign.xrides.immediateTransferTo == 1)
                        return cb(null, false);//would have already got the benefits on signup

                    break;
            }

            return cb(null, true);
        }, //check for immediate transfer

        function (tocontinue, cb) {

            if (tocontinue) {

                switch (parseInt(campaign.rewardType)) {

                    case 1:

                        createPromoCodeAndSendEmail(campaign, userId, userType, (err, result) => {
                            if (err)
                                return cb(err);

                            return cb(null, result);
                        });
                        break;

                    case 2:
                    default:

                        creditToWallet(campaign, userId, (err, result) => {
                            if (err)
                                return cb(err);

                            return cb(null, result);
                        });
                        break;
                }
            } else
                return cb(null, false);
        }//create promocode & send email or credit to wallet based on rewardType

    ], (err, result) => {
        if (err)
            return callback(err);



        return callback(null, result);
    });
}

/**
 * Method to check and complete the pending referrals(sendPromoCode / credit to wallet)
 * @param {*} req - userId
 * @logic ->
 * 1.check for the referralPending status
 * 2.get the campagin details
 * 3.check if the x-rides condition is met
 * 4.check & send the referee benefits
 * 5.check & send the referrer benefits
 */
CAMPAIGN.completeSlavePendingReferrals = (req, callback) => {



    let referrerId = '';

    ASYNC.waterfall([

        function (cb) {
            MONGO.SelectOne('slaves', { _id: new ObjectID(req.userId), referralPending: true }, (err, doc) => {
                if (err)
                    return cb({ errMsg: 'err in slaves', err: err });

                if (doc === null)
                    return cb({ errMsg: 'no pending referrals' });

                referrerId = new ObjectID(doc.referralUsed);//referrer id

                return cb(null, doc);
            });
        }, //check if there are any pending referrals

        function (slave, cb) {
            MONGO.SelectOne('campaigns', { _id: new ObjectID(slave.campaignId) }, (err, doc) => {
                if (err)
                    return cb({ errMsg: 'err in campaigns', err: err });

                if (doc === null)
                    return cb({ errMsg: 'Campaign not found' });

                return cb(null, doc);
            });
        }, //get the campaign details

        function (campaign, cb) {

            if (typeof campaign.xrides != 'undefined') {



                let condition = {
                    slave_id: new ObjectID(req.userId),
                    status: 10
                };//only completed shipments

                if (campaign.xrides.paymentType != 3)
                    condition['payment_type'] = campaign.xrides.paymentType;//for paymentType check(3-valid on any paymentType)

                switch (parseInt(campaign.xrides.type)) {

                    //x-number of rides
                    case 1:
                        MONGO.Count('ShipmentDetails', condition, (err, count) => {
                            if (err)
                                return cb({ errMsg: 'err in ShipmentDetails, x-number of rides', err: err });

                            if (count >= campaign.xrides.units)
                                return cb(null, campaign);//condition satisfied

                            return cb({ errMsg: 'X-rides condition in not satisfied' });//condition not satisfied
                        });
                        break;

                    //x-amount of transactions
                    case 2:
                    default:
                        let aggregationQuery = [
                            { $match: condition },
                            { $group: { _id: '$slave_id', total: { $sum: '$accouting.total' } } }
                        ];
                        MONGO.AGGREGATE('ShipmentDetails', aggregationQuery, (err, result) => {
                            if (err)
                                return cb({ errMsg: 'err in ShipmentDetails, x-amount of transactions', err: err });

                            if (result.length === 0)
                                return cb({ errMsg: 'X-rides ammount condition in not satisfied' });

                            if (result[0].total >= parseFloat(campaign.xrides.units))
                                return cb(null, campaign);//condition satisfied

                            return cb({ errMsg: 'X-rides ammount condition in not satisfied' });//condition not satisfied
                        });
                }
            } else
                return cb({ errMsg: 'X-rides condition is not defined in campaigns' });
        }, //x-rides & paymentType check

        function (campaign, cb) {

            if (typeof campaign.referee != 'undefined') {

                claimPendingReferralBenefits(campaign, req.userId, 'referee', (err, result) => {
                    if (err)
                        return cb(err);

                    MONGO.FINDONEANDUPDATE(
                        'slaves',
                        {
                            query: { _id: new ObjectID(req.userId) },
                            data: { $set: { referralPending: false } }
                        },
                        (err, result) => {
                            if (err)
                                return cb(err);

                            return cb(null, campaign);
                        });//update the referralPending status to false
                });
            } else
                return cb(null, campaign);
        }, //claim the referee benefits

        function (campaign, cb) {

            if (typeof campaign.referrer != 'undefined') {

                claimPendingReferralBenefits(campaign, referrerId, 'referrer', (err, result) => {
                    if (err)
                        return cb(err);

                    return cb(null, result);
                });
            } else
                return cb(null, 'done');
        }//claim the referrer benefits

    ], (err, result) => {
        if (err) {

            return callback(err);
        }

        return callback(null, result)
    });
}

/**
 * API to complete the slaves pending referrals
 * @param {*} req - userId
 */
CAMPAIGN.checkPendingReferrals = (req, reply) => {

    CAMPAIGN.completeSlavePendingReferrals(req.payload, (err, result) => {
        if (err)
            return reply(err);

        return reply(null, result);
    });
}

/* +__+__+__+__+__+__+__+__+  END +__+__+__+__+__+__+__+__+ */

module.exports.testReferralCode = (req, reply) => {
    CAMPAIGN.getCode(2, function (code) {


        referralcode = code;

        return reply(null, code);
    });
};