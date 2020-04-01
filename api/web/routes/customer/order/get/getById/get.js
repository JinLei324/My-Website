const newOrders = require("../../../../../../models/order");
const unassignOrders = require("../../../../../../models/unassignOrders");
const assignOrders = require("../../../../../../models/assignOrders");
const completedOrders = require("../../../../../../models/completedOrders");
const pickupOrders = require("../../../../../../models/pickupOrders");
const mobileDevices = require("../../../../../../models/mobileDevices");
const Auth = require("../../../../../middleware/authentication");
const error = require("../../../../../../statusMessages/responseMessage"); // response messages based on language
const status = require("../../../../../../statusMessages/statusMessages");
const moment = require("moment"); //date-time
const config = process.env;
var Joi = require("joi");
const logger = require("winston");
/**
 * @function
 * @name handler
 * @param {string} status -  0 - Active , 1 - Banned , 2 - Unverfied.
 * @return {object} Reply to the user.
 */

const handler = (req, reply) => {
  // req.headers.language = 'en';
  let orderDetails = {};
  const readNewOrder = newOrder => {
    return new Promise((resolve, reject) => {
      newOrders.isExistsWithCustomerId(
        { customerId: req.auth.credentials._id.toString(), orderId: req.params.orderId },
        (err, res) => {
          orderDetails = res ? res : orderDetails;
          return err ? reject(err) : resolve(orderDetails);
        }
      );
    });
  };
  const readPickedupOrder = newOrder => {
    return new Promise((resolve, reject) => {
      pickupOrders.isExistsWithCustomerId(
        { customerId: req.auth.credentials._id.toString(), orderId: req.params.orderId },
        (err, res) => {
          orderDetails = res ? res : orderDetails;
          return err ? reject(err) : resolve(orderDetails);
        }
      );
    });
  };
  const readUnassignOrder = newOrder => {
    return new Promise((resolve, reject) => {
      unassignOrders.isExistsWithCustomerId(
        { customerId: req.auth.credentials._id.toString(), orderId: req.params.orderId },
        (err, res) => {
          orderDetails = res ? res : orderDetails;
          return err ? reject(err) : resolve(orderDetails);
        }
      );
    });
  };
  const readAssignOrder = newOrder => {
    return new Promise((resolve, reject) => {
      assignOrders.isExistsWithCustomerId(
        { customerId: req.auth.credentials._id.toString(), orderId: req.params.orderId },
        (err, res) => {
          orderDetails = res ? res : orderDetails;
          return err ? reject(err) : resolve(orderDetails);
        }
      );
    });
  };
  const readCompletedOrder = newOrder => {
    return new Promise((resolve, reject) => {
      completedOrders.isExistsWithCustomerId(
        { customerId: req.auth.credentials._id.toString(), orderId: req.params.orderId },
        (err, res) => {
          orderDetails = res ? res : orderDetails;
          return err ? reject(err) : resolve(orderDetails);
        }
      );
    });
  };
  readNewOrder()
    .then(readUnassignOrder)
    .then(readAssignOrder)
    .then(readCompletedOrder)
    .then(readPickedupOrder)
    .then(data => {
      if (Object.keys(data).length > 0) {
        let booking = {
          orderId: data.orderId,
          bookingType: data.bookingType,
          providerType: data.providerType,
          dueDatetime: data.dueDatetimeTimeStamp,
          // bookingDate:  data.bookingDate,
          bookingDate: data.timeStamp.created ? data.timeStamp.created.timeStamp : "",
          paymentType: data.paymentType,
          payByWallet: data.payByWallet,
          paymentTypeMsg: data.paymentTypeMsg,
          estimatedPackageValue: data.estimatedPackageValue || 0,
          pickupLong: data.pickup ? data.pickup.location.longitude : 0,
          pickupLat: data.pickup ? data.pickup.location.latitude : 0,
          dropLat: data.drop ? data.drop.location.latitude : 0,
          dropLong: data.drop ? data.drop.location.longitude : 0,
          pickAddress: data.pickup ? data.pickup.addressLine1 + " " + data.pickup.addressLine2 : "",
          dropAddress: (data.drop.flatNumber != "" ? data.drop.flatNumber + "," : "") + (data.drop.landmark != "" ? data.drop.landmark + "," : "") + (data.drop.addressLine1 != "" ? data.drop.addressLine1 + "," : "") + (data.drop.addressLine2 != "" ? data.drop.addressLine2 + "," : "") + (data.drop.city != "" ? data.drop.city + "," : "") + (data.drop.state != "" ? data.drop.state : "") + (data.drop.postalCode != "" ? "-" + data.drop.postalCode : ""),
          statusMessage: data.statusMsg,
          // statusMessage: status.bookingStatus(data.status, data.isCominigFromStore, data.storeType),
          storeType: data.storeType,
          statusCode: data.status,
          storeName: data.storeName,
          storeAddress: data.storeAddress,
          storeLogo: data.Items ? data.Items[0].storeLogo : "",
          totalAmount: data.totalAmount,
          deliveryCharge: data.deliveryCharge,
          items: data.Items,
          driverId: data.driverDetails ? data.driverDetails.driverId : "",
          driverName: data.driverDetails
            ? data.driverDetails.lName
              ? data.driverDetails.fName + data.driverDetails.lName
              : data.driverDetails.fName
            : "",
          driverMobile: data.driverDetails ? data.driverDetails.countryCode + data.driverDetails.mobile : "",
          driverImage: data.driverDetails ? data.driverDetails.image : "",
          driverEmail: data.driverDetails ? data.driverDetails.email : "",
          exclusiveTaxes: data.exclusiveTaxes,
          subTotalAmount: data.subTotalAmount,
          deliveryCharge: data.deliveryCharge,
          discount: data.discount,
          subTotalAmountWithExcTax: data.subTotalAmountWithExcTax ? data.subTotalAmountWithExcTax : 0,
          reviewed: data.reviewed ? data.reviewed : false
        };
        // return reply({
        //     message: error['getProfile']['200'][req.headers.language], data: booking
        // }).code(200);
        return reply({ message: req.i18n.__("getProfile")["200"], data: booking }).code(200);
      }
      // return reply({
      //     message: error['getProfile']['404'][req.headers.language]
      // }).code(404)
      return reply({ message: req.i18n.__("getProfile")["404"] }).code(404);
    })
    .catch(e => {
      logger.error("Error occurred place order (catch): " + JSON.stringify(e));
      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
      return reply({ message: req.i18n.__("genericErrMsg")["500"] }).code(500);
    });
};
/**
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
  orderId: Joi.number()
    .required()
    .description("order Id")
};
/**
 * A module that exports guest logins handler, validator!
 * @exports validator
 * @exports handler
 */
module.exports = { handler, validator };
