/**/
const postCampaign = require('./post');
const getCampaign = require('./get');
const patchCampaign = require('./patch');

const headerValidator = require('../../../middleware/validator');

/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi');


module.exports = [
    {
        method: 'POST',
        path: '/campaigns',
        config: {
            auth: false,
            handler: postCampaign.offersHandler,
            validate: postCampaign.offersValidator,
            tags: ['api', 'Campaigns'],
            description: 'This API adds a new promo campaign',
            notes: 'This API allows to add a new promo campaign',
            plugins: {
                'hapi-swagger': {
                    payloadType: 'json'
                }
            },
            // response    : postCampaign.response
            // response: 


        },

    },
    {
        method: 'GET',
        path: '/campaigns',
        config: {
            auth: false,
            handler: getCampaign.allCampaignsHandler,
            tags: ['api', 'Campaigns'],
            description: 'This api returns all the promos',
            notes: 'This api returns all the promos',
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
    },
    {
        method: 'POST',
        path: '/getCampaignsByStatus',
        config: {
            tags: ['api', 'Campaigns'],
            description: 'This api returns the promo campaigns by status',
            notes: 'Uses offset and limit',
            auth: false,
            validate: {
                /** @memberof remove */
                payload: getCampaign.allCampaignsByStatusValidator,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            // response: {
            //     status: {
            //         200: { message: error['promoCampaigns']['200'], totalCount: Joi.any(), data: Joi.any() },
            //         500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            //     }
            // }
        },
        /** @memberof get */
        handler: getCampaign.allCampaignsByStatusHandler
    },
    {
        method: 'GET',
        path: '/campaignById/{campaignId}',
        config: {
            tags: ['api', 'Campaigns'],
            description: 'This api returns the camapign details by camapign Id',
            notes: 'This api returns the camapign details by camapign Id',
            auth: false,
            validate: {
                /** @memberof remove */
                params: getCampaign.campaignDetailsByIdValidator,
                /** @memberof headerValidator */
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            // response: {
            //     status: {
            //         200: { message: error['promoCampaigns']['200'], data: Joi.any() },
            //         500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            //     }
            // }
        },
        /** @memberof get */
        handler: getCampaign.camapignDetailsByIdHandler
    },
    {
        method: 'PATCH',
        path: '/updateCampaigns',
        config: {
            auth: false,
            handler: patchCampaign.campaignUpdateHandler,
            validate: patchCampaign.campaignUpdateValidator,
            tags: ['api', 'Campaigns'],
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
    {
        method: 'PATCH',
        path: '/campaign',
        config: {
            auth: false,
            handler: patchCampaign.promoCampaignUpdateHandler,
            validate: patchCampaign.promoCampaignUpdateValidator,
            tags: ['api', 'Campaigns'],
            description: 'This api updates the promo code',
            notes: 'This api updates the promo code',
            plugins: {
                'hapi-swagger': {
                    payloadType: 'json'
                }
            },
        },
    }

];