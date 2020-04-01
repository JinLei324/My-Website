'use strict';
const joi = require('joi');
const logger = require('winston');
const errorMsg = require('../../../../locales');
const ObjectID = require('mongodb').ObjectID;
const customer = require('../../../../models/customer');
const cities = require('../../../../models/cities');
const campaignAndreferral = require('../../campaignAndreferral/promoCode/post');

const payload = joi.object({
    // latitude: joi.number().required().description('latitude').error(new Error('Latitude must be number')),
    // longitude: joi.number().required().description('longitude').error(new Error('Longitude must be number')),
    // amount: joi.number().required().description('amount'),
    // storeIds: joi.any().required().description('Mandatory field'),
    // cityId: joi.string().required().description('Mandatory field. '),
    // paymentMethod: joi.number().required().integer().min(1).max(3).description('1- card , 2- cash').error(new Error("Payment method is missing")),
    // payByWallet: joi.number().integer().default(0).description('payByWallet :1- wallet 0-not select wallet').error(new Error("Paid by wallet is missing")),
    // couponCode: joi.string().required().description('Code required'),
    userId: joi.string().required().description('Mandatory field. '),
    couponCode: joi.string().required().description('Mandatory Field'),
    cityId: joi.string().required().description('Mandatory field. '),
    zoneId: joi.string().allow('').description('Mandatory field. '),
    paymentMethod: joi.number().required().description('Mandatory field. '),
    storeIds: joi.any().required().description('Mandatory field'),
    deliveryFee: joi.number().required().description('Mandatory fiedl'),
    cartValue: joi.number().required().description('Mandatory field.'),
    payByWallet: joi.number().integer().default(0).description('payByWallet :1- wallet 0-not select wallet').error(new Error("Paid by wallet is missing")),
    finalPayableAmount: joi.number().required().description('Mandatory field')
}).required();//payload validator


const handler = (req, reply) => {

    const dbErrResponse = { message: req.i18n.__('genericErrMsg')['500'], code: 500 };

    const checkCode = (data) => {
        return new Promise((resolve, reject) => {
            let dataReq = {
                userId: req.payload.userId,
                couponCode: req.payload.couponCode,
                cityId: (req.payload.cityId).toString(),
                zoneId: '',
                paymentMethod: req.payload.paymentMethod,
                payByWallet: req.payload.payByWallet,
                vehicleType: 0,
                deliveryFee: req.payload.deliveryFee,
                storeIds: req.payload.storeIds,
                cartValue: parseFloat(parseFloat(req.payload.cartValue).toFixed(2)),
                finalPayableAmount: parseFloat(parseFloat(req.payload.finalPayableAmount).toFixed(2))
            }
            campaignAndreferral.postRequestHandler(dataReq, (err, res) => {
                if (err)
                    return reject(err)
                else
                    return resolve(res);
            })
        });
    }
    checkCode()
        .then(data => {
            data.data.couponCode = req.payload.couponCode;
            return reply({ message: "Promo code applied successfully", data: data.data }).code(200);
        })
        .catch(e => {
            logger.error("AppConfig postBooking API error =>", e)
            return reply({ message: e.message }).code(e.code);
        });
}
const responseCode = {
    // status: {
    //     200: { message: error['postReferralCodeValidation']['200'][error['lang']], data: joi.any() },
    //     400: { message: error['postReferralCodeValidation']['400'][error['lang']] },
    //     401: { message: error['postReferralCodeValidation']['401'][error['lang']] },
    //     500: { message: Joi.any().default(i18n.__('genericErrMsg')['500'])[error['lang']] }
    // }

}//swagger response code

module.exports = {
    payload,
    handler,
    responseCode
};