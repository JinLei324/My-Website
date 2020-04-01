/** @global */
const headerValidator = require('../../../middleware/validator');
/** @namespace */
const get = require('../../../commonModels/cart/get');
/** @namespace */
const add = require('../../../commonModels/cart/post');
/** @namespace */
const addNew = require('../../../commonModels/cart/post/postNew');
/** @namespace */
const b2bCart = require('../../../commonModels/cart/post/b2bCart');
/** @namespace */
const patch = require('../../../commonModels/cart/patch');
/** @namespace */
const remove = require('../../../commonModels/cart/delete');
/** @namespace */
const i18n = require('../../../../locales/locales');
/** @global */
const Joi = require('joi')
/**
* A module that exports business API  routes to hapi server!
* @memberof CART-API-ROUTES 
*/
module.exports = [
    {
        method: 'PATCH',
        path: '/dispatcher/cart',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Update cart API',
            notes: 'Modify the cart details.',
            auth: 'managerJWT',
            validate: {
                /** @memberof patch */
                payload: {
                    customerId: Joi.string().required().min(24).max(24).description('address line 1'),
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
                // },
                // response: {
                //     status: {
                //         203: {
                //             message: Joi.any().default(i18n.__('cart')['203'])
                //         },
                //         500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                //     }
            }
        },
        /** @memberof patch */
        handler: patch.handlerWithAddOns
    },
    {
        method: 'PATCH',
        path: '/dispatcher/customOrder/cart',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Update cart API',
            notes: 'Modify the cart details.',
            auth: 'managerJWT',
            validate: {
                /** @memberof patch */
                payload: {
                    customerId: Joi.string().required().min(24).max(24).description('address line 1'),
                    cartId: Joi.string().required().description('string'),
                    // parentProductId: Joi.string().description('string'),
                    childProductId: Joi.string().required().description('string'),
                    unitId: Joi.string().required().description('string'),
                    // storeId: Joi.string().required().description('string'),
                    // storeName: Joi.string().description('string'),
                    // storeLogo: Joi.string().description('string'),
                    // sku: Joi.string().description('string'),
                    // itemName: Joi.string().required().description('string'),
                    // upc: Joi.string().description('string'),
                    // itemImageURL: Joi.string().description('string'),
                    quantity: Joi.number().required().description('string'),
                    unitPrice: Joi.number().description('string'),
                    // totalPrice: Joi.number().required().description('string')
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
        handler: patch.handlerCustomCart
    },
    {
        method: 'DELETE',
        path: '/dispatcher/cart/{customerId}/{cartId}/{childProductId}/{unitId}/{addedToCartOn}/{orderType}',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Delete cart API',
            notes: 'Modify the cart details.',
            auth: 'managerJWT',
            validate: {
                /** @memberof remove */
                params: {
                    customerId: Joi.string().required().min(24).max(24).description('address line 1'),
                    cartId: Joi.string().required().description('cart Id'),
                    childProductId: Joi.string().description('string').allow(""),
                    unitId: Joi.string().description('string').allow(""),
                    addedToCartOn: Joi.string().description('string').allow(""),
                    orderType: Joi.number().allow("").description('1 - Normal , 2 - Special'),
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
        method: 'GET',
        path: '/dispatcher/cart/{customerId}',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Get Cart details API',
            notes: 'Get Cart product details API',
            auth: 'managerJWT',
            validate: {
                /** @memberof remove */
                params: {
                    customerId: Joi.string().required().min(24).max(24).description('address line 1')
                },
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
        handler: get.handler
    },
    {
        method: 'POST',
        path: '/dispatcher/cartNew',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Add items to cart list',
            notes: 'Add items to cart list.',
            auth: 'managerJWT',
            validate: {
                /** @memberof add */
                payload: {
                    customerId: Joi.string().required().min(24).max(24).description('address line 1'),
                    childProductId: Joi.string().required().min(24).max(24).description('childProductId'),
                    unitId: Joi.string().required().min(24).max(24).description('unitId'),
                    quantity: Joi.number().required().description('float'),
                    addOns: Joi.array().items().allow('').description("add ons if added any.")
                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    201: {
                        message: Joi.any().default(i18n.__('cart')['201']), data: Joi.any()
                    },
                    412: { message: Joi.any().default(i18n.__('cart')['412']) },
                    404: { message: Joi.any().default(i18n.__('getData')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof add */
        handler: addNew.handlerNew
    },
    {
        method: 'POST',
        path: '/dispatcher/customOrder/cart',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Add items to cart list',
            notes: 'Add items to cart list.',
            // auth: 'managerJWT',
            auth: {
                strategies: ['managerJWT', 'customerJWT']
            },
            validate: {
                /** @memberof add */
                payload: {
                    customerId: Joi.string().required().min(24).max(24).description('address line 1'),
                    storeCategoryType: Joi.string().min(24).max(24).description('store category type').allow(""),
                    unitName: Joi.string().description('Item Size Details eg: small or large').allow(""),
                    // storeId: Joi.string().required().description('storeId (given in login api)'),
                    quantity: Joi.number().required().description('pass default value 1 for bulk orders'),
                    unitPrice: Joi.number().description('Bill amount').allow(''),
                    itemName: Joi.string().required().description('Item Details'),
                    billNumber: Joi.string().description('billNumber').allow(""),
                    totalItems: Joi.number().description('totalItems').allow(""),
                    storeType: Joi.number().required().description('storeType').allow(""),
                    storeTypeMsg: Joi.string().description('Store type message').allow(""),
                    orderType: Joi.number().min(2).max(3).required().description('2 - custom 3- bulk order'),
                    customerSignature: Joi.string().description('customerSignature yes or no').allow(""),
                    cashOnDelivery: Joi.string().description('cashOnDelivery yes or no').allow(""),
                    // packageType: Joi.any().allow("").description("Package type array . Format :  [{id: '5d4ea8290a1e5f57627a344c', name: 'x'}, id: '5d4ea8290a1e5f57627a344c', name: 'y'}]")
                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    201: {
                        message: Joi.any().default(i18n.__('cart')['201']), data: Joi.any()
                    },
                    412: { message: Joi.any().default(i18n.__('cart')['412']) },
                    404: { message: Joi.any().default(i18n.__('getData')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof add */
        handler: addNew.handlerCustomCart
    },
    {
        method: 'POST',
        path: '/dispatcher/b2b/customOrder/cart',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Add items to cart list',
            notes: 'Add items to cart list.',
            auth: 'managerJWT',
            validate: {
                /** @memberof add */
                payload: {
                    customerId: Joi.string().required().min(24).max(24).description('address line 1'),
                    //   customerName: Joi.string().description('customerName').allow(""),
                    unitName: Joi.string().allow("").description('Item Size Details eg: small or large'),
                    storeId: Joi.string().required().description('storeId (given in login api)'),
                    quantity: Joi.number().allow("").description('pass default value 1 for bulk orders'),
                    unitPrice: Joi.number().allow("").description('Bill amount'),
                    itemName: Joi.string().allow("").description('Item Details'),
                    billNumber: Joi.string().description('billNumber').allow(""),
                    totalItems: Joi.number().description('totalItems').allow(""),
                    orderType: Joi.number().min(2).max(3).allow("").description('2 - custome 3- bulk order'),
                    customerSignature: Joi.string().description('customerSignature yes or no').allow(""),
                    cashOnDelivery: Joi.string().description('cashOnDelivery yes or no').allow(""),
                    boxQuantity: Joi.number().description("No of boxes in int"),
                    itemType: Joi.number().required().description("Item type is required. 1 = Grocery, 2 = Nongrocery "),
                    // storageType: Joi.number().allow("").description("Storage type is required . 1 = Frozen, 2 = Refrigirated, 3 = Fresh"),
                    // nonGroceryTypeId: Joi.string().allow("").description("Non mandatory field . Non grocery type id if any ."),
                    // nonGroceryTypeName: Joi.string().allow("").description("Non mandatory field . Non grocery type id if any .")
                    itemTypeId: Joi.string().allow("").description("Mandatory field. Item  type id recieved from the order type api. "),
                    itemTypeName: Joi.string().allow("").description("Mandatory field. Item type name as a string"),
                    storeReceiptId: Joi.string().allow("").description("Non mandatory field. Recepit id from the store"),
                    dispatcherUserType: Joi.number().description("Dispatcher user types . 0 - Central user , 1- store manager , 2 - packer , 3 - Franchise manager"),
                    pointOfSale: Joi.number().allow("").optional().description("Pint of sale. 1-Internet, 2- Supermarket"),
                    latitude: Joi.number().allow("").description('Latitude'),
                    longitude: Joi.number().allow("").description('Longitude'),
                    bookingDate: Joi.string().allow("").description("Order dateTime is required"),
                    dueDatetime: Joi.string().allow("").description("Schedule datetime or Due dateTime is required"),
                    serviceType: Joi.number().allow("").integer().min(1).max(2).description('1 for delivery ,2 for pickup'),
                    bookingType: Joi.number().allow("").integer().min(1).max(2).description('2 -schedule booking  or later booking , 1 for now booking'),
                    storeType: Joi.string().allow("").description('  storeType 0 for food, 1 for grocery ,2  for dailyneeds ,3 for online').allow(""),
                    storeTypeMsg: Joi.string().allow("").description('storeTypeMsg food or grocery etc').allow(""),
                    serviceDayType: Joi.number().allow("").description('Service day type . 1- Bank holiday , 2 - Normal day '),
                    slotId: Joi.string().allow("").description("Non mandatory field. Selected slot id"),
                    bookingType: Joi.number().description("1 - Now booking, 2- schedule booking or later booking")

                },
                /** @memberof headerValidator */
                headers: headerValidator.headerAuthValidator,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    201: {
                        message: Joi.any().default(i18n.__('cart')['201']), data: Joi.any()
                    },
                    412: { message: Joi.any().default(i18n.__('cart')['412']) },
                    404: { message: Joi.any().default(i18n.__('getData')['404']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof add */
        handler: b2bCart.handlerCustomCart
    },
    {
        method: 'POST',
        path: '/dispatcher/cart/clear',
        config: {
            tags: ['api', 'dispatcher'],
            description: 'Add items to cart list',
            notes: 'Add items to cart list.',
            // auth: 'customerJWT',
            auth: {
                strategies: ['managerJWT', 'customerJWT', 'guestJWT']
            },
            validate: {
                /** @memberof add */
                payload: {
                    customerId: Joi.string().required().min(24).max(24).description('customerId'),
                    cartId: Joi.string().required().description('cartId'),
                },
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
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof add */
        handler: addNew.handlerClearCart
    },


]