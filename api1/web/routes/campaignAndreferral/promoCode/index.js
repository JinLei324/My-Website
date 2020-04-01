/**/
const post = require('./post');
const get = require('./get');
const patch = require('./patch');

/** @namespace */
const i18n = require('../../../../locales/locales');
//const error = require('../../../locales');
/** @global */
const Joi = require('joi');

const headerValidator = require('../../../middleware/validator');


module.exports = [{
    method: 'POST',
    path: '/promoCode',
    config: {
        auth: false,
        handler: post.couponCodeHandler,
        validate: post.couponCodeValidator,
        tags: ['api', 'Promo Code'],
        description: 'This API adds a new Promo Code',
        notes: 'This API allows to add a new Promo Code',
        plugins: {
            'hapi-swagger': {
                payloadType: 'json'
            }
        },
        response: post.response

    },

}, {
    method: 'POST',
    path: '/checkPromoCode',
    config: {
        auth: false,
        handler: post.postRequestHandler,
        validate: post.postRequestValidator,
        tags: ['api', 'Promo Code'],
        description: 'This api is used to apply the Promo Code',
        notes: 'This api is used to apply the Promo Code',
        plugins: {
            'hapi-swagger': {
                payloadType: 'json'
            }
        },
        response: post.response

    },

}, {
    method: 'POST',
    path: '/lockPromoCode',
    config: {
        auth: false,
        handler: post.lockCouponCodeHandler,
        validate: post.postRequestValidator,
        tags: ['api', 'Promo Code'],
        description: 'This api is used to lock the Promo Code',
        notes: 'This api is used to lock the Promo Code',
        plugins: {
            'hapi-swagger': {
                payloadType: 'json'
            }
        },
        response: post.response

    },

}, {
    method: 'POST',
    path: '/unlockPromoCode',
    config: {
        auth: false,
        handler: post.unlockCouponHandler,
        validate: post.unlockPromoCodeValidator,
        tags: ['api', 'Promo Code'],
        description: 'This api is used to unlock the Promo Code',
        notes: 'This api is used to unlock the Promo Code',
        plugins: {
            'hapi-swagger': {
                payloadType: 'json'
            }
        },
        response: post.response

    },

}, {
    method: 'GET',
    path: '/promoByCityId/{cityId}',
    config: {
        auth: false,
        handler: get.allPromoCodesByCityIdHandler,
        validate: get.getAvaialablePromoCodesByCityIdValidator,
        tags: ['api', 'Promo Code'],
        description: 'This api returns the promo codes as per city id',
        notes: 'This api returns the promo codes as per city id',

        response: {
            status: {
                200: {
                    message: Joi.any().default("success"),
                    data: Joi.any()
                },
                400: {
                    message: Joi.any().default("no promo codes")
                },
                500: {
                    message: "Error while getting promocodes"
                }
            }
        }

    },

},
{
    method: 'GET',
    path: '/promoByCityId/{cityId}/{storeIds}',
    config: {
        auth: false,
        handler: get.allPromoCodesByCityandStoreIdHandler,
        validate: get.getAvaialablePromoCodesByCityandStoreIdValidator,
        tags: ['api', 'Promo Code'],
        description: 'This api returns the promo codes as per city id',
        notes: 'This api returns the promo codes as per city id',

        response: {
            status: {
                200: {
                    message: Joi.any().default("success"),
                    data: Joi.any()
                },
                400: {
                    message: Joi.any().default("no promo codes")
                },
                500: {
                    message: "Error while getting promocodes"
                }
            }
        }

    },

},
{
    method: 'POST',
    // path: '/couponCodesByStatus/{status}/{offset}/{limit}/{sSearch}/{cityId}',
    path: '/couponCodesByStatus/',

    config: {
        tags: ['api', 'Promo Code'],
        description: 'This api returns the promocodes by status',
        notes: 'Uses offset and limit',
        auth: false,
        validate: {
            /** @memberof remove */
            payload: get.allCouponCodeByStatusValidator,
            /** @memberof headerValidator */
            headers: headerValidator.language,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        // response: {
        //     status: {
        //         200: {
        //             message: error['promoCampaigns']['200'],
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
    handler: get.allCouponCodeByStatusHandler
}, {
    method: 'POST',
    path: '/claimPromoCode',
    config: {
        auth: false,
        handler: post.claimCouponHandler,
        validate: post.claimCouponValidator,
        tags: ['api', 'Promo Code'],
        description: 'This api is used to update the claim',
        notes: 'This api is used to update the claim',
        plugins: {
            'hapi-swagger': {
                payloadType: 'json'
            }
        },
        response: post.response

    },

}, {
    method: 'PATCH',
    path: '/updatePromoCode',
    config: {
        auth: false,
        handler: patch.couponCodeUpdateHandler,
        validate: patch.couponCodeUpdateValidator,
        tags: ['api', 'Promo Code'],
        description: 'This api is used to update status of the promo code',
        notes: 'This api is used to update status of  the Promo Code',
        plugins: {
            'hapi-swagger': {
                payloadType: 'json'
            }
        },
        response: patch.response

    },

},
{
    method: 'PATCH',
    path: '/promoCode',
    config: {
        auth: false,
        handler: patch.promoCodeUpdateHandler,
        validate: patch.promoCodeUpdateValidator,
        tags: ['api', 'Promo Code'],
        description: 'This api is used to update the promo code',
        notes: 'This api is used to update the Promo Code',
        plugins: {
            'hapi-swagger': {
                payloadType: 'json'
            }
        },
        response: patch.response

    },

},

// get promocode details by id
{
    method: 'GET',
    path: '/promoCodeById/{promoId}',
    config: {
        tags: ['api', 'Promo Code'],
        description: 'This api returns the promo code details by promo Id',
        notes: 'This api returns the promo code details by promo Id',
        auth: false,
        validate: {
            /** @memberof remove */
            params: get.promoDetailsByIdValidator,
            /** @memberof headerValidator */
            headers: headerValidator.language,
            /** @memberof headerValidator */
            failAction: headerValidator.customError
        },
        /*response: {
            status: {
                200: { message: error['promoCampaigns']['200'], data: Joi.any() },
                500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
            }
        }*/

        response: {
            status: {
                200: {
                    message: Joi.any().default(i18n.__('promoCampaigns')['200']),
                    data: Joi.any()
                },
                500: {
                    message: Joi.any().default(i18n.__('genericErrMsg')['500'])
                }
            }
        }
    },
    /** @memberof get */
    handler: get.promoDetailsByIdHandler
},
];