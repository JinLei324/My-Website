/**/
const get = require('./get');

const post = require('./post');

const patch = require('./patch');
/** @namespace */
const error = require('../../../../statusMessages/responseMessage');
/** @global */
const Joi = require('joi');
/****/

const headerValidator = require('../../../middleware/validator');


module.exports = [{
            method: 'POST',
            path: '/generateReferralCode',
            config: {
                auth: false,
                handler: post.referralCodeHandler,
                validate: post.referralCodeValidator,
                tags: ['api', 'Referrals'],
                description: 'This api creates a referral code',
                notes: 'This api creates a referral code',
                plugins: {
                    'hapi-swagger': {
                        payloadType: 'json'
                    }
                },
                //    response: {
                //     status: {
                //         200: { message: "Refferal code created successfully", data: Joi.any() },
                //         500: { message: "Error while creating referral code", data: Joi.any() }
                //     }
                // }
            }
        }, {
            method: 'POST',
            path: '/addReferralCampaign',
            config: {
                auth: false,
                handler: post.referralCampaignHandler,
                validate: post.referralCampaignValidator,
                tags: ['api', 'Referrals'],
                description: 'This api creates a referral campaign',
                notes: 'This api creates a referral campaign',
                plugins: {
                    'hapi-swagger': {
                        payloadType: 'json'
                    }
                },
                //    response: {
                //     status: {
                //         200: { message: "Refferal code created successfully", data: Joi.any() },
                //         500: { message: "Error while creating referral code", data: Joi.any() }
                //     }
                // }
            }
        }, {
            method: 'PATCH',
            path: '/updateReferralCode',
            config: {
                auth: false,
                handler: patch.referralCampaignUpdateHandler,
                validate: patch.referralCampaignUpdateValidator,
                tags: ['api', 'Referrals'],
                description: 'This api updates the promo status',
                notes: 'This api updates the promo status',

                // response    : postCampaign.response
                //     response: {
                //     status: {
                //         200: { message: "success", data: Joi.any() },
                //         500: { message: "Error while getting campaigns", data: Joi.any() }
                //     }
                // }
            },

        },
        //update referral campaign 
        {
            method: 'PATCH',
            path: '/referralCampaign',
            config: {
                auth: false,
                handler: patch.referralCampaignHandler,
                validate: patch.referralCampaignValidator,
                tags: ['api', 'Referrals'],
                description: 'This api updates the promo code ',
                notes: 'This api updates the promo code',
                plugins: {
                    'hapi-swagger': {
                        payloadType: 'json'
                    }
                },
                // response    : postCampaign.response
                //     response: {
                //     status: {
                //         200: { message: "success", data: Joi.any() },
                //         500: { message: "Error while getting campaigns", data: Joi.any() }
                //     }
                // }
            },
            
        },
        
        {
            method: 'POST',
            path: '/getReferralCampaignsByStatus',
            config: {
                tags: ['api', 'Referrals'],
                description: 'This api returns the promocodes by status',
                notes: 'Uses offset and limit',
                auth: false,
                validate: {
                    /** @memberof remove */
                    payload: get.allCampaignsByStatusValidator,
                    /** @memberof headerValidator */
                    headers: headerValidator.language,
                    /** @memberof headerValidator */
                    failAction: headerValidator.customError
                },
                // response: {
                //     status: {
                //         200: {
                //             message: error['promoCampaigns']['200']['0'],
                //             totalCount: Joi.any(),
                //             data: Joi.any()
                //         },
                //         500: {
                //             message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                //         }
                //     }
                // }
            },
            /** @memberof get */
            handler: get.allCampaignsByStatusHandler

        }, {
            method: 'GET',
            path: '/validateReferralCode/{referralCode}',
            config: {
                auth: false,
                handler: get.validateReferralCodeHandler,
                validate: get.validateReferralCodeValidator,
                tags: ['api', 'Referrals'],
                description: 'This api checks for the valid referral code',
                notes: 'This api checks for the valid referral code'
                    //    response: {
                    //     status: {
                    //         200: { message: "Refferal code created successfully", data: Joi.any() },
                    //         500: { message: "Error while creating referral code", data: Joi.any() }
                    //     }
                    // }
            }
        }, {
            method: 'GET',
            path: '/referralCodeByUserId/{userId}',
            config: {
                auth: false,
                handler: get.getReferralCodeByUserIdHandler,
                validate: get.getReferralCodeByUserIdValidator,
                tags: ['api', 'Referrals'],
                description: 'This api gets the referral code by user id',
                notes: 'This api gets the referral code by user id'
                    //    response: {
                    //     status: {
                    //         200: { message: "Refferal code created successfully", data: Joi.any() },
                    //         500: { message: "Error while creating referral code", data: Joi.any() }
                    //     }
                    // }
            }
        }, {
            method: 'GET',
            path: '/referralCampaignDetailsById/{campaignId}',
            config: {
                tags: ['api', 'Referrals'],
                description: 'This api returns campaign details by campaign id',
                notes: 'This api returns campaign details by campaign id',
                auth: false,
                validate: {
                    /** @memberof remove */
                    params: get.getReferralCampaignDetailsByIdValidator,
                    /** @memberof headerValidator */
                    headers: headerValidator.language,
                    /** @memberof headerValidator */
                    failAction: headerValidator.customError
                },
                // response: {
                //     status: {
                //         200: {
                //             message: error['promoCampaigns']['200']['0'],
                //             totalCount: Joi.any(),
                //             data: Joi.any()
                //         },
                //         500: {
                //             message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                //         }
                //     }
                // },
            },
            handler: get.getReferralCampaignDetailsByIdHander
        },
        {
            method: 'GET',
            path: '/referralCodesGeneratedByCampaignId/{campaignId}/{offset}/{limit}',
            config: {
                tags: ['api', 'Referrals'],
                description: 'This api returns all the referral codes generated by campaign ',
                notes: 'Uses offset and limit',
                auth: false,
                validate: {
                    /** @memberof remove */
                    params: get.referalCodeListByCampaignIdValidator,
                    /** @memberof headerValidator */
                    headers: headerValidator.language,
                    /** @memberof headerValidator */
                    failAction: headerValidator.customError
                },
                // response: {
                //     status: {
                //         200: {
                //             message: error['promoCampaigns']['200']['0'],
                //             totalCount: Joi.any(),
                //             data: Joi.any()
                //         },
                //         500: {
                //             message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                //         }
                //     }
                // }
            },
            /** @memberof get */
            handler: get.referalCodeListByCampaignIdHandler
        },

        {
            method: 'GET',
            path: '/referralsByUsersIdAndCampaignId/{userId}/{referralCampaignId}/{offset}/{limit}',
            config: {
                tags: ['api', 'Referrals'],
                description: 'This api returns the promocodes by status',
                notes: 'Uses offset and limit',
                auth: false,
                validate: {
                    /** @memberof remove */
                    params: get.totalReferesByUserDuringCampaignValidator,
                    /** @memberof headerValidator */
                    headers: headerValidator.language,
                    /** @memberof headerValidator */
                    failAction: headerValidator.customError
                },
                // response: {
                //     status: {
                //         200: {
                //             message: error['promoCampaigns']['200']['0'],
                //             totalCount: Joi.any(),
                //             data: Joi.any()
                //         },
                //         500: {
                //             message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                //         }
                //     }
                // }
            },
            /** @memberof get */
            handler: get.allReferralsByUserBycampaignId

        },
        {
            method: 'GET',
            path: '/unlockedDataByCampaignId/{campaignId}/{offset}/{limit}',
            config: {
                tags: ['api', 'Referrals'],
                description: 'This api returns all the campaign unlocked bookings',
                notes: 'This api returns all the campaign unlocked bookings',
                auth: false,
                validate: {
                    /** @memberof remove */
                    params: get.totalUnlockedTripCountByCampaignIdValidator,
                    /** @memberof headerValidator */
                    headers: headerValidator.language,
                    /** @memberof headerValidator */
                    failAction: headerValidator.customError
                },
                // response: {
                //     status: {
                //         200: {
                //             message: error['promoCampaigns']['200']['0'],
                //             totalCount: Joi.any(),
                //             data: Joi.any()
                //         },
                //         500: {
                //             message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                //         }
                //     }
                // }
            },
            /** @memberof get */
            handler: get.unlockedTripCountByCampaignIdHandler

        }


        ];