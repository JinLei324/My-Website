const assignOrders = require("../../../models/assignOrders");
const customer = require("../../../models/customer");
const stores = require("../../../models/stores");
const newOrders = require("../../../models/order");
const unassignOrders = require("../../../models/unassignOrders");
const pickupOrders = require("../../../models/pickupOrders");
const completedOrders = require("../../../models/completedOrders");
const storeManagers = require("../../../models/storeManagers");
const Auth = require("../../middleware/authentication");
const error = require("../../../statusMessages/responseMessage"); // response messages based on language
const status = require("../../../statusMessages/statusMessages");
const config = process.env;
let Joi = require("joi");
const ObjectId = require("mongodb").ObjectID;
const logger = require("winston");
const moment = require("moment-timezone");
const client = require("../../../library/redis");
const notifications = require("../../../library/fcm");
const notifyi = require("../../../library/mqttModule");
const webSocket = require("../../../library/websocket/websocket");
const managerTopics = require("../managerTopics");
const superagent = require("superagent");
const wallet = require("../../../worker/wallet/wallet");
const stripeTransaction = require("../../../web/commonModels/stripe/stripeTransaction");
const async = require("async");
var accounting = require("../../commonModels/accounting/accounting");
const walletEntryModel = require("../../commonModels/wallet/wallet");
const campaignAndreferral = require("../../routes/campaignAndreferral/promoCode/post");
const email = require("../email/email");
/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */
const handler = (req, reply) => {
  let orderDetails = {};
  let storeData = {};
  let customerData = {};
  var modelName = "";
  let fromName = "";
  const readNewOrder = newOrder => {
    return new Promise((resolve, reject) => {
      newOrders.isExistsWithOrderId(
        { orderId: req.payload.orderId },
        (err, res) => {
          orderDetails = res ? res : orderDetails;
          modelName = res ? newOrders : modelName;
          return err
            ? reject({ message: err, code: 500 })
            : resolve(orderDetails);
        }
      );
    });
  };
  const readPickedupOrder = newOrder => {
    return new Promise((resolve, reject) => {
      pickupOrders.isExistsWithOrderId(
        { orderId: req.payload.orderId },
        (err, res) => {
          orderDetails = res ? res : orderDetails;
          modelName = res ? pickupOrders : modelName;
          return err
            ? reject({ message: err, code: 500 })
            : resolve(orderDetails);
        }
      );
    });
  };
  const readUnassignOrder = newOrder => {
    return new Promise((resolve, reject) => {
      unassignOrders.isExistsWithOrderId(
        { orderId: req.payload.orderId },
        (err, res) => {
          orderDetails = res ? res : orderDetails;
          modelName = res ? unassignOrders : modelName;
          return err
            ? reject({ message: err, code: 500 })
            : resolve(orderDetails);
        }
      );
    });
  };
  const readAssignOrder = newOrder => {
    return new Promise((resolve, reject) => {
      assignOrders.isExistsWithOrderId(
        { orderId: req.payload.orderId },
        (err, res) => {
          orderDetails = res ? res : orderDetails;
          modelName = res ? assignOrders : modelName;
          return err
            ? reject({ message: err, code: 500 })
            : resolve(orderDetails);
        }
      );
    });
  };
  const readStore = orderDetails => {

    if (orderDetails.storeId == 0 || orderDetails.storeId == "0") {
      orderDetails.storeId = ""

    } else {
      orderDetails.storeId = new ObjectId(orderDetails.storeId)
    }
    return new Promise((resolve, reject) => {
      stores.isExistsWithId(
        { _id: orderDetails.storeId },
        (err, res) => {
          storeData = res ? res : {};
          return err
            ? reject({ message: err, code: 500 })
            : resolve(orderDetails);
        }
      );
    });
  };

  const readCustomer = orderDetails => {
    return new Promise((resolve, reject) => {
      customer.isExistsWithCond(
        { _id: new ObjectId(orderDetails.customerDetails.customerId) },
        (err, custData) => {
          if (err) {
            logger.error(
              "Error occurred appConfig (get): " + JSON.stringify(err)
            );
          }
          customerData = custData;
          return resolve(orderDetails);
        }
      );
    });
  };

  const paymentRefund = orderDetails => {
    return new Promise((resolve, reject) => {
      if (orderDetails.stripeCharge && orderDetails.paymentType == 1 && orderDetails.paidBy.card > 0) {
        //synchronous stripe code
        stripeTransaction
          .refundCharge(
            orderDetails.stripeCharge.id,
            orderDetails.paidBy.card,
            req
          )
          .then(data => {
            req.payload.refundCharge = data;
            return resolve(orderDetails);
          })
          .catch(e => {
            logger.warn("error while refund" + e);
            return reject({ code: 400, message: e });
            // return resolve(orderDetails);
          });
      } else if (orderDetails.payByWallet == 1) {
        // release blocked wallet
        customer.releaseBlockWalletBalance(
          {
            userId: orderDetails.customerDetails.customerId,
            createdBy: req.auth.credentials.sub,
            amount: orderDetails.paidBy.wallet
          },
          (err, data) => {
            if (err) {
              return reject({ code: 400, message: err });
            } else {
              return resolve(orderDetails);
            }
          }
        );
      } else {
        return resolve(orderDetails);
      }
    });
  };
  const deductCancellationFee = orderDetails => {
    return new Promise((resolve, reject) => {
      if (Object.keys(orderDetails).length > 0) {
        switch (req.auth.credentials.sub) {
          case "customer":
            req.payload.status = 16; // cancel
            fromName = orderDetails.customerDetails
              ? orderDetails.customerDetails.name
              : "customer";
            break;
          case "driver":
            req.payload.status = 17; // cancel
            fromName = orderDetails.driverDetails
              ? orderDetails.driverDetails.fName
              : "driver";
            break;
          case "manager":
            req.payload.status = 2; // cancel
            fromName = orderDetails.storeName
              ? orderDetails.storeName
              : "manager";
            break;
          case "dispatcher":
            req.payload.status = 2; // cancel
            fromName = orderDetails.storeName
              ? orderDetails.storeName
              : "manager";
            break;
        }
        req.payload.createdBy = req.auth.credentials.sub;
        req.payload.userId = req.auth.credentials._id.toString();
        req.payload.driverCommPer = orderDetails.accouting.driverCommPer ? orderDetails.accouting.driverCommPer : 10;
        req.payload.storeCommPer = orderDetails.storeCommission;


        if (req.payload.status == 16) {
          let fullChargeCustomerArray = [5, 6, 12, 13, 14];

          let CancellationFeeCustomerArray = [1, 4, 8, 10, 40, 21];

          let deliveryFeeCustomerArray = [11];

          var indFullCharge = fullChargeCustomerArray.indexOf(parseInt(orderDetails.status));
          var indCancellationCharge = CancellationFeeCustomerArray.indexOf(parseInt(orderDetails.status));
          var indDeliveryCharge = deliveryFeeCustomerArray.indexOf(parseInt(orderDetails.status));
          if (indFullCharge >= 0) {
            req.payload.cancFee = orderDetails.totalAmount;
            req.payload.cancCartTotal = parseFloat(orderDetails.cartTotal);
            req.payload.cancDeliveryFee = orderDetails.storeFreeDelivery ? orderDetails.storeDeliveryFee : orderDetails.deliveryCharge;
          }
          if (indCancellationCharge >= 0) {
            if (orderDetails.bookingType == 1) {
              // 1 - now booking 2- later or scheduled
              // if (
              //   (parseInt(moment().valueOf()) - orderDetails.orderId) / 1000 <
              //   storeData.onDemandBookingsCancellationFeeAfterMinutes * 60
              // ) {
              //   req.payload.cancFee = 0;
              // } else {
              req.payload.cancFee = storeData.onDemandBookingsCancellationFee
                ? storeData.onDemandBookingsCancellationFee
                : 0;
              // }
            } else {
              // if (
              //   (parseInt(moment().valueOf()) - orderDetails.orderId) / 1000 <
              //   storeData.scheduledBookingsCancellationFeeAfterMinutes * 60
              // ) {
              //   req.payload.cancFee = 0;
              // } else {
              req.payload.cancFee = storeData.scheduledBookingsCancellationFee
                ? storeData.scheduledBookingsCancellationFee
                : 0;
              // }
            }
            req.payload.cancCartTotal = parseFloat(0);
            req.payload.taxes = parseFloat(0);
            req.payload.cancDeliveryFee = parseFloat(req.payload.cancFee);

            req.payload.storeCommPer = 100;
            req.payload.driverCommPer = 100;
          }
          if (indDeliveryCharge >= 0) {
            req.payload.cancFee = orderDetails.storeFreeDelivery ? orderDetails.storeDeliveryFee : orderDetails.deliveryCharge;
            req.payload.cancCartTotal = parseFloat(0);
            req.payload.taxes = parseFloat(0);
            req.payload.cancDeliveryFee = parseFloat(req.payload.cancFee);
            req.payload.storeCommPer = 100;
          }
        }
        if (req.payload.status == 17) {
          req.payload.cancFee = 0;
          req.payload.cancCartTotal = parseFloat(0);
          req.payload.taxes = parseFloat(0);
          req.payload.cancDeliveryFee = parseFloat(0);
        }
        if (req.payload.status == 2) {
          req.payload.cancFee = 0;
          req.payload.cancCartTotal = parseFloat(0);
          req.payload.taxes = parseFloat(0);
          req.payload.cancDeliveryFee = parseFloat(0);
        }

        let currentBal = customerData.wallet ? customerData.wallet.balance : 0;
        let walletCharge = 0;
        let cardCharge = 0;
        //charge Cancellation fee
        if (req.payload.cancFee > 0) {
          let totalAmountToCharge = req.payload.cancFee;
          if (orderDetails.payByWallet == 1) {
            // wallet
            walletCharge = totalAmountToCharge;
            if (currentBal < walletCharge) {
              walletCharge = currentBal;
            }
            totalAmountToCharge = totalAmountToCharge - walletCharge;
          }

          if (orderDetails.paymentType == 1 && totalAmountToCharge > 0 && orderDetails.stripeCharge) {
            cardCharge = totalAmountToCharge;

            stripeTransaction
              .createAndCaptureCharge(
                req,
                orderDetails.customerDetails.customerId,
                orderDetails.stripeCharge.source.id,
                cardCharge,
                orderDetails.currency ? orderDetails.currency : "",
                "Cancellation fee for customer cancel order",
                {
                  customerId: orderDetails.customerDetails
                    ? orderDetails.customerDetails.customerId.toString()
                    : "",
                  bookingId: orderDetails.orderId,
                  customerName: orderDetails.customerDetails
                    ? orderDetails.customerDetails.name
                    : "",
                  customerPhone: orderDetails.customerDetails
                    ? orderDetails.customerDetails.mobile
                    : ""
                }
              )
              .then(data => {
                orderDetails.cardCharge = cardCharge;
                return resolve(orderDetails);
              })
              .catch(e => {
                // totalAmountToCharge = totalAmountToCharge - cardCharge;
                walletCharge += cardCharge;

                if (totalAmountToCharge > 0 || walletCharge > 0) {
                  walletCharge += totalAmountToCharge;
                  //charge From wallet
                  let walletData = {
                    userId: orderDetails.customerDetails.customerId,
                    trigger: "Debit",
                    comment: "Cancellation Fee " + req.payload.cancFee,
                    currency: orderDetails.currency,
                    currencyAbbr: 1,
                    currencySymbol: orderDetails.currencySymbol,
                    txnType: 2,
                    wallet: false,
                    amount: walletCharge,
                    tripId: 0,
                    serviceTypeText: orderDetails.serviceTypeText || "",
                    bookingTypeText: orderDetails.bookingTypeText || "",
                    paymentTypeText: orderDetails.paymentTypeText || "",
                    cityName: orderDetails.cityName || "",
                    cityId: orderDetails.cityId
                      ? orderDetails.cityId.toString()
                      : "",
                    userType: 1,
                    initiatedBy: "Customer",
                    calculateClosingBalance: 1
                  };

                  // wallet.walletTransction(walletData, (err, res) => {
                  // orderDetails.walletCharge = walletCharge;
                  return resolve(orderDetails);
                  // });
                }
              });
          } else {
            cardCharge = totalAmountToCharge;

            totalAmountToCharge = totalAmountToCharge - cardCharge;
            walletCharge += cardCharge;

            if (totalAmountToCharge > 0 || walletCharge > 0) {
              walletCharge += totalAmountToCharge;
              //charge From wallet
              let walletData = {
                userId: orderDetails.customerDetails.customerId,
                trigger: "Debit",
                comment: "Cancellation Fee " + req.payload.cancFee,
                currency: orderDetails.currency,
                currencyAbbr: 1,
                currencySymbol: orderDetails.currencySymbol,
                txnType: 2,
                wallet: false,
                amount: walletCharge,
                tripId: 0,
                serviceTypeText: orderDetails.serviceTypeText || "",
                bookingTypeText: orderDetails.bookingTypeText || "",
                paymentTypeText: orderDetails.paymentTypeText || "",
                cityName: orderDetails.cityName || "",
                cityId: orderDetails.cityId
                  ? orderDetails.cityId.toString()
                  : "",
                userType: 1,
                initiatedBy: "Customer",
                calculateClosingBalance: 1
              };

              // wallet.walletTransction(walletData, (err, res) => {
              //   orderDetails.walletCharge = walletCharge;
              return resolve(orderDetails);
              // });
            }
          }
        } else {
          return resolve(orderDetails);
        }
      } else {
        logger.warn("bookng nt found");
        return reject({ code: 403, message: req.i18n.__("bookings")["403"] });
      }
    });
  };

  readNewOrder()
    .then(readUnassignOrder)
    .then(readAssignOrder)
    .then(readPickedupOrder)
    .then(readStore)
    .then(paymentRefund)
    .then(readCustomer)
    .then(deductCancellationFee)
    .then(data => {
      req.payload.statusMsg = 'Cancelado por ' + fromName + ''
      modelName.cancelOrders(req.payload, (err, res) => {
        if (err) {
          logger.error(
            "Error occurred during driver order cancel (cancelOrders) : " +
            JSON.stringify(err)
          );
          return reply({
            message: req.i18n.__("genericErrMsg")["500"]
          }).code(500);
        }
        delete res.value._id;
        if (res.value) {
          // res.value.cartTotal = req.payload.cancFee;
          // res.value.deliveryCharge = 0;
          // res.value.storeDeliveryFee = 0;
          res.value.paidBy.card = data.cardCharge || 0;
          res.value.paidBy.wallet = data.walletCharge || 0;
        }
        completedOrders.pushOrder(res ? res.value : {}, (err, insRes) => {
          if (err) {
            logger.error(
              "Error occurred during driver order cancel (pushOrder) : " +
              JSON.stringify(err)
            );
            return reply({
              message: req.i18n.__("genericErrMsg")["500"]
            }).code(500);
          }
          modelName.remove({ orderId: req.payload.orderId }, (err, delRes) => {
            if (err) {
              logger.error(
                "Error occurred during driver order cancel (remove) : " +
                JSON.stringify(err)
              );
              return reply({
                message: req.i18n.__("genericErrMsg")["500"]
              }).code(500);
            }
            client.client.del("bid_" + req.payload.orderId, () => { });
            client.client.del("que_" + req.payload.orderId, () => { });
            client.client.get("nowBooking_" + req.payload.orderId, function (
              err,
              object
            ) {
              if (object == null) {
              } else {
                client.client.del("nowBooking_" + req.payload.orderId, function (
                  err,
                  reply
                ) { });
              }
            });
            res.value.reason = req.payload.reason;
            res.value.fromName = fromName;
            res.value.createdBy = fromName;

            let inventoryData = [];
            for (let y = 0; y < res.value.Items.length; y++) {
              inventoryData.push({
                orderId: res.value.orderId,
                userId: res.value.customerDetails.customerId,
                unitId: res.value.Items[y].unitId,
                productId: res.value.Items[y].childProductId,
                storeId: res.value.storeId.toString(),
                comingFromBulkUpload: 2,
                triggerType: 1,
                quantity: res.value.Items[y].quantity,
                description: "Order cancelled (Refund)"
              });
            }
            updateInventory(inventoryData);
            sendNotification(res.value);
            sendEmail(res.value);

            // if (res.value && res.value.claimDetails && res.value.claimDetails.claimId != "") {
            //     superagent.post(config.API_URL + '/unlockPromoCode')
            //         .send({ claimId: res.value.claimDetails.claimId })
            //         .end(function (err, res) {
            //         });
            // }
            if (
              res.value.claimData &&
              Object.keys(res.value.claimData).length !== 0 &&
              res.value.claimData != null &&
              res.value.claimData.claimId != ""
            ) {
              campaignAndreferral.unlockCouponHandler(
                { claimId: res.value.claimData.claimId },
                (err, res) => { }
              );
            }

            accounting
              .cancellation(req.payload.orderId) // accounting/pickup
              .then(orderAccount => {
                if (orderAccount.data) {
                  const rec = {
                    cashCollected: 0,
                    cardDeduct: 0,
                    WalletTransaction:
                      orderAccount.data.accouting.cancelationFee,
                    pgComm: orderAccount.data.accouting.pgEarningValue,
                    appEarning: orderAccount.data.accouting.appEarningValue,
                    driverId: orderAccount.data.driverId || "",
                    driverEarning:
                      orderAccount.data.accouting.driverEarningValue,
                    storeId: orderAccount.data.storeId || "",
                    storeEarning: orderAccount.data.accouting.storeEarningValue,
                    franchiseId: orderAccount.data.franchiseId || "",
                    franchiseEarning:
                      orderAccount.data.accouting.franchiseEarningValue,
                    partnerId: orderAccount.data.partnerId || "",
                    partnerEarning:
                      orderAccount.data.accouting.partnerEarningValue,
                    userId: orderAccount.data.customerDetails.customerId,
                    currency: orderAccount.data.currency,
                    currencySymbol: orderAccount.data.currencySymbol,
                    orderId: orderAccount.data.orderId,
                    serviceType: orderAccount.data.serviceType,
                    serviceTypeText:
                      orderAccount.data.serviceType === 1
                        ? "delivery"
                        : "pickup",
                    driverType:
                      typeof orderAccount.data.driverDetails != "undefined" &&
                        typeof orderAccount.data.driverDetails.driverType !=
                        "undefined"
                        ? orderAccount.data.driverDetails.driverType
                        : 1,
                    paymentTypeText: orderAccount.data.paymentTypeMsg,
                    cityName: orderAccount.data.city,
                    cityId: orderAccount.data.cityId
                  };
                  walletEntryModel.walletEntryForOrdering(
                    rec,
                    (error, result) => {
                      //     if (error) {
                      //         logger.error('error : ' + error)
                      //     }
                    }
                  );
                  return reply({
                    message: req.i18n.__("bookings")["201"],
                    data: res ? res.value : {}
                  }).code(201);
                  // })
                }
              })
              .catch(e => {
                logger.error("accounting error : ", e);
              });
          });
        });
      });
    })
    .catch(e => {
      logger.error(
        "Error occurred update order " +
        req.auth.credentials.sub +
        " (catch): ", e
      );
      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
      if (e.code == 400) {
        return reply({
          message: e.message
        }).code(400);
      }
      if (e.code == 403) {
        return reply({
          message: e.message
        }).code(403);
      }
      return reply({
        message: req.i18n.__("genericErrMsg")["500"]
      }).code(500);
    });

  function sendNotification(data) {
    //send mqtt notification to customer
    let customerData = {
      status: parseInt(data.status),
      statusMsg: data.statusMsg ? data.statusMsg : "",
      bid: data.orderId,
      msg: "Order Cancelled By " + data.createdBy + ".",
      action: 14
    };
    if (data.customerDetails && data.customerDetails.mqttTopic) {
      notifyi.notifyRealTime({
        listner: data.customerDetails.mqttTopic,
        message: customerData
      });
    }
    //send fcm topic push to customer

    notifications.notifyFcmTopic(
      {
        action: 11,
        usertype: 1,
        deviceType: data.customerDetails.deviceType,
        notification: "",
        msg: data.reason ? req.i18n.__(req.i18n.__('bookingStatusMsg')[data.status + 'reson'], data.customerDetails.name, data.reason) : req.i18n.__(req.i18n.__('bookingStatusMsg')[data.status + 's'], data.customerDetails.name),
        // msg: "Your order has been cancelled",
        fcmTopic: data.customerDetails.fcmTopic,
        title: req.i18n.__(req.i18n.__('bookingStatusTitle')[data.status]),
        data: customerData
      },
      () => { }
    );
    notifyi.notifyRealTime({ 'listner': 'stafforderUpdates/' + data.storeId, message: { orderId: data.orderId, status: data.status, statusMsg: 'Your order has been cancelled by (' + data.createdBy + ')' + data.fromName + '' } });

    storeManagers.getAll({ storeId: data.storeId.toString(), status: 2 }, (err, storeManager) => {
      if (err) {
        logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
      }
      if (storeManager.length > 0) {
        for (let s = 0; s < storeManager.length; s++) {
          notifications.notifyFcmTopic(
            {
              action: 5,
              usertype: 1,
              deviceType: storeManager[s].mobileDevices.deviceType ? storeManager[s].mobileDevices.deviceType : 2,
              notification: "",
              msg: data.reason ? req.i18n.__(req.i18n.__('bookingStatusMsg')[data.status], data.customerDetails.name, data.reason) : req.i18n.__(req.i18n.__('bookingStatusMsg')[data.status + 's'], data.customerDetails.name),
              // msg: "Your order has been cancelled",
              fcmTopic: storeManager[s].fcmManagerTopic,
              title: req.i18n.__(req.i18n.__('bookingStatusTitle')[data.status]),
              data: {}
            },
            () => { }
          );
        }
      }

      storeManagers.getAll({ cityId: data.cityId.toString(), status: 2, userType: 0 }, (err, cityManager) => {
        if (err) {
          logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
        }
        if (cityManager.length > 0) {
          for (let k = 0; k < cityManager.length; k++) {
            notifications.notifyFcmTopic(
              {
                action: 5,
                usertype: 1,
                deviceType: cityManager[k].mobileDevices.deviceType ? cityManager[k].mobileDevices.deviceType : 2,
                notification: "",
                msg: data.reason ? req.i18n.__(req.i18n.__('bookingStatusMsg')[data.status], data.customerDetails.name, data.reason) : req.i18n.__(req.i18n.__('bookingStatusMsg')[data.status + 's'], data.customerDetails.name),
                // msg: "Your order has been cancelled",
                fcmTopic: cityManager[k].fcmManagerTopic,
                title: req.i18n.__(req.i18n.__('bookingStatusTitle')[data.status]),
                data: {}
              },
              () => { }
            );
          }
        }
      });
    });

    if (data.driverDetails && data.driverDetails.fcmTopic) {
      notifications.notifyFcmTopic(
        {
          action: 14,
          usertype: 1,
          deviceType: data.driverDetails ? data.driverDetails.Device_type_ : 1,
          notification: "",
          msg: data.reason ? req.i18n.__(req.i18n.__('bookingStatusMsg')[data.status], data.customerDetails.name, data.reason) : req.i18n.__(req.i18n.__('bookingStatusMsg')[data.status + 's'], data.customerDetails.name),
          // msg: "Your order has been cancelled",
          fcmTopic: data.driverDetails ? data.driverDetails.fcmTopic : "",
          title: req.i18n.__(req.i18n.__('bookingStatusTitle')[data.status]),
          data: customerData
        },
        () => { }
      );
    }

    if (data.driverDetails && data.driverDetails.mqttTopic) {
      notifyi.notifyRealTime({
        listner: data.driverDetails.mqttTopic,
        message: customerData
      });
    }
    //send to web socket store dispatch
    // webSocket.publish('stafforderUpdate/' + data.storeId, data, { qos: 2 }, (mqttErr, mqttRes) => { });
    managerTopics.sendToWebsocket(data, 2, (err, res) => { });
  }

  function sendEmail(data) {
    let itms = data.Items ? data.Items : [];
    var dynamicItems = [];
    var dynamicItemsPdf = [];
    var totalDiscount = 0;
    for (let i = 0; i < itms.length; i++) {
      dynamicItems.push(
        '<tr style="border-bottom: 2px solid grey;"><td style="width:20%;padding-top: 15px;text-align:center"><img src=' +
        itms[i].itemImageURL +
        ' style="max-width: 100px;max-height: 100px;"></td><td style="width:60%;    padding-top: 15px;"><p style="margin:0;font-size: 14px;    font-weight: 600;">' +
        itms[i].itemName +
        '</p><p style="margin:0;font-size: 12px;    color: #666;    line-height: 1.6;">' +
        itms[i].catName +
        "  <br> " +
        itms[i].subCatName +
        "  <br> Sold by: " +
        data.storeName +
        '  </p></td><td style="width:20%;font-size: 13px;text-align: center;padding-top: 15px;">' +
        itms[i].quantity +
        '</td><td style="width:20%;text-align: right;font-size: 13px;padding-top: 15px;">' +
        data.currencySymbol +
        "" +
        itms[i].unitPrice +
        "</td></tr>"
      );
    }

    for (let j = 0; j < itms.length; j++) {
      totalDiscount += itms[j].appliedDiscount;
      dynamicItemsPdf.push(
        '<tr><td style="padding: 10px 0;"><h6 class="textTransformCpCls" style="text-transform: capitalize; font-weight: 500;margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' +
        itms[j].barcode +
        '</h6></td><td><h6 class="textTransformCpCls" style="text-transform: capitalize; font-weight: 500;margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' +
        itms[j].itemName +
        '</h6></td><td><h6 class="textTransformCpCls" style="text-transform: capitalize; font-weight: 500;margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' +
        itms[j].unitName +
        '</h6></td><td><h6 class="textTransformCpCls" style="margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;"> <span class="" style="">' +
        data.currencySymbol +
        "</span> " +
        String(itms[j].unitPrice) +
        '</h6></td><td><h6 class="textTransformCpCls" style="text-align: center;margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' +
        String(itms[j].quantity) +
        '</h6></td><td><h6 class="textTransformCpCls" style="margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' +
        String(Number(Math.round(itms[j].appliedDiscount + "e2") + "e-2")) +
        '</h6></td><td><h6 class="textTransformCpCls" style="margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;"> <span class="" style="">' +
        data.currencySymbol +
        "</span> " +
        String(itms[j].finalPrice * itms[j].quantity) +
        "</h6></td></tr>"
      );
    }

    if (config.mailGunService == "true") {
      var cancelledTimestamp = data.bookingDateTimeStamp;
      var cancelledDate = moment
        .unix(cancelledTimestamp)
        .format("YYYY-MM-DD HH:mm:ss");
      email.getTemplateAndSendEmail(
        {
          attachment: true,
          orderId: String(data.orderId),
          templateName: "orderCanceled.html",
          toEmail: data.customerDetails.email,
          trigger: "Order cancelled",
          subject: "Order cancelled successfully.",
          keysToReplace: {
            userName: data.customerDetails.name || "",
            appName: config.appName,
            orderPlacedDate: moment(moment.unix(cancelledTimestamp)).tz("Asia/Kolkata").format('YYYY-MM-DD HH:mm:SS'),
            addressLine1: data.drop ? data.drop.addressLine1 : "",
            addressLine2: data.drop ? data.drop.addressLine2 : "",
            country: data.drop ? data.drop.country : "",
            orderCreationDate: moment(moment.unix(data.bookingDateTimeStamp)).tz("Asia/Kolkata").format('YYYY-MM-DD hh:mm:ss A'),
            itemsCount: String(data.Items.length),
            subTotalAmount: data.currencySymbol + "" + data.subTotalAmount,
            deliveryCharge: data.currencySymbol + "" + data.deliveryCharge,
            discount: data.currencySymbol + "" + data.discount,
            tax: data.currencySymbol + "" + data.excTax ? data.excTax : 0,
            totalAmount: data.currencySymbol + "" + data.totalAmount,
            cancelAmount: data.accouting.cancelationFee
              ? data.currencySymbol + "" + data.accouting.cancelationFee
              : data.currencySymbol + "" + 0,
            orderId: String(data.orderId),
            storeName: data.storeName,
            webUrl: data.webUrl,
            dynamicItems: dynamicItems
          }
        },
        () => { }
      );
    }
  }
  const updateInventory = data => {
    // async.each(data, (item, callback) => {
    //     /**
    //  * function : inventoryMethod
    //  * des:to update inventory
    //  */
    //     inventoryMethod.patchLogs(item,
    //         (err, res) => {
    //             if (err) {
    //                 logger.error('err while updaing inventory refund cancel place', err);
    //             } else {
    //                 callback();
    //             }
    //         });
    // }, function (err) {
    // });
    // callback();
  };
};
/**
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
  reason: Joi.string().description("reason").allow(""),
  ipAddress: Joi.string().required().description("Ip Address"),
  orderId: Joi.number().required().description("orderId "),
  latitude: Joi.number().required().description("Latitude is required").default(13.0195677),
  longitude: Joi.number().required().description("Longitude is required").default(77.5968131)
};




/**
 * A module that exports customer update order!
 * @exports validator
 * @exports handler
 */
module.exports = { handler, validator };
