/** @global */
const Joi = require('joi')
/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const i18n = require('../../../../../locales/locales');
// const errorMsg = require('../../../../../locales');
/** @namespace */
const postSignup = require('./post');
/**
* A module that exports Customer API  routes to hapi server!
* @exports CUSTOMER-SIGNUP-API-ROUTES 
*/
module.exports = [
    /**
    * api to signUp
    */
    {
        method: 'POST',
        path: '/dispatcher/customer',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'API for customer signup',
            notes: "This API allows the User to sign up using his phone number and email ID ,google account or facebook account",
            auth: 'managerJWT',
            validate: {
                /** @memberof postSignup validator */
                payload: {
                    name: Joi.string().required().description('Name'),
                    email: Joi.string().trim().empty('').email().description('Email').allow(""),
                    // deviceId: Joi.string().required().description('Device id'),
                    // pushToken: Joi.string().required().description('Push token'),
                    //  password: Joi.string().required().description('Password'),
                    countryCode: Joi.string().trim().empty('').required().description('Country code'),
                    mobile: Joi.string().trim().empty('').required().description('Mobile'),
                    //  profilePic: Joi.any().description('Profile pic'),
                    // loginType: Joi.number().integer().min(1).max(3).required().description('1- Normal login, 2- Fb , 3-Google'),
                    // dateOfBirth: Joi.string().description('Date of birth format : YYYY-MM-DD'),
                    //  socialMediaId: Joi.any().description(' Fb id or Google id'),
                    //   termsAndCond: Joi.number().required().integer().min(0).max(1).description('0 - false,1 - true').error(new Error('Invalid terms and conditions')),
                    latitude: Joi.number().description('Latitude'),
                    longitude: Joi.number().description('Longitude'),
                    deviceType: Joi.number().required().integer().min(1).max(4).description('1- IOS , 2- Android 4- disspatcher'),
                    // appVersion: Joi.string().required().description('App version'),
                    //  deviceOsVersion: Joi.string().description('Device Os Version'),
                    // deviceMake: Joi.string().required().description('Device Make'),
                    //  deviceModel: Joi.string().required().description('Device model'),
                    //  deviceTime: Joi.string().description('format : YYYY-MM-DD HH:MM:SS'),
                    //  referralCode: Joi.string().description('Referral code optional').allow(""),
                    // currency: Joi.string().description('currency optional').allow(""),
                    // currencySymbol: Joi.string().description('currencySymbol optional').allow(""),
                    // identityCard: Joi.string().description('Identity Card'),
                    // mmjCard: Joi.string().description('MMJ Card'),
                    cityId: Joi.string().description('cityId'),
                    storeId: Joi.string().description('storeId'),
                    cityName: Joi.string().description('cityName'),
                    zoneId: Joi.string().description('zoneId'),
                    ipAddress: Joi.string().description('Ip Address')
                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('genericErrMsg')['200']), data: Joi.any()
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