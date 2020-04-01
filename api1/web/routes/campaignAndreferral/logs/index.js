const get = require('./get');

const post = require('./post');

const headerValidator = require('../../../middleware/validator');

const error = require('../../../../statusMessages/responseMessage');

const Joi = require('joi');

module.exports = [{
        method: 'POST',
        path: '/newInputLog',
        config: {
            auth: false,
            handler: post.postInputLogsHandler,
            validate: post.postInputLogsValidator,
            tags: ['api', 'Campaign Logs'],
            description: 'This posts a new input log',
            notes: 'This posts a new input log',

            // response    : postCampaign.response
            // response: 


        },

    }, {
        method: 'GET',
        path: '/allInputTripLogs',
        config: {
            auth: false,
            handler: get.allTripLogsHandler,
            tags: ['api', 'Campaign Logs'],
            description: 'This posts a new input log',
            notes: 'This posts a new input log',
            plugins: {
                'hapi-swagger': {
                    payloadType: 'json'
                }
            }
            // response    : postCampaign.response
            //     response: {
            //     status: {
            //         200: { message: "success", data: Joi.any() },
            //         500: { message: "Error while getting campaigns", data: Joi.any() }
            //     }
            // }
        },
    }, {
        method: 'GET',
        path: '/allQualifiedTripLogs',
        config: {
            auth: false,
            handler: get.allQualifiedTripLogs,
            tags: ['api', 'Campaign Logs'],
            description: 'This api returns all the qualified trip logs',
            notes: 'This api returns all the qualified trip logs',
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
        method: 'GET',
        path: '/qualifiedTripLogsByCampaignId/{campaignId}/{offset}/{limit}',
        config: {
            tags: ['api', 'Campaign Logs'],
            description: 'This api returns all the qualified trip logs by campaign id',
            notes: 'This api returns all the qualified trip logs by campaign id',
            auth: false,
            validate: {
                /** @memberof remove */
                params: get.qualifiedTripsByPromoIdValidator,
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
        handler: get.qualifiedTripsByPromoIdsHandler
    },
     {
        method: 'GET',
        path: '/unlockedCodeCountByCampaignId/{campaignId}/{offset}/{limit}',
        config: {
            tags: ['api', 'Campaign Logs'],
            description: 'This api returns all the unlocked code count by campaign id',
            notes: 'This api returns all the unlocked code count by campaign id',
            auth: false,
            validate: {
                /** @memberof remove */
                params: get.unlockedDetailsByCampaignIdValidator,
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
        handler: get.unlockedDetailsByCampaignIdHandler
    },
    {
        method: 'GET',
        path: '/claimedCodeDetailsByCampaignId/{campaignId}/{offset}/{limit}',
        config: {
            tags: ['api', 'Campaign Logs'],
            description: 'This api returns all the claimed code count by campaign id',
            notes: 'This api returns all the claimed code count by campaign id',
            auth: false,
            validate: {
                /** @memberof remove */
                params: get.claimedDetailsByCampaignIdValidator,
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
        handler: get.claimedDetailsByCampaignIdHandler
    },
    {
        method: 'GET',
        path: '/unlockedTripLogsById/{campaignId}/{offset}/{limit}',
        config: {
            tags: ['api', 'Campaign Logs'],
            description: 'This api returns all the unlocked trip logs by campaign id',
            notes: 'This api returns all the unlocked trip logs by campaign id',
            auth: false,
            validate: {
                /** @memberof remove */
                params: get.campaignUnlockedTripLogsByIdValidator,
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
        handler: get.campaignUnlockedTripLogsByIdHandler
    },



]