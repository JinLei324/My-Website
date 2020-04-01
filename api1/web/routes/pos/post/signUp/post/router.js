/** @global */
const Joi = require('joi')
/** @global */
const headerValidator = require('../../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../../locales/locales');

/** @namespace */
const postSignup = require('./post');
/**
* A module that exports Customer API  routes to hapi server!
* @exports POS-SIGNUP-API-ROUTES 
*/
module.exports = [
    /**
    * api to signUp
    */
    {
        method: 'POST',
        path: '/pos/customer',
        config: {
            tags: ['api', 'pos'],
            description: 'API for pos customer signup',
            notes: "This API allows the User to sign up using his posid phone number and email ID ,google account or facebook account",
            auth: false,
            validate: {
                /** @memberof postSignup validator */
                payload: {
                    customerPOSId: Joi.number().required().description('customerPOSId'),
                    name: Joi.string().required().description('Name'),
                    email: Joi.string().trim().empty('').email().required().description('Email'),
                    deviceId: Joi.string().required().description('Device id'),
                    pushToken: Joi.string().description('Push token'),
                    password: Joi.string().required().description('Password'),
                    countryCode: Joi.string().trim().empty('').required().description('Country code'),
                    mobile: Joi.string().trim().empty('').required().description('Mobile'),
                    profilePic: Joi.any().description('Profile pic'),
                    loginType: Joi.number().integer().min(1).max(4).required().description('1- Normal login, 2- Fb , 3-Google 4 - pos'),
                    dateOfBirth: Joi.string().description('Date of birth format : YYYY-MM-DD'),
                    termsAndCond: Joi.number().required().integer().min(0).max(1).description('0 - false,1 - true').error(new Error('Invalid terms and conditions')),
                    latitude: Joi.number().description('Latitude'),
                    longitude: Joi.number().description('Longitude'),
                    deviceType: Joi.number().required().integer().min(1).max(3).description('1- IOS , 2- Android 3 -web'),
                    appVersion: Joi.string().required().description('App version'),
                    deviceMake: Joi.string().required().description('Device Make'),
                    deviceModel: Joi.string().required().description('Device model'),
                    deviceTime: Joi.string().description('format : YYYY-MM-DD HH:MM:SS'),
                    referralCode: Joi.string().description('Referral code optional').allow(""),
                    identityCard: Joi.string().description('Identity Card'),
                    mmjCard: Joi.string().description('MMJ Card'),
                    cityId: Joi.string().description('cityId'),
                    zoneId: Joi.string().description('zoneId'),
                    city: Joi.string().description('city name'),
                    ipAddress: Joi.string().description('Ip Address')
                },
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('slaveRegisterUser')['200']), data : Joi.any()
                    },
                    412: { message: Joi.any().default(i18n.__('postSignUp')['412']) },
                    413: { message: Joi.any().default(i18n.__('postSignUp')['413']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof postSignup */
        handler: postSignup.handler
    }
];