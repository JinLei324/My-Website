/** @global */
const headerValidator = require("../../../../middleware/validator");
/** @namespace */
const postOrder = require("../../../../commonModels/orders/postNew");
/** @namespace */
const i18n = require("../../../../../locales/locales");
/** @global */
// const Joi = require('joi');

const BaseJoi = require("joi");
const Extension = require("joi-date-extensions");
const Joi = BaseJoi.extend(Extension);
/**
 * A module that exports business API  routes to hapi server!
 * @exports BUSINESS-ORDER-API-ROUTES
 */
module.exports = [
  // {
  //     method: 'POST',
  //     path: '/order',
  //     config: {
  //         tags: ['api', 'order'],
  //         description: 'Api to place order',
  //         notes: 'Api to place order',
  //         auth: 'customerJWT',
  //         validate: {
  //             /** @memberof postOrder */
  //             payload: {
  //                 address1: Joi.string().description('string').error(new Error('address Line1 missing')).allow(""),
  //                 address2: Joi.string().description('string').error(new Error('address Line2 missing')).allow(""),
  //                 paymentType: Joi.number().min(1).max(3).required().description('1-card, 2 cash 3 -wallet 4-'),
  //                 cart: Joi.array().items().min(1).required().description('array').error(new Error('cart is missing')),
  //                 couponCode: Joi.string().description('coupon code').allow(""),
  //                 discount: Joi.number().required().description('discount').error(new Error('discount missing')),
  //                 currency: Joi.string().required().description('currency eg: "INR"'),
  //                 currencySymbol: Joi.string().required().description('currency Symbol eg: "$"'),
  //                 mileageMetric: Joi.string().required().description('mileageMetric 0-km 1-miles').error(new Error('mileageMetric missing')),
  //                 cartId: Joi.string().required().description('cart Id').error(new Error('cart id missing')),
  //                 cityId: Joi.string().description('city Id').error(new Error('city id missing')).allow(""),
  //                 city: Joi.string().description('city Name').error(new Error('city name missing')).allow(""),
  //                 deviceId: Joi.string().required().description('device id'),
  //                 appVersion: Joi.string().required().description('app version'),
  //                 deviceMake: Joi.string().required().description('Device Make'),
  //                 deviceModel: Joi.string().required().description('Device model'),
  //                 deviceType: Joi.number().required().integer().min(1).max(2).description('1- IOS , 2- Android, 3- Web'),
  //                 latitude: Joi.number().required().description("Customer Latitude is required").default(13.0195677),
  //                 longitude: Joi.number().required().description("Customer Longitude is required").default(77.5968131),
  //                 bookingDate: Joi.string().required().description("Order dateTime is required"),
  //                 dueDatetime: Joi.string().required().description("Due dateTime is required").default("2017-07-17 02:30:33"),
  //                 serviceType: Joi.number().integer().min(1).max(2).required().description('1 for delivery ,2 for pickup'),
  //                 bookingType: Joi.number().integer().min(1).max(2).required().description('1 for now booking, 2 for later booking'),
  //                 zoneType: Joi.number().integer().min(1).max(2).description('1 for short zone ride booking, 2 for long zone'),
  //                 extraNote: Joi.string().description('extra note').allow(""),
  //                 transaction:  Joi.object().keys().description('transaction'),
  //                 ipAddress: Joi.string().description('Ip Address')
  //             },
  //             /** @memberof headerValidator */
  //             headers: headerValidator.headerAuthValidator,
  //             /** @memberof headerValidator */
  //             failAction: headerValidator.customError
  //         },
  //         response: {
  //             status: {
  //                 200: {
  //                     message: error['orders']['200']
  //                 },
  //                 404: { message: error['slaveSignIn']['404'] },
  //                 401: { message: Joi.any().default(i18n.__('genericErrMsg']['401']) },
  //                 402: { message: error['verifyId']['402'] },
  //                 500: { message: Joi.any().default(i18n.__('genericErrMsg')['500']) }
  //             }
  //         }
  //     },
  //     /** @memberof postOrder */
  //     handler: postOrder.handler
  // },
  {
    method: "POST",
    path: "/customer/order",
    config: {
      tags: ["api", "order"],
      description: "Api to place an order",
      notes: "Api to place an order",
      auth: "customerJWT",
      validate: {
        /** @memberof postOrder */
        payload: {
          addressId: Joi.any().description('addressId').error(new Error('address Id missing')).allow("").default(""),
          address1: Joi.string().description('string').error(new Error('address Line1 missing')).allow(""),
          address2: Joi.string().description('string').error(new Error('address Line2 missing')).allow(""),
          paymentType: Joi.number().min(0).max(23).required().description("1-card, 2 cash 3 -wallet 4-ideal  13- card+wallet 12-card+cash 23-cash+wallet"),
          couponCode: Joi.string().description('coupon code').allow(""),
          payByWallet: Joi.any().allow([0, 1]).default(0).description("1-Use Wallet, 0- dont use wallet"),
          cardId: Joi.string().description("incase of card transaction").allow(""),
          discount: Joi.number().required().description('discount').error(new Error('discount missing')),
          cartId: Joi.string().required().description('cart Id').error(new Error('cart id missing')),
          cityId: Joi.string().description('city Id').error(new Error('city id missing')).allow(""),
          latitude: Joi.number().required().description("Customer Latitude is required").default(13.0195677),
          longitude: Joi.number().required().description("Customer Longitude is required").default(77.5968131),
          bookingDate: Joi.date().required().format("YYYY-MM-DD HH:mm:ss").options({ convert: true }).description("Order dateTime date YYYY-mm-dd HH:ii:ss").error(new Error("bookingDate is missing")),
          dueDatetime: Joi.date().required().format("YYYY-MM-DD HH:mm:ss").options({ convert: true }).description("dueDatetime date YYYY-mm-dd HH:ii:ss").error(new Error("dueDatetime is missing")),
          serviceType: Joi.number().integer().min(1).max(2).required().description('1 for delivery ,2 for pickup'),
          bookingType: Joi.number().integer().min(1).max(2).required().description('2 -schedule booking  or later booking , 1 for now booking'),
          zoneType: Joi.number().integer().min(1).max(2).description('1 for short zone ride booking, 2 for long zone'),
          extraNote: Joi.object().keys().description("extraNote"),
          transaction: Joi.object().keys().description('transaction'),
          ipAddress: Joi.string().description('Ip Address'),
          storeType: Joi.number().description('  storeType 0 for food, 1 for grocery ,2  for dailyneeds ,3 for online').allow(""),
          storeTypeMsg: Joi.string().description('storeTypeMsg food or grocery etc').allow(""),
          deviceTime: Joi.date().required().format("YYYY-MM-DD HH:mm:ss").options({ convert: true }).description("deviceTime date YYYY-mm-dd HH:ii:ss").error(new Error("deviceTime is missing")),
          pickUpLat: Joi.number().allow("").description("Pick up lat"),
          pickUpLong: Joi.number().allow("").description("Pick up long"),
          pickUpPhoneNumber: Joi.number().allow("").description("Pick Up Phone Number"),
          estimatedPackageValue: Joi.number().allow("").description("Estimated package value"),

        },
        /** @memberof headerValidator */
        headers: headerValidator.headerAuthValidator,
        /** @memberof headerValidator */
        failAction: headerValidator.customError
      },
      response: {
        status: {
          200: {
            message: Joi.any().default(i18n.__("orders")["200"]),
            data: Joi.any()
          },
          404: { message: Joi.any().default(i18n.__("slaveSignIn")["404"]) },
          401: { message: Joi.any().default(i18n.__("genericErrMsg")["401"]) },
          402: { message: Joi.any().default(i18n.__("verifyId")["402"]) },
          500: { message: Joi.any().default(i18n.__("genericErrMsg")["500"]) }
        }
      }
    },
    /** @memberof postOrder */
    handler: postOrder.handlerNew
  }
];
