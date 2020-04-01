/** @global */
const headerValidator = require('../../../../middleware/validator');
/** @namespace */
const postOrder = require('../../../../commonModels/orders/post');
/** @namespace */
const i18n = require('../../../../../locales/locales');


/** @global */
const Joi = require('joi');
/**
* A module that exports business API  routes to hapi server!
* @exports BUSINESS-ORDER-API-ROUTES 
*/
module.exports = [
    {
        method: 'POST',
        path: '/pos/order',
        config: {
            tags: ['api', 'pos'],
            description: 'Api to place order from pos',
            notes: 'Api to place order from pos',
            auth: false,
            validate: {
                /** @memberof postOrder */
                payload: {
                    orderIdPOS: Joi.string().required().description('orderIdPOS'),
                    customerPOSId: Joi.number().required().description('customerIdPOS userid'),
                    customerQuickcardId: Joi.string().description('Incase QuickCard is used ').allow(""),
                    address1: Joi.string().required().description('eg: 3225 N Harbor Dr,').error(new Error('customer address Line1 missing')),
                    address2: Joi.string().required().description('eg:San Diego, CA 92101, USA').error(new Error('customer address Line2 missing')),
                    paymentType: Joi.number().min(1).max(7).required().description('1-card, 2 cash, 5 - Gift Card, 6 - Credit Card, 7 -Cheque'),
                    cart: Joi.array().items().required().description('array structure should be in this format : ').not("[]").error(new Error('cart is missing')).default(JSON.stringify([{ "products": [{ "unitId": "12", "unitName": "small", "childProductId": "32", "itemImageURL": "https://static.eazeup.com/images/public/f87eb536-eeac-4ad3-8c5a-e9f9d98ff20d_Neutron_Genetics_Mars_OG_Menu_preview.jpeg", "itemName": "Sour Diesel", "quantity": 1, "unitPrice": 750 }], "storeId": "5a1974a0e0dc3f28f46dd4df" }])),
                    discount: Joi.number().required().description('discount if not avaaiilable send 0').error(new Error('discount missing')),
                    currency: Joi.string().required().description('currency eg: "USD"'),
                    currencySymbol: Joi.string().required().description('currency Symbol eg: "$"'),
                    mileageMetric: Joi.string().required().description('mileageMetric 0-km 1-miles').error(new Error('mileageMetric missing')),
                    city: Joi.string().description('city Name').error(new Error('city name missing')).allow(""),
                    deviceId: Joi.string().required().description('device id if not available send 100'),
                    appVersion: Joi.string().required().description('app version if not available send 1.0'),
                    deviceMake: Joi.string().required().description('Device Make if not available send POS'),
                    deviceModel: Joi.string().required().description('Device model if not available send POS'),
                    deviceType: Joi.number().required().integer().min(1).max(4).description('1- IOS , 2- Android, 3- Web 4- pos'),
                    latitude: Joi.number().required().description("Customer Latitude is required").default(13.0195677),
                    longitude: Joi.number().required().description("Customer Longitude is required").default(77.5968131),
                    bookingDate: Joi.string().required().description("Order dateTime is required"),
                    dueDatetime: Joi.string().required().description("Due dateTime is required").default("2017-07-17 02:30:33"),
                    serviceType: Joi.number().integer().min(1).max(2).required().description('1 for pickup ,2 for delivery 3 -both'),
                    bookingType: Joi.number().integer().min(1).max(2).required().description('1 for now booking, 2 for later booking'),
                    zoneType: Joi.number().integer().min(1).max(2).description('1 for short zone ride booking, 2 for long zone'),
                    extraNote: Joi.string().description('extra note').allow(""),
                    ipAddress: Joi.string().description('Ip Address')
                },
                headers: headerValidator.language,
                /** @memberof headerValidator */
                failAction: headerValidator.customError
            },
            response: {
                status: {
                    200: {
                        message: Joi.any().default(i18n.__('orders')['200']), data: Joi.any()
                    },
                    400: { message: Joi.any().default("StoreId must be an mongoId") },
                    404: { message: Joi.any().default(i18n.__('slaveSignIn')['404']) },
                    401: { message: Joi.any().default(i18n.__('verifyId')['401']) },
                    402: { message: Joi.any().default(i18n.__('verifyId')['402']) },
                    500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
                }
            }
        },
        /** @memberof postOrder */
        handler: postOrder.handler
    }
];