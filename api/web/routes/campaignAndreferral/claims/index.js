/**/
const get = require('./get');

/** @namespace */
/** @global */
const Joi = require('joi');


module.exports = [
{
        method: 'GET',
        path: '/allCalims',
        config: {
            auth: false,
            handler: get.allClaims,
            tags: ['api', 'Claims'],
            description: 'This api is used to get all claim.',
            notes: 'This api is used to update the claim.',
            plugins: {
                'hapi-swagger': {
                    payloadType: 'json'
                }
            },

        },

    },
    {
        method: 'GET',
        path: '/allCalimsByOfferId/{campaignId}',
        config: {
            auth: false,
            handler: get.getClaimedDataByCampaignIdHandler,
            validate: get.getClaimedDataByCampaignIdValidator,
            tags: ['api', 'Claims'],
            description: 'This api is used to get all claimss by campaign or offer id.',
            notes: 'This api is used to update the claim.',
            plugins: {
                'hapi-swagger': {
                    payloadType: 'json'
                }
            },

        },

    }

];