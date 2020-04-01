/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const get = require('../../../commonModels/cart/get');
/** @namespace */
const addlaundry = require('../cart/laundry/post');
const getlaundry = require('../cart/laundry/get');
const patchlaundry = require('../cart/laundry/patch');
const updatelaundry = require('../cart/laundry/update');
const removelaundry = require('../cart/laundry/delete');
const add = require('../../../commonModels/cart/post');
/** @namespace */
const addNew = require('../../../commonModels/cart/post/postNew');
/** @namespace */
const patch = require('../../../commonModels/cart/patch');
/** @namespace */
const remove = require('../../../commonModels/cart/delete');

/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi')

// const i18n = require("i18n");
/**
* A module that exports business API  routes to hapi server!
* @memberof CART-API-ROUTES 
*/
module.exports = [
    {
        method: 'POST',
        path: '/cart',
        config: {
            tags: ['api', 'cart'],
            description: 'Add items to cart list',
            notes: 'Add items to cart list.',
            auth: 'guestJWT',
            validate: {
                /** @memberof add */
                payload: {

                    childProductId: Joi.string().required().description('childProductId'),
                    unitId: Joi.string().required().description('unitId'),
                    quantity: Joi.number().required().description('float'),
                    addOns: Joi.array().items().allow('').description("add ons if added any."),
                    storeType: Joi.number().required().description("1 - Resturant, 2 - Grocery")

                },

                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError

            }
        },
        /** @memberof add */
        handler: add.handlerTest
    },
    {
        method: 'POST',
        path: '/cart/laundry',
        config: {
            tags: ['api', 'cart'],
            description: 'Add items to cart list',
            notes: 'Add items to cart list.',
            auth: {
                strategies: ['guestJWT', 'customerJWT']
            },

            validate: {
                /** @memberof add */
                payload: {
                    productId: Joi.string().required().description('productId'),
                    productName: Joi.string().required().description('productName'),
                    quantity: Joi.number().required().description('float'),
                    zoneId: Joi.string().required().description('zoneId'),
                    storeType: Joi.number().required().description("1 - Resturant, 2 - Grocery,..... 5-laundry")
                },
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            }
        },
        /** @memberof add */
        handler: addlaundry.handler
    },
    {
        method: 'PATCH',
        path: '/cart',
        config: {
            tags: ['api', 'cart'],
            description: 'Update cart API',
            notes: 'Modify the cart details.',
            auth: 'guestJWT',
            validate: {
                /** @memberof patch */
                payload: {
                    cartId: Joi.string().required().description('string'),
                    childProductId: Joi.string().required().description('string'),
                    unitId: Joi.string().required().description('string'),
                    quantity: Joi.number().required().description('string'),
                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    203: {
                        message: Joi.any().default(i18n.__('cart')['203'])
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        handler: patch.handler
    },
    {
        method: 'PATCH',
        path: '/cart/laundry',
        config: {
            tags: ['api', 'cart'],
            description: 'Update cart API',
            notes: 'Modify the cart details.',
            auth: 'guestJWT',
            validate: {
                /** @memberof patch */
                payload: {
                    cartId: Joi.string().required().description('string'),
                    productId: Joi.string().required().description('string'),
                    quantity: Joi.number().required().description('string'),
                    customOrderInfo: Joi.number().allow('').description('string'),
                    specialInfo: Joi.number().allow('').description('string'),
                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    203: {
                        message: Joi.any().default(i18n.__('cart')['203'])
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof patch */
        handler: patchlaundry.handler
    },
    {
        method: 'PATCH',
        path: '/cart/update/laundry',
        config: {
            tags: ['api', 'cart'],
            description: 'Update cart API',
            notes: 'Modify the cart details.',
            auth: {
                strategies: ['guestJWT', 'customerJWT']
            },
            validate: {
                /** @memberof patch */
                payload: {
                    cartId: Joi.string().required().description('string'),
                    customOrderInfo: Joi.array().items().required().allow('').description('Array of objects'),
                    specialInfo: Joi.string().required().allow('').description('string'),
                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    203: {
                        message: Joi.any().default(i18n.__('cart')['203'])
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof patch */
        handler: updatelaundry.handler
    },
    {
        method: 'PATCH',
        path: '/cartNewWithAddOns',
        config: {
            tags: ['api', 'cart'],
            description: 'Update cart API',
            notes: 'Modify the cart details.',
            auth: 'guestJWT',
            validate: {
                /** @memberof patch */
                payload: {
                    cartId: Joi.string().required().description('string'),
                    childProductId: Joi.string().required().description('string'),
                    unitId: Joi.string().required().description('string'),
                    quantity: Joi.number().required().description('string'),
                    storeType: Joi.number().required().description("Store Type . 1 - resturant, 2 - Store"),
                    packId: Joi.string().allow("").description("AddOn Pack id. If pack id is empty or 0 then the lastly added item will be added again else will add the item as per the pack id"),
                    increase: Joi.number().required().description("0 - decrease, 1 - increase")
                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    203: {
                        message: Joi.any().default(i18n.__('cart')['203']), data: Joi.any()
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof patch */
        handler: patch.handlerWithAddOns
    },
    {
        method: 'DELETE',
        path: '/cart/{cartId}/{childProductId}/{unitId}',
        config: {
            tags: ['api', 'cart'],
            description: 'Delete cart API',
            notes: 'Modify the cart details.',
            auth: 'guestJWT',
            validate: {
                /** @memberof remove */
                params: {
                    cartId: Joi.string().required().description('cart Id'),
                    childProductId: Joi.string().required().description('string'),
                    unitId: Joi.string().required().description('string')
                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    202: {
                        message: Joi.any().default(i18n.__('cart')['202'])
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof remove */
        handler: remove.handler
    },
    {
        method: 'DELETE',
        path: '/cart/laundry/{cartId}/{productId}',
        config: {
            tags: ['api', 'cart'],
            description: 'Delete cart API',
            notes: 'Modify the cart details.',
            auth: 'guestJWT',
            validate: {
                /** @memberof remove */
                params: {
                    cartId: Joi.string().required().description('cart Id'),
                    productId: Joi.string().required().description('string')
                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    202: {
                        message: Joi.any().default(i18n.__('cart')['202'])
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof remove */
        handler: removelaundry.handler
    },

    {
        method: 'DELETE',
        path: '/cart/{cartId}/{childProductId}/{unitId}/{packId}',
        config: {
            tags: ['api', 'cart'],
            description: 'Delete cart API',
            notes: 'This api is used to remove the item from the cart. If 0 received as pack id then it removes the lastly added item to the cart else it removes that particular pack',
            auth: 'guestJWT',
            validate: {
                /** @memberof remove */
                params: {
                    cartId: Joi.string().required().description('cart Id'),
                    childProductId: Joi.string().required().description('string'),
                    unitId: Joi.string().required().description('string'),
                    packId: Joi.string().required().description('0 If pack id is not present else pack id string')
                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    202: {
                        message: Joi.any().default(i18n.__('cart')['202'])
                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof remove */
        handler: remove.removeCartData
    },


    {
        method: 'GET',
        path: '/cart',
        config: {
            tags: ['api', 'cart'],
            description: 'Get Cart details API',
            notes: 'Get Cart product details API',
            auth: 'guestJWT',
            validate: {
                /** @memberof remove */
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('cart')['200']), data: Joi.any()
                    },
                    404: { message: Joi.any().default(i18n.__("cart")["404"]) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof get */
        handler: get.handler
    },
    {
        method: 'GET',
        path: '/cart/laundry',
        config: {
            tags: ['api', 'cart'],
            description: 'Get Cart details API',
            notes: 'Get Cart product details API',
            auth: 'guestJWT',
            validate: {
                /** @memberof remove */
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('cart')['200']), data: Joi.any()
                    },
                    404: { message: Joi.any().default(i18n.__('cart')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof get */
        handler: getlaundry.handler
    },
    {
        method: 'PATCH',
        path: '/cartAddOns',
        config: {
            tags: ['api', 'cart'],
            description: 'This api is used to updat the addOns in the cart',
            notes: 'It checkes if the unitId, childProductId exists with the same addOns then increases the quantity of the same and removes the old product else updates the itme addOns by the pack id given ',
            auth: 'guestJWT',
            validate: {
                /** @memberof patch */
                payload: {
                    cartId: Joi.string().required().description('string'),
                    childProductId: Joi.string().required().description('string'),
                    unitId: Joi.string().required().description('string'),
                    addOns: Joi.array().items().allow('').description("Array of addOns"),

                    storeType: Joi.number().required().description("1 - Resturant, 2 - Grocery"),
                    packId: Joi.string().required().description("String"),
                    customerId: Joi.string().allow("").description("Required while request from dispatcher")

                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    203: {
                        message: Joi.any().default(i18n.__('cart')['203'])

                    },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof patch */
        handler: patch.handlerUpdateAddOns
    },


]