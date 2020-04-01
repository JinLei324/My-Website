// patch a campaign

require("moment");
const Joi = require("joi");
const async = require("async");
const logger = require('winston');
const Promise = require('promise');
const moment = require('moment');

const ObjectID = require('mongodb').ObjectID;
const couponCode = require('../../../../models/promoCodes/promoCodes');
const error = require('../../../../statusMessages/responseMessage');



let couponCodeUpdateValidator = {
    payload: {
        promoCodeId: Joi.any().required().description('Mandatory Field.'),
        status: Joi.number().required().description('Mandatory Field. For status (1 -> "enabled", 2 -> "disabled", 3 -> "expired"). For approve status (1 - "approved", 2 - "pending" or 3 - "rejected")')
    }
}

// Post a new offer then reply the response
let couponCodeUpdateHandler = (request, reply) => {
    var campaignId = request.payload.promoCodeId;
    var campaignMongoIds = [];
    campaignId.forEach(function (entry) {
        var campaignMongoId = new ObjectID(entry);
        campaignMongoIds.push(campaignMongoId);
    });
    let dateTime = require('node-datetime');
    let dt = dateTime.create();
    let formatted = dt;
    let statusString = "";
    switch (request.payload.status) {
        case 2:
            statusString = "Active";
            break;
        case 3:
            statusString = "In-Active";
            break;
        case 4:
            statusString = "Expired";
            break;
        case 5:
            statusString = "Deleted";
            break;
    }
    let data = {
        "couponMongoIds": campaignMongoIds,
        "status": request.payload.status,
        "statusString": statusString
    };

    couponCode.updateStatus(data, (err, res) => {
        if (err) {
            logger.error('Error while posting new offer : ' + err);
            // return reply({ message: "Error while updating"}).code(500);
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        }
        // return reply({ message: "success"}).code(200);
        return reply({
            message: "Success"
        }).code(200);

    });
}

// update promo code
let promoCodeUpdateValidator = {
    payload: {
        promoId: Joi.string().required(),
        title: Joi.string().required().description('Mandatory field. '),
        code: Joi.string().description('Mandatory field. '),
        adminLiability: Joi.string().required().description('Mandatory Field'),
        storeLiability: Joi.string().required().description('Mandatory Field'),
        cities: Joi.any().required().description('Mandatory field. '),
        // cityNames: Joi.any().required().description('Mandatory field'),
        zones: Joi.any().required().description('Mandatory field. '),
        rewardType: Joi.number().required().description('Mandatory field. '),
        paymentMethod: Joi.number().required().description('Mandatory field. '),
        isApplicableWithWallet: Joi.number().required().description('Mandatory field. '),
        discount: Joi.any().required().description('Mandatory field. '),
        startTime: Joi.any().required().description('Mandatory field. '),
        endTime: Joi.any().required().description('Mandatory field. '),
        globalUsageLimit: Joi.number().required().description('Mandatory field. '),
        perUserLimit: Joi.number().required().description('Mandatory field. '),
        // globalClaimCount: Joi.number().required().description('Mandatory field. '),
        store: Joi.any().required().description('Mandatory field. '),
        applicableOn: Joi.number().required().description('Mandatory field'),
        termsAndConditions: Joi.any().required().description('Mandatory field for terms and conditions'),
        description: Joi.any().description('Non mandatory field.'),
        howItWorks: Joi.any().description('Non mandatory field'),
        minimumPurchaseValue: Joi.any().description("Minimum purchase value")
        //LAXMAN


    }
}

let promoCodeUpdateHandler = (request, reply) => {
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
        promoId: new ObjectID(request.payload.promoId),
        title: request.payload.title,
        code: request.payload.code,
        storeLiability: parseInt(request.payload.storeLiability),
        adminLiability: parseInt(request.payload.adminLiability),
        status: 2,
        statusString: 'active',
        promoType: "couponCode",
        cities: request.payload.cities,
        category: request.payload.category,
        // cityNames: request.payload.cityNames,
        zones: request.payload.zones,
        store: request.payload.store,
        // rewardType: request.payload.rewardType,
        // rewardTypeString: "string",
        paymentMethod: request.payload.paymentMethod,
        isApplicableWithWallet: request.payload.isApplicableWithWallet || 0,
        paymentMethodString: paymentMethodString,
        minimumPurchaseValue: parseInt(request.payload.minimumPurchaseValue),
        discount: request.payload.discount,
        startTime: request.payload.startTime,
        endTime: request.payload.endTime,
        globalUsageLimit: request.payload.globalUsageLimit,
        perUserLimit: request.payload.perUserLimit,
        // globalClaimCount: request.payload.globalClaimCount,
        vehicleType: request.payload.vehicleType,
        created: formatted,
        createdIso: new Date(),
        applicableOn: request.payload.applicableOn,
        applicableOnString: applicableOnString,
        termsAndConditions: request.payload.termsAndConditions,
        description: request.payload.description,
        howItWorks: request.payload.howItWorks
    };

    couponCode.updatePromoCode(offersData, (err, res) => {
        if (err) {
            logger.error('Error while posting new offer : ' + err);
            // return reply({ message: "Error while updating"}).code(500);
            return reply({
                message: request.i18n.__('genericErrMsg')['500']
            }).code(500);
        }
        // return reply({ message: "success"}).code(200);
        return reply({
            message: "Success"
        }).code(200);

    });
}



let response = {
    status: {
        200: { message: "Success" },
        500: { message: "Error while updating" }
    }
}
module.exports = { couponCodeUpdateValidator, couponCodeUpdateHandler, promoCodeUpdateValidator, promoCodeUpdateHandler }  