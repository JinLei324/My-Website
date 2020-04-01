const assignOrders = require("../../../models/assignOrders");
const async = require("async");
const newOrders = require("../../../models/order");
const unassignOrders = require("../../../models/unassignOrders");
const pickupOrders = require("../../../models/pickupOrders");
const storeManagers = require("../../../models/storeManagers");
const Auth = require("../../middleware/authentication");
const error = require("../../../statusMessages/responseMessage"); // response messages based on language
const status = require("../../../statusMessages/statusMessages");
const config = process.env;
let Joi = require("joi");
const ObjectId = require("mongodb").ObjectID;
const logger = require("winston");
const moment = require("moment");
const notifications = require("../../../library/fcm");
const managerTopics = require("../managerTopics");
const notifyi = require("../../../library/mqttModule");
const webSocket = require("../../../library/websocket/websocket");
const cartModel = require("../../../models/cart");
const email = require("../email/email");
/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */
const handler = (req, reply) => {
  //  req.headers.language = 'en';
  let orderDetails = {};
  var modelName = "";

  //add items.length check
  if (req.payload.items.length < 1) {
    return reply({ message: "Items are required." }).code(400);
  }
  const readNewOrder = newOrder => {
    return new Promise((resolve, reject) => {
      newOrders.isExistsWithOrderId({ orderId: req.payload.orderId }, (err, res) => {
        orderDetails = res ? res : orderDetails;
        modelName = res ? newOrders : modelName;
        return err ? reject(err) : resolve(orderDetails);
      });
    });
  };
  const readPickedupOrder = newOrder => {
    return new Promise((resolve, reject) => {
      pickupOrders.isExistsWithOrderId({ orderId: req.payload.orderId }, (err, res) => {
        orderDetails = res ? res : orderDetails;
        modelName = res ? pickupOrders : modelName;
        return err ? reject(err) : resolve(orderDetails);
      });
    });
  };
  const readUnassignOrder = newOrder => {
    return new Promise((resolve, reject) => {
      unassignOrders.isExistsWithOrderId({ orderId: req.payload.orderId }, (err, res) => {
        orderDetails = res ? res : orderDetails;
        modelName = res ? unassignOrders : modelName;
        return err ? reject(err) : resolve(orderDetails);
      });
    });
  };
  const readAssignOrder = newOrder => {
    return new Promise((resolve, reject) => {
      assignOrders.isExistsWithOrderId({ orderId: req.payload.orderId }, (err, res) => {
        orderDetails = res ? res : orderDetails;
        modelName = res ? assignOrders : modelName;
        return err ? reject(err) : resolve(orderDetails);
      });
    });
  };
  const cartUpdate = newOrder => {
    return new Promise((resolve, reject) => {
      if (Object.keys(orderDetails).length > 0) {
        async.each(
          req.payload.items,
          (item, callback) => {
            cartModel.patchQuantity(
              {
                cartId: new ObjectId(orderDetails.cartId),
                addedToCartOn: item.addedToCartOn,
                childProductId: item.childProductId,
                unitId: item.unitId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                finalPrice: item.finalPrice,
                userId: req.auth.credentials._id.toString(),
                customerName: "",
                createdBy: req.auth.credentials.sub
              },
              (err, res) => {
                if (err) {
                  return reject(err);
                }
                callback();
              }
            );
          },
          function (err) {
            return resolve(orderDetails);
          }
        );
      } else {
        return reply({
          message: req.i18n.__("bookings")["404"]
        }).code(404);
      }
    });
  };
  let item = {};
  const getUpdatedCart = newOrder => {
    return new Promise((resolve, reject) => {
      cartModel.getByCartId({ cartId: orderDetails.cartId, storeId: orderDetails.storeId }, (err, data) => {
        if (err) {
          logger.error("error while get cart in update " + JSON.stringify(err));
          return reject({ code: 500 });
        } else if (data.length > 0) {
          item = data[0];
          let totalPrice = 0;
          let cartId = "";
          let responseArray = [];
          let cartData = {};
          let incTax = {};
          let excTax = {};
          let inclTax = 0;
          let exclTax = 0;
          let cartTotal = 0;
          let cartDiscount = 0;
          let exclTaxStore = 0;
          let excTaxStore = {};
          item.sTotalPrice = 0;

          item.storeDeliveryFee = 0;
          item.estimateId = "";
          if (item.estimates && item.estimates.length > 0) {
            for (let a = 0; a < item.estimates.length; a++) {
              if (String(item.estimates[a].storeId) == String(item.storeId)) {
                item.storeDeliveryFee = item.estimates[a].deliveryPrice;
                item.estimateId = item.estimates[a].estimateId;
              } else {
              }
            }
          }
          item.cartDiscount = Number((parseFloat(item.storeUnitPrice) - parseFloat(item.storeTotalPrice)).toFixed(2));
          item.cartTotal = Number(item.storeUnitPrice.toFixed(2));
          cartTotal += item.cartTotal;
          cartDiscount += Number(item.cartDiscount.toFixed(2));

          for (let k = 0; k < item.products.length; k++) {
            item.products[k].productName = item.products[k].itemName;
            item.products[k].taxes = item.products[k].taxes ? item.products[k].taxes : [];

            /////////////////////////////////////handling addons///////////////
            item.products[k].packId = item.products[k].addedToCartOn ? item.products[k].addedToCartOn.toString() : 0;
            item.products[k].addOnsPrice = 0;
            if (item.products[k].addOns && item.products[k].addOns.length > 0) {
              item.products[k].addOnAvailable = 1;

              /*
                            Get the add on details from add ons collection and set it
                        */
              let allAddOns = orderDetails.Items;
              let addOnData = [];

              let cartItems = item.products[k].addOns;
              let allProductAddOns = [];
              let cartAddOns = [];
              item.products[k].selectedAddOns = [];

              for (let l = 0; l < allAddOns.length; l++) {
                for (let m = 0; m < allAddOns[l].addOns.length; m++) {
                  allProductAddOns.push(allAddOns[l].addOns[m]);
                }
              }
              for (let n = 0; n < cartItems.length; n++) {
                for (let o = 0; o < cartItems[n].addOnGroup.length; o++) {
                  cartAddOns.push(cartItems[n].addOnGroup[o]);
                }
              }
              async.each(cartAddOns, (cartAddOnsData, callbackSub2) => {
                async.each(allProductAddOns, (allProductAddOn, callbackSub2) => {
                  for (let j = 0; j < allProductAddOn.addOnGroup.length; j++) {
                    if (allProductAddOn.addOnGroup[j].id == cartAddOnsData)
                      addOnData.push(allProductAddOn.addOnGroup[j]);
                  }
                  // if (allProductAddOn.id == cartAddOnsData) {
                  //     addOnData.push({
                  //         "name": allProductAddOn.name[req.headers.language],
                  //         "price": allProductAddOn.price,
                  //         "id": allProductAddOn.id,
                  //     });
                  // }
                });
              });
              for (let n = 0; n < cartItems.length; n++) {
                for (let o = 0; o < cartItems[n].addOnGroup.length; o++) {
                  for (let i = 0; i < addOnData.length; i++) {
                    if (cartItems[n].addOnGroup[o] == addOnData[i].id) {
                      cartItems[n].addOnGroup[o] = addOnData[i];
                    }
                  }
                }
              }
              if (addOnData.length > 0) {
                for (var a = 0; a < addOnData.length; a++) {
                  item.products[k].addOnsPrice += parseFloat(addOnData[a].price) * item.products[k].quantity;
                }
              }
              item.products[k].selectedAddOns = cartAddOns;
            } else {
              item.products[k].addOnAvailable = 0;
            }
            item.sTotalPrice += item.products[k].addOnsPrice ? item.products[k].addOnsPrice : 0;
            ////////////////////////XXXXXXXXXXXXX/////////////////////
            // item.storeTotalPriceWithExcTaxes = parseFloat(item.storeTotalPrice) + parseFloat(item.products[k].addOnsPrice);
            for (let l = 0; l < item.products[k].taxes.length; l++) {
              if (item.products[k].taxes[l].taxFlag == 0) {
                // inclusive
                if (typeof incTax[item.products[k].taxes[l].taxCode.toString()] == "undefined") {
                  incTax[item.products[k].taxes[l].taxCode.toString()] = {
                    taxId: item.products[k].taxes[l].taxId,
                    taxtName: item.products[k].taxes[l].taxname["en"],
                    taxFlagMsg: item.products[k].taxes[l].taxFlagMsg,
                    taxValue: item.products[k].taxes[l].taxValue,
                    taxCode: item.products[k].taxes[l].taxCode,
                    price: parseFloat(
                      parseFloat(item.products[k].taxes[l].price * item.products[k].quantity).toFixed(2)
                    )
                  };
                } else {
                  incTax[item.products[k].taxes[l].taxCode.toString()]["price"] += parseFloat(
                    parseFloat(item.products[k].taxes[l].price * item.products[k].quantity).toFixed(2)
                  );
                }
                inclTax += item.products[k].taxes[l].price;
                item.inclTax = inclTax;
              }
              if (item.products[k].taxes[l].taxFlag == 1) {
                if (typeof excTax[item.products[k].taxes[l].taxCode] == "undefined") {
                  excTax[item.products[k].taxes[l].taxCode] = {
                    taxId: item.products[k].taxes[l].taxId,
                    taxtName: item.products[k].taxes[l].taxname["en"],
                    taxFlagMsg: item.products[k].taxes[l].taxFlagMsg,
                    taxValue: item.products[k].taxes[l].taxValue,
                    taxCode: item.products[k].taxes[l].taxCode,
                    price: parseFloat(
                      parseFloat(item.products[k].taxes[l].price * item.products[k].quantity).toFixed(2)
                    )
                  };
                } else {
                  excTax[item.products[k].taxes[l].taxCode]["price"] += parseFloat(
                    parseFloat(item.products[k].taxes[l].price * item.products[k].quantity).toFixed(2)
                  );
                }
                /////////////////////////////////////////
                if (typeof excTaxStore[item.products[k].taxes[l].taxCode] == "undefined") {
                  excTaxStore[item.products[k].taxes[l].taxCode] = {
                    taxId: item.products[k].taxes[l].taxId,
                    taxtName: item.products[k].taxes[l].taxname["en"],
                    taxFlagMsg: item.products[k].taxes[l].taxFlagMsg,
                    taxValue: item.products[k].taxes[l].taxValue,
                    taxCode: item.products[k].taxes[l].taxCode,
                    price: parseFloat(
                      parseFloat(item.products[k].taxes[l].price * item.products[k].quantity).toFixed(2)
                    )
                  };
                } else {
                  excTaxStore[item.products[k].taxes[l].taxCode]["price"] += parseFloat(
                    parseFloat(item.products[k].taxes[l].price * item.products[k].quantity).toFixed(2)
                  );
                }
                ///////////////////////////////////////////
                let storeExcTaxArr = [];
                for (const key in excTaxStore) {
                  storeExcTaxArr.push(excTaxStore[key]);
                }
                item.exclusiveTaxes = storeExcTaxArr;
                // exclTaxStore += item.products[k].taxes[l].price * item.products[k].quantity
                // exclTax += item.products[k].taxes[l].price * item.products[k].quantity
                if (typeof item.products[k].taxes[l].price != "undefined") {
                  exclTaxStore += parseFloat(
                    parseFloat(item.products[k].taxes[l].price * item.products[k].quantity).toFixed(2)
                  );
                  exclTax += parseFloat(
                    parseFloat(item.products[k].taxes[l].price * item.products[k].quantity).toFixed(2)
                  );
                }
                item.exclTaxStore = parseFloat(exclTaxStore);
                // item.storeTotalPriceWithExcTaxes = parseFloat(item.exclTaxStore) + parseFloat(item.storeTotalPrice)
              }
            }
          }
          cartData = item;

          return resolve(item);
        } else {
          return reply({
            message: req.i18n.__("bookings")["404"]
          }).code(404);
        }
      });
    });
  };

  readNewOrder()
    .then(readUnassignOrder)
    .then(readAssignOrder)
    .then(readPickedupOrder)
    .then(cartUpdate)
    .then(getUpdatedCart)
    .then(data => {
      if (Object.keys(data).length > 0) {
        req.payload.createdBy = req.auth.credentials.sub;
        req.payload.driverId = req.auth.credentials._id.toString();
        // let subTotal = 0;
        // for (let i = 0; i < req.payload.items.length; i++) {
        //     subTotal += parseFloat(req.payload.items[i].unitPrice) * req.payload.items[i].quantity
        // }
        // let excTax = 0;
        // data.exclusiveTaxes = data.exclusiveTaxes ? data.exclusiveTaxes : [];
        // for (let i = 0; i < data.exclusiveTaxes.length; i++) {
        //     excTax += parseFloat(data.exclusiveTaxes[i].price)
        // }
        let excTot = 0;
        item.exclusiveTaxes = item.exclusiveTaxes ? item.exclusiveTaxes : [];

        for (let i = 0; i < item.exclusiveTaxes.length; i++) {

          excTot += item.exclusiveTaxes[i].price ? parseFloat(item.exclusiveTaxes[i].price) : 0;
        }
        (req.payload.cartTotal = parseFloat(item.cartTotal)),
          (req.payload.cartDiscount = parseFloat(item.cartDiscount)),
          (req.payload.excTax = excTot ? excTot : 0),
          (req.payload.subTotalAmount = parseFloat(
            parseFloat(parseFloat(item.storeTotalPrice) + parseFloat(item.sTotalPrice)).toFixed(2)
          )),
          (req.payload.exclusiveTaxes = item.exclusiveTaxes),
          // req.payload.subTotalAmountWithExcTax = item.storeTotalPriceWithExcTaxes,
          (req.payload.subTotalAmountWithExcTax = parseFloat(
            parseFloat(parseFloat(item.storeTotalPrice) + parseFloat(item.sTotalPrice)).toFixed(2)
          )),
          (req.payload.deliveryCharge = parseFloat(item.storeDeliveryFee));
        req.payload.deliveryFee = parseFloat(item.storeDeliveryFee);

        req.payload.totalAmount =
          req.payload.subTotalAmountWithExcTax +
          req.payload.excTax +
          (req.payload.deliveryCharge ? req.payload.deliveryCharge : 0) -
          (orderDetails.discount || 0);
        req.payload.items = item.products;
        modelName.patchOrderss(req.payload, (err, res) => {
          if (err) {
            logger.error("Error occurred during driver order update (patchOrderss) : " + JSON.stringify(err));
            // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
            return reply({
              message: req.i18n.__("genericErrMsg")["500"]
            }).code(500);
          }
          sendNotification(res.value);
          return reply({
            message: req.i18n.__("bookings")["200"],
            data: res ? res.value : {}
          }).code(200);
        });
        // return reply({
        //     message: req.i18n.__('bookings')['200'], data: {}
        // }).code(200);
      } else {
        // return reply({
        //     message: error['bookings']['404'][req.headers.language]
        // }).code(404);
        return reply({
          message: req.i18n.__("bookings")["404"]
        }).code(404);
      }
    })
    .catch(e => {
      logger.error("Error occurred update order " + req.auth.credentials.sub + " (catch): " + JSON.stringify(e));
      // return reply({ message: Joi.any().default(i18n.__('genericErrMsg')['500'])[req.headers.language] }).code(500);
      return reply({
        message: req.i18n.__("genericErrMsg")["500"]
      }).code(500);
    });
  function sendNotification(data) {
    //send mqtt notification to customer
    let customerData = {
      status: parseInt(data.status),
      bid: data.orderId,
      msg: req.i18n.__(req.i18n.__('bookingStatusTitle')['updateStore'], data.orderId)
    };

    notifyi.notifyRealTime({ listner: data.customerDetails.mqttTopic, message: customerData });
    notifications.notifyFcmTopic(
      {
        action: 11,
        usertype: 1,
        deviceType: data.customerDetails.deviceType,
        notification: "",
        msg: req.i18n.__(req.i18n.__('bookingStatusMsg')['updateStore'], config.appName),
        fcmTopic: data.customerDetails.fcmTopic,
        title: req.i18n.__(req.i18n.__('bookingStatusTitle')['updateStore']),
        data: customerData
      },
      () => { }
    );
    if (data.inDispatch == true && data.driverDetails) {
      notifications.notifyFcmTopic(
        {
          action: 11,
          usertype: 1,
          deviceType: data.driverDetails.Device_type_,
          notification: "",
          msg: req.i18n.__(req.i18n.__('bookingStatusMsg')['updateStore'], config.appName),
          fcmTopic: data.driverDetails.fcmTopic,
          title: req.i18n.__(req.i18n.__('bookingStatusTitle')['updateStore']),
          data: customerData
        },
        () => { }
      );
      notifyi.notifyRealTime({ listner: data.driverDetails.mqttTopic, message: customerData });
    }

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
              title: req.i18n.__(req.i18n.__('bookingStatusMsg')['updateStoreUser'], data.orderId, data.createdBy),
              fcmTopic: storeManager[s].fcmManagerTopic,
              title: req.i18n.__(req.i18n.__('bookingStatusTitle')['updateStore']),
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
                title: req.i18n.__(req.i18n.__('bookingStatusMsg')['updateStoreUser'], data.orderId, data.createdBy),
                fcmTopic: cityManager[k].fcmManagerTopic,
                title: req.i18n.__(req.i18n.__('bookingStatusTitle')['updateStore']),
                data: {}
              },
              () => { }
            );
          }
        }
      });
    });
    //send fcm topic push to central
    // data.statusMsg = data.statusMsg;
    data.statusMsg = "Order #" + data.orderId + " has been updated by one of the manager.";
    data.statusMessage = "Order #" + data.orderId + " has been updated by one of the manager.";
    managerTopics.sendToWebsocket(data, 2, (err, res) => { });

    let itms = data.Items ? data.Items : [];
    var dynamicItemsPdf = [];

    for (let j = 0; j < itms.length; j++) {
      dynamicItemsPdf.push(
        '<tr><td style="padding: 10px 0;"><h6 class="textTransformCpCls" style="text-transform: capitalize; font-weight: 500;margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">N/A</h6></td><td><h6 class="textTransformCpCls" style="text-transform: capitalize; font-weight: 500;margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;">' +
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
        String(itms[j].appliedDiscount) +
        '</h6></td><td><h6 class="textTransformCpCls" style="margin-bottom: 5px;margin-top: 0px;text-transform: capitalize;font-weight: 500;"> <span class="" style="">' +
        data.currencySymbol +
        "</span> " +
        String(itms[j].finalPrice) +
        "</h6></td></tr>"
      );
    }
    email.generatePdf(
      {
        attachment: true,
        orderId: String(data.orderId),
        templateName: "invoiceTemplateOriginal.html",
        toEmail: data.customerDetails.email,
        trigger: "Order placed",
        subject: "Order placed successfully.",
        qrCodeImage: data.qrCode,
        keysToReplace: {
          userName: data.customerDetails.name || "",
          dropName: data.customerDetails.name || "",
          dropPhone: data.customerDetails.mobile || "",
          appName: config.appName,
          orderPlacedDate: moment(moment.unix(data.bookingDateTimeStamp)).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
          addressLine1: data.drop ? data.drop.addressLine1 : "",
          dropAddressLine1: data.drop ? data.drop.addressLine1 : "",
          dropAddressLine2: data.drop ? data.drop.addressLine2 : "",
          addressLine2: data.drop ? data.drop.addressLine2 : "",
          country: data.drop ? data.drop.country : "",
          orderCreationDate: moment(moment.unix(data.bookingDateTimeStamp)).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
          itemsCount: String(data.Items.length),
          subTotalAmount: data.currencySymbol + "" + data.subTotalAmount,
          subTotal: String(data.subTotalAmount),
          dropCity: data.drop ? data.drop.city : "",
          dropState: data.state ? data.drop.state : "",
          orderDate: data.bookingDate ? data.bookingDate : "",
          storeName: data.storeName ? data.storeName : "",
          deliveryCharge: data.currencySymbol + "" + data.deliveryCharge,
          delivery: String(data.deliveryCharge),
          discount: String(data.discount),
          tax: data.currencySymbol + "" + data.excTax ? data.excTax : 0,
          taxes: data.excTax ? String(data.excTax) : String(0),
          totalAmount: data.currencySymbol + "" + String(data.totalAmount),
          total: String(data.totalAmount),
          pendingAmount:
            data.paymentType === 2 ? data.currencySymbol + "" + data.totalAmount : data.currencySymbol + "" + 0,
          orderId: String(data.orderId),
          shipdate: data.dueDatetime ? data.dueDatetime : "",
          storeName: data.storeName,
          webUrl: data.webUrl,
          dynamicItems: dynamicItemsPdf,
          currencySymbol: data.currencySymbol,
          paymentTypeMsg: data.paymentTypeMsg,
          serviceType: data.serviceType == 1 ? "Delivery" : "Pickup"
        }
      },
      () => { }
    );
  }
};



/**
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
  items: Joi.array()
    .items()
    .required()
    .description("array"),
  extraNote: Joi.string()
    .description("extraNote")
    .allow(""),
  ipAddress: Joi.string().description("Ip Address"),
  orderId: Joi.number()
    .required()
    .description("orderId "),
  deliveryCharge: Joi.number()
    .required()
    .description("delivery Fee of store"),
  latitude: Joi.number()
    .description("Latitude is required")
    .default(13.0195677),
  longitude: Joi.number()
    .description("Longitude is required")
    .default(77.5968131)
};
/**
 * A module that exports customer update order!
 * @exports validator
 * @exports handler
 */
module.exports = { handler, validator };
