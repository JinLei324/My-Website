const assignOrders = require("../../../models/assignOrders");
const async = require("async");
const newOrders = require("../../../models/order");
const unassignOrders = require("../../../models/unassignOrders");
const pickupOrders = require("../../../models/pickupOrders");
const storeManagers = require("../../../models/storeManagers");
const zones = require('../../../models/zones');
const config = process.env;
let Joi = require("joi");
const ObjectID = require("mongodb").ObjectID;
const logger = require("winston");
const notifications = require("../../../library/fcm");
const managerTopics = require("../managerTopics");
const notifyi = require("../../../library/mqttModule");
const cartModel = require("../../../models/cart");
const email = require("../email/email");

const childProducts = require('../../../models/childProducts');
const stores = require('../../../models/stores');
const customer = require('../../../models/customer');
const valiDateAddOns = require('../../commonModels/addOns');
const transcation = require('../../commonModels/wallet/transcation');
const stripeTransaction = require("../../../web/commonModels/stripe/stripeTransaction");
const moment = require('moment-timezone');

/**
 * @function
 * @name handler
 * @return {object} Reply to the user.
 */
const handler = (req, reply) => {
  //  req.headers.language = 'en';
  let orderDetails = {};
  var modelName = "";
  var updateObj = Object.assign({}, req.payload.items);
  var replaceObj = Object.assign({}, req.payload.newItems);
  let type = "";
  let newquantity = 0



  let storeData = {};
  let cartData = [];
  let productData = {};
  let customerData = {};

  let storeType = 1;
  let addedToCartOn = moment().unix();
  let addOnsData = [];
  let addOnFlag = ""
  let addOnsDataToCart = [];

  let zoneData = {};

  let item = {};
  //add items.length check
  // if (req.payload.items.length < 1) {
  //   return reply({ message: "Items are required." }).code(400);
  // }

  if (parseInt(req.payload.updateType) == 2) {
    if (typeof req.payload.newItems.addedToCartOn == "undefined" &&
      typeof req.payload.newItems.childProductId == "undefined" &&
      typeof req.payload.newItems.unitId == "undefined" &&
      typeof req.payload.newItems.unitPrice == "undefined" &&
      typeof req.payload.newItems.finalPrice == "undefined" &&
      typeof req.payload.newItems.quantity == "undefined" &&
      typeof req.payload.newItems.oldQuantity == "undefined") {
      return reply({ message: "New Items Data required." }).code(400);
    }

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
  const readZone = (itemId) => {
    return new Promise((resolve, reject) => {
      zones.getCityId({
        city_ID: storeData.cityId
      }, (err, zone) => {
        if (err) {
          reject({
            code: 500
          });
        }
        if (zone) {
          zoneData = zone;
        } else {
          reject({
            code: 404
          });
          zoneData = {};
        }

        resolve(zoneData);
      });
    });
  }
  const getCart = newOrder => {
    return new Promise((resolve, reject) => {
      cartModel.getByCartId({ cartId: orderDetails.cartId, storeId: orderDetails.storeId }, (err, data) => {
        if (err) {
          logger.error("error while get cart in update " + JSON.stringify(err));
          return reject({ code: 500 });
        }
        if (data) {
          if (parseInt(req.payload.updateType) == 2) {
            return resolve(data);
          } else {
            cartData = data;
            return resolve(data);
          }
        } else {
          return reply({
            message: req.i18n.__("bookings")["404"]
          }).code(404);
        }
      });
    });
  };
  const removeOldItem = newOrder => {
    return new Promise((resolve, reject) => {
      type = "Replace With New Item " + replaceObj.childProductId;

      cartModel.returnCartItem({
        createdBy: req.auth.credentials.sub,
        userId: req.auth.credentials._id.toString(),
        cartId: new ObjectID(orderDetails.cartId),
        childProductId: updateObj.childProductId,
        unitId: updateObj.unitId,
        addedToCartOn: updateObj.addedToCartOn,
        type: type,
        quantity: newquantity,
        customerName: "",
      }, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(orderDetails);
      })
    });
  };
  const readChildProducts = (itemId) => {
    return new Promise((resolve, reject) => {
      childProducts.getProductDetailsUnitId({
        _id: new ObjectID(req.payload.newItems.childProductId),
        unitId: req.payload.newItems.unitId
      }, (err, product) => {
        if (err) {
          reject({
            code: 500
          });
        }
        if (product) {
          productData = product;
        } else {
          reject({
            code: 404
          });
          productData = {};
        }
        resolve(productData);
      });
    });
  }

  const readStore = (itemId) => {
    return new Promise((resolve, reject) => {
      stores.isExistsWithId({
        _id: new ObjectID(productData.storeId.toString())
      }, (err, store) => {
        if (err) {
          reject({
            code: 500
          });
        }
        if (store) {
          storeData = store;

        } else {
          reject({
            code: 404
          });
          storeData = {};
        }

        resolve(store);
      });
    });
  }

  const readCustomer = (itemId) => {
    return new Promise((resolve, reject) => {
      customer.isExistsWithId({
        _id: new ObjectID(orderDetails.customerDetails.customerId)
      }, (err, customer) => {
        if (err) {
          reject({
            code: 500
          });
        }
        if (customer) {
          customerData = customer;
        } else {
          reject({
            code: 404
          });
          customerData = {};
        }
        // customerData = customer;
        resolve(customerData);
      });
    });
  }
  const cartUpdate = newOrder => {
    return new Promise((resolve, reject) => {
      if (Object.keys(orderDetails).length > 0) {


        switch (parseInt(req.payload.updateType)) {
          case 1:
            // return
            newquantity = parseInt(parseInt(updateObj.oldQuantity) - parseInt(updateObj.quantity));

            if (newquantity > 0) {
              type = "Return Partially"
              cartModel.updateCart(
                {
                  cartId: new ObjectID(orderDetails.cartId),
                  addedToCartOn: updateObj.addedToCartOn,
                  childProductId: updateObj.childProductId,
                  unitId: updateObj.unitId,
                  oldQuantity: updateObj.oldQuantity,
                  quantity: newquantity,
                  unitPrice: updateObj.unitPrice,
                  finalPrice: updateObj.finalPrice,
                  userId: req.auth.credentials._id.toString(),
                  customerName: "",
                  createdBy: req.auth.credentials.sub,
                  type: type
                },
                (err, res) => {
                  if (err) {
                    return reject(err);
                  }
                  return resolve(orderDetails);
                }
              );

            } else {

              if (cartData[0].products.length > 1) {
                type = "Return Completely"

                cartModel.returnCartItem({
                  createdBy: req.auth.credentials.sub,
                  userId: req.auth.credentials._id.toString(),
                  cartId: new ObjectID(orderDetails.cartId),
                  childProductId: updateObj.childProductId,
                  unitId: updateObj.unitId,
                  addedToCartOn: updateObj.addedToCartOn,
                  type: type,
                  quantity: newquantity,
                  customerName: "",
                }, (err, data) => {
                  if (err) {
                    return reject(err);
                  }
                  return resolve(orderDetails);
                })
              } else {

                return reply({
                  message: req.i18n.__("bookings")["405"]
                }).code(405);
              }

            }

            break;
          case 2:
            //replace
            removeOldItem()
              .then(readCustomer)
              .then(readChildProducts)
              .then(readStore)
              .then(readZone)
              .then(response => {

                if (storeData) {

                  for (let s = 0; s < productData.units.length; s++) {
                    productData.units[s].appliedDiscount = 0;
                    productData.units[s].offerId = "";
                    productData.units[s].offerName = "";
                    productData.units[s].title = productData.units[s].name[req.headers.language] ? productData.units[s].name[req.headers.language] : "";
                    productData.units[s].value = productData.units[s].price["en"] ? parseFloat(productData.units[s].price["en"]) : 0;
                    productData.units[s].finalPrice = productData.units[s].value ? parseFloat(productData.units[s].value) : 0;

                    delete productData.units[s].name;
                    delete productData.units[s].price;
                    delete productData.units[s].sizeAttributes;
                  }

                  if (productData.offer && productData.offer.length > 0) { // offers
                    for (let k = 0; k < productData.offer.length; k++) {
                      if (productData.offer[k].status == 1 && productData.offer[k].endDateTime > moment().unix() && moment().unix() > productData.offer[k].startDateTime) { //check status and expiry.
                        // if (productData.offer[k].status == 1) { //check status and expiry
                        productData.prefUnits = [];
                        logger.error(moment().unix());

                        for (let l = 0; l < productData.units.length; l++) {
                          let logic = 0;
                          if (productData.offer[k].discountType == 0) { // flat price
                            logic = parseFloat(productData.offer[k].discountValue)
                          } else {
                            logic = (productData.units[l].value / 100) * parseFloat(productData.offer[k].discountValue)
                          }
                          if (productData.offer[k].applicableOn == 1) { // if productData
                            for (let m = 0; m < productData.offer[k].unitid.length; m++) {
                              if (productData.units[l].unitId == productData.offer[k].unitid[m]) {
                                productData.prefUnits.push({
                                  title: productData.units[l].title,
                                  status: productData.units[l].status,
                                  value: productData.units[l].value,
                                  unitId: productData.units[l].unitId,
                                  appliedDiscount: logic,
                                  offerId: productData.offer[k].offerId ? productData.offer[k].offerId : "",
                                  offerName: productData.offer[k].offerName ? productData.offer[k].offerName : "",
                                  finalPrice: productData.units[l].value - (logic)
                                })
                              } else {
                                productData.prefUnits.push({
                                  title: productData.units[l].title,
                                  status: productData.units[l].status,
                                  value: productData.units[l].value,
                                  unitId: productData.units[l].unitId,
                                  appliedDiscount: 0,
                                  offerId: "",
                                  offerName: "",
                                  finalPrice: productData.units[l].value - 0
                                })
                              }
                            }
                          } else {
                            productData.prefUnits.push({
                              title: productData.units[l].title,
                              status: productData.units[l].status,
                              value: productData.units[l].value,
                              unitId: productData.units[l].unitId,
                              appliedDiscount: logic,
                              offerId: productData.offer[k].offerId ? productData.offer[k].offerId : "",
                              offerName: productData.offer[k].offerName ? productData.offer[k].offerName : "",
                              finalPrice: productData.units[l].value - logic
                            })
                          }
                        }
                      }
                    }
                  }
                  if (productData.prefUnits && productData.prefUnits.length > 0) {
                    productData.units = productData.prefUnits;
                  }

                  if (productData.addOns && productData.addOns.length > 0) {
                    var addOnsAvailableForProduct = 1
                  } else {
                    var addOnsAvailableForProduct = 0
                  }

                  for (let i = 0; i < productData.units.length; i++) {
                    if (String(productData.units[i].unitId) == String(req.payload.newItems.unitId)) {
                      req.payload.newItems.unitId = productData.units[i].unitId;
                      req.payload.newItems.unitName = productData.units[i].title;
                      req.payload.newItems.offerId = productData.units[i].offerId;
                      req.payload.newItems.offerName = productData.units[i].offerName;
                      req.payload.newItems.unitPrice = productData.units[i].value ? productData.units[i].value : 0;
                      req.payload.newItems.finalPrice = productData.units[i].finalPrice ? productData.units[i].finalPrice : 0;
                      req.payload.newItems.appliedDiscount = productData.units[i].appliedDiscount ? productData.units[i].appliedDiscount : 0;
                    }
                  }
                  // if (product) {
                  let taxes = productData.taxes ? productData.taxes.length > 0 ? productData.taxes : [] : [];

                  for (let i = 0; i < taxes.length; i++) {
                    taxes[i].price = ((req.payload.newItems.unitPrice * taxes[i].taxValue) / 100);
                  }

                  cartModel.isExistsWithCustomer({
                    userId: customerData._id.toString()
                  }, (err, data) => {

                    if (err) {
                      logger.error('Error occurred while checking cart : ' + err);
                      return reply({
                        message: req.i18n.__('genericErrMsg')['500']
                      }).code(500);
                    }
                    if (data) {

                      cartModel.isExistsWithItemCustomer({
                        cartId: orderDetails.cartId,
                        userId: customerData._id.toString(),
                        childProductId: req.payload.newItems.childProductId,
                        unitId: req.payload.newItems.unitId
                      }, (err, isItem) => {

                        if (err) {
                          logger.error('Error occurred while checking cart : ' + err);
                          return reply({
                            message: req.i18n.__('genericErrMsg')['500']
                          }).code(500);
                        }
                        if (isItem) {
                          if (storeType = 1) {

                            /*
                                @ If store type is 1 (resturant)
                                @ Check if cart has same addons 
                                @ If same addOns then increase the count else make a new entry
                            */

                            let addedItems = isItem.items;
                            let matchedItems = [];
                            let addOnsMatched = 0;
                            async.each(addedItems, (addedItem, callback) => {
                              if ("removedFromCartOn" in addedItem) {
                                // Do nothing
                              } else {
                                if (addedItem.addOns) {
                                  let checkAddOnsStatus = valiDateAddOns.compareAddOns(addedItem.addOns, addOnsData);
                                  if (valiDateAddOns.compareAddOns(addedItem.addOns, addOnsData)) {

                                    addOnsMatched = 1;
                                    /*
                                    Increase the count
                                    */
                                    cartModel.updateQuantity({
                                      cartId: isItem._id,
                                      childProductId: req.payload.newItems.childProductId,
                                      unitId: req.payload.newItems.unitId,
                                      quantity: 1,
                                      userId: customerData._id.toString(),
                                      customerName: "",
                                      createdBy: req.auth.credentials.sub,
                                      addedToCartOn: addedItem.addedToCartOn,
                                    }, (err, res) => {

                                      if (err) {
                                        return reply({
                                          message: req.i18n.__('genericErrMsg')['500']
                                        }).code(500);
                                      } else {
                                        return resolve(true)
                                      }

                                    });
                                    // break;
                                    // next('unique!');

                                  }
                                }

                              }
                            })
                            if (addOnsMatched == 0) {
                              /*
                               add new product 
                              */

                              cartModel.pushItemToCustomerCart({
                                cartId: orderDetails.cartId,
                                catName: productData.catName ? productData.catName[req.headers.language] : "",
                                subCatName: productData.subCatName ? productData.subCatName[req.headers.language] : "",
                                subSubCatName: productData.subSubCatName ? productData.subSubCatName[req.headers.language] : "",
                                mileageMetric: zoneData.mileageMetric,
                                currencySymbol: storeData.currencySymbol ? storeData.currencySymbol : zoneData.currencySymbol,
                                currency: storeData.currency ? storeData.currency : zoneData.currency,
                                userId: customerData._id.toString(),
                                customerName: customerData.name,
                                city: zoneData.city,
                                cityId: storeData.cityId,
                                childProductId: req.payload.newItems.childProductId,
                                unitId: req.payload.newItems.unitId,
                                unitName: req.payload.newItems.unitName,
                                addedToCartOn: addedToCartOn,
                                parentProductId: productData.parentProductId,
                                storeId: storeData._id.toString(),
                                storeName: storeData.sName[req.headers.language],
                                storeAddress: storeData.storeAddr ? storeData.storeAddr : "",
                                storeLogo: storeData.profileLogos ? storeData.profileLogos.logoImage : "",
                                storePhone: storeData.bcountryCode ? storeData.bcountryCode + storeData.businessNumber : "",
                                sku: productData.sku,
                                itemName: productData.productname[req.headers.language],
                                upc: productData.upc,
                                itemImageURL: productData.images && productData.images.length > 0 ? productData.images[0]['image'] : '',
                                // quantity: req.payload.newItems.quantity,
                                quantity: 1,
                                unitPrice: req.payload.newItems.unitPrice,
                                coordinates: {
                                  longitude: parseFloat(storeData.coordinates.longitude || 0.0),
                                  latitude: parseFloat(storeData.coordinates.latitude || 0.0)
                                },
                                createdBy: req.auth.credentials.sub,
                                finalPrice: req.payload.newItems.finalPrice,
                                appliedDiscount: req.payload.newItems.appliedDiscount,
                                offerId: req.payload.newItems.offerId ? req.payload.newItems.offerId : 0,
                                taxes: taxes,
                                customerEmail: customerData.email,
                                customerPhone: customerData.phone,
                                addOns: addOnsDataToCart || [],
                                addOnsAdded: addOnFlag || 0,
                                addOnsAvailableForProduct: addOnsAvailableForProduct || []
                              }, (err, res) => {

                                if (err) {
                                  logger.error('Error occurred while adding to cart : ' + err);
                                  return reply({
                                    message: req.i18n.__('genericErrMsg')['500']
                                  }).code(500);
                                } else {
                                  childProducts.pushToCart({
                                    userId: customerData._id.toString(),
                                    childProductId: req.payload.newItems.childProductId,
                                    unitId: req.payload.newItems.unitId,
                                    createdBy: req.auth.credentials.sub
                                  }, (err, data) => {
                                  });


                                  return resolve(true)



                                }
                              });
                            }
                          } else {
                            return reply({
                              message: req.i18n.__('cart')['412']
                            }).code(412);
                          }
                        } else {

                          cartModel.pushItemToCustomerCart({
                            cartId: orderDetails.cartId,
                            catName: productData.catName ? productData.catName[req.headers.language] : "",
                            subCatName: productData.subCatName ? productData.subCatName[req.headers.language] : "",
                            subSubCatName: productData.subSubCatName ? productData.subSubCatName[req.headers.language] : "",
                            mileageMetric: zoneData.mileageMetric,
                            currencySymbol: storeData.currencySymbol ? storeData.currencySymbol : zoneData.currencySymbol,
                            currency: storeData.currency ? storeData.currency : zoneData.currency,
                            userId: customerData._id.toString(),
                            customerName: customerData.name,
                            city: zoneData.city,
                            cityId: storeData.cityId,
                            childProductId: req.payload.newItems.childProductId,
                            unitId: req.payload.newItems.unitId,
                            unitName: req.payload.newItems.unitName,
                            addedToCartOn: addedToCartOn,
                            parentProductId: productData.parentProductId,
                            storeId: storeData._id.toString(),
                            storeName: storeData.sName[req.headers.language],
                            storeAddress: storeData.storeAddr ? storeData.storeAddr : "",
                            storeLogo: storeData.profileLogos ? storeData.profileLogos.logoImage : "",
                            storePhone: storeData.bcountryCode ? storeData.bcountryCode + storeData.businessNumber : "",
                            sku: productData.sku,
                            itemName: productData.productname[req.headers.language],
                            upc: productData.upc,
                            itemImageURL: productData.images && productData.images.length > 0 ? productData.images[0]['image'] : '',
                            quantity: req.payload.newItems.quantity,
                            unitPrice: req.payload.newItems.unitPrice,
                            coordinates: {
                              longitude: parseFloat(storeData.coordinates.longitude || 0.0),
                              latitude: parseFloat(storeData.coordinates.latitude || 0.0)
                            },
                            createdBy: req.auth.credentials.sub,
                            finalPrice: req.payload.newItems.finalPrice,
                            appliedDiscount: req.payload.newItems.appliedDiscount,
                            offerId: req.payload.newItems.offerId ? req.payload.newItems.offerId : 0,
                            taxes: taxes,
                            customerEmail: customerData.email,
                            customerPhone: customerData.phone,
                            addOns: addOnsDataToCart,
                            addOnsAdded: addOnFlag,
                            addOnsAvailableForProduct: addOnsAvailableForProduct
                          }, (err, res) => {

                            if (err) {
                              logger.error('Error occurred while adding to cart : ' + err);
                              return reply({
                                message: req.i18n.__('genericErrMsg')['500']
                              }).code(500);
                            } else {
                              childProducts.pushToCart({
                                userId: customerData._id.toString(),
                                childProductId: req.payload.newItems.childProductId,
                                unitId: req.payload.newItems.unitId,
                                createdBy: req.auth.credentials.sub
                              }, (err, data) => { });

                              return resolve(true)

                            }
                          });
                        }
                      });
                    } else {
                      return reply({
                        message: req.i18n.__('getData')['404']
                      }).code(404);
                    }
                  });
                } else {
                  return reply({
                    message: req.i18n.__('getData')['404']
                  }).code(404);
                }
              })
              .catch(err => {
                logger.error("fdsafsadfadsf : ", err);
                reject({ code: 500 });
              });
            break;
          case 3:
            if (cartData[0].products.length > 1) {
              type = "Cancle Item By Driver";

              cartModel.returnCartItem({
                createdBy: req.auth.credentials.sub,
                userId: req.auth.credentials._id.toString(),
                cartId: new ObjectID(orderDetails.cartId),
                childProductId: updateObj.childProductId,
                unitId: updateObj.unitId,
                addedToCartOn: updateObj.addedToCartOn,
                type: type,
                quantity: newquantity,
                customerName: "",
              }, (err, data) => {
                if (err) {
                  return reject(err);
                }
                return resolve(orderDetails);
              })
            } else {
              return reply({
                message: req.i18n.__("bookings")["405"]
              }).code(405);
            }

            break;
        }
      } else {

        return reply({
          message: req.i18n.__("bookings")["404"]
        }).code(404);
      }
    });
  };
  const getUpdatedCart = newOrder => {
    return new Promise((resolve, reject) => {
      cartModel.getByCartId({ cartId: orderDetails.cartId, storeId: orderDetails.storeId }, (err, data) => {
        if (err) {
          logger.error("error while get cart in update " + JSON.stringify(err));
          return reject({ code: 500 });
        } else if (data.length > 0) {
          item = data[0];
          let incTax = {};
          let excTax = {};
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
                item.inclTax += item.products[k].taxes[l].price;
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
                if (typeof item.products[k].taxes[l].price != "undefined") {
                  item.exclTaxStore += parseFloat(
                    parseFloat(item.products[k].taxes[l].price * item.products[k].quantity).toFixed(2)
                  );
                  item.exclTax += parseFloat(
                    parseFloat(item.products[k].taxes[l].price * item.products[k].quantity).toFixed(2)
                  );
                }
                // item.exclTaxStore = parseFloat(exclTaxStore);
                // item.exclTax = parseFloat(exclTax);
                // item.storeTotalPriceWithExcTaxes = parseFloat(item.exclTaxStore) + parseFloat(item.storeTotalPrice)
              }
            }
          }
          return resolve(orderDetails);
        } else {
          return reply({
            message: req.i18n.__("bookings")["404"]
          }).code(404);
        }
      });
    });
  };

  const reCalculationForTotalAmount = () => {
    return new Promise((resolve, reject) => {
      if (Object.keys(item).length > 0) {
        req.payload.createdBy = req.auth.credentials.sub;
        req.payload.driverId = req.auth.credentials._id.toString();

        let excTot = 0;
        item.exclusiveTaxes = item.exclusiveTaxes ? item.exclusiveTaxes : [];

        for (let i = 0; i < item.exclusiveTaxes.length; i++) {
          excTot += item.exclusiveTaxes[i].price ? parseFloat(item.exclusiveTaxes[i].price) : 0;
        }
        req.payload.cartTotal = parseFloat(item.cartTotal);
        req.payload.cartDiscount = parseFloat(item.cartDiscount);
        req.payload.excTax = excTot ? excTot : 0;
        req.payload.subTotalAmount = parseFloat(
          parseFloat(parseFloat(item.storeTotalPrice) + parseFloat(item.sTotalPrice)).toFixed(2)
        );
        req.payload.exclusiveTaxes = item.exclusiveTaxes,
          // req.payload.subTotalAmountWithExcTax = item.storeTotalPriceWithExcTaxes,
          req.payload.subTotalAmountWithExcTax = parseFloat(
            parseFloat(parseFloat(item.storeTotalPrice) + parseFloat(item.sTotalPrice)).toFixed(2)
          );
        req.payload.deliveryCharge = parseFloat(item.storeDeliveryFee);
        req.payload.deliveryFee = parseFloat(item.storeDeliveryFee);

        req.payload.totalAmount =
          req.payload.subTotalAmountWithExcTax +
          req.payload.excTax +
          (req.payload.deliveryCharge ? req.payload.deliveryCharge : 0) -
          (orderDetails.discount || 0);
        req.payload.items = item.products;
        resolve(orderDetails);
      } else {
        return reply({
          message: req.i18n.__("bookings")["404"]
        }).code(404);
      }

    });
  }

  let chargeCustomerBaseOnPaymentType = () => {
    let amountToCharge = parseFloat(parseFloat(req.payload.totalAmount - orderDetails.totalAmount).toFixed(2)),
      cashCollect = 0,
      cardDeduct = 0,
      pgCommission = 0,
      walletTrans = 0,
      releaseAmount = 0,
      refundAmount = 0;
    console.log("amountToCharge", amountToCharge)
    const getCustomer = () => {
      return new Promise((resolve, reject) => {
        console.log("customerData.wallet", customerData.wallet)
        if (orderDetails.payByWallet == 1 && amountToCharge > 0) {
          console.log("Wallet Charge")
          if (customerData.wallet.balance > 0) {
            walletTrans = (customerData.wallet.balance < amountToCharge) ? customerData.wallet.balance : amountToCharge;
            customer.blockWalletBalance(
              {
                // wallet bal block
                userId: orderDetails.customerDetails.customerId.toString(),
                createdBy: "UpdateOrder",
                amount: walletTrans
              }, (err, data) => {
                amountToCharge = amountToCharge - walletTrans;
                resolve(true);
              });
          } else {
            resolve(true);
          }
        } else if (orderDetails.payByWallet == 1 && amountToCharge < 0) {
          console.log("Wallet Block")
          releaseAmount = Math.abs(amountToCharge);
          if (customerData.wallet.blocked > releaseAmount) {
            walletTrans = (customerData.wallet.blocked < releaseAmount) ? customerData.wallet.blocked : releaseAmount;
            customer.releaseBlockWalletBalance(
              {
                // wallet bal Release
                userId: orderDetails.customerDetails.customerId.toString(),
                createdBy: "UpdateOrder",
                amount: walletTrans
              }, (err, data) => {
                amountToCharge = amountToCharge + walletTrans;
                walletTrans = (releaseAmount * -1);
                resolve(true);
              });
          } else {
            resolve(true);
          }
        } else {
          resolve(true);
        }
      });
    };

    const chargeCustomer = () => {
      return new Promise((resolve, reject) => {
        if (orderDetails.paymentType == 1 && amountToCharge > 0) {
          console.log("Card Charge")
          pgCommission = parseFloat(parseFloat((amountToCharge * (2.9 / 100)) + 0.3).toFixed(2));
          stripeTransaction.createAndCaptureCharge(
            req,
            orderDetails.customerDetails.customerId.toString(),
            orderDetails.cardId,
            amountToCharge,
            orderDetails.currency,
            'orderId - ' + orderDetails.orderId, {
            customerId: orderDetails.customerDetails.customerId.toString(),
            orderId: orderDetails.orderId,
            customerName: orderDetails.customerDetails.name,
            customerPhone: orderDetails.customerDetails.mobile
          }
          ).then(res => {
            cardDeduct = amountToCharge;
            amountToCharge = amountToCharge - cardDeduct;
            resolve(true);
          }).catch(err => {
            pgCommission = 0;
            resolve(true);
          });
        } else if (orderDetails.paymentType == 1 && orderDetails.stripeCharge && amountToCharge < 0) {
          refundAmount = Math.abs(amountToCharge);
          console.log("Card Refund")
          //synchronous stripe code
          stripeTransaction
            .refundCharge(
              orderDetails.stripeCharge.id,
              refundAmount,
              req
            )
            .then(data => {
              req.payload.refundCharge = data;
              cardDeduct = (refundAmount * -1);
              amountToCharge = amountToCharge + refundAmount;
              return resolve(true);
            })
            .catch(e => {
              logger.warn("error while refund" + e);
              return reject({ code: 400, message: e });
              // return resolve(orderDetails);
            });
        } else if (orderDetails.paymentType == 2) {
          console.log("Cash Entry")
          cashCollect = amountToCharge;
          amountToCharge = amountToCharge - cashCollect;
          resolve(true);
        } else {
          resolve(true);
        }
      });
    };
    return new Promise((resolve, reject) => {
      getCustomer()
        .then(chargeCustomer)
        .then(() => {
          // if (amountToCharge > 0) {
          //   // if (amountToCharge > 0 && orderDetails.paymentType != 2) {
          //   amountToCharge = amountToCharge - orderDetails.invoice.lastDue;
          //   orderDetails.invoice.lastDue = 0;
          //   let data = {
          //     bookingId: orderDetails.bookingId,
          //     userId: orderDetails.customerDetails.customerId.toString(),
          //     amount: amountToCharge,
          //     userType: 1,
          //     currency: orderDetails.invoice.currency,
          //     currencySymbol: orderDetails.invoice.currencySbl,
          //     serviceTypeText: orderDetails.serviceTypeText,
          //     bookingTypeText: orderDetails.bookingTypeText,
          //     paymentTypeText: orderDetails.paymentTypeText,
          //     cityName: orderDetails.cityName
          //   }
          //   transcation.captureAmountFromWallet(data, (err, res) => { });
          //   walletTrans = walletTrans + amountToCharge;
          // }

          // dataToUpdate['invoice.cashCollected'] = parseFloat(cashCollect).toFixed(2);
          // dataToUpdate['invoice.cardDeduct'] = parseFloat(cardDeduct).toFixed(2);
          // dataToUpdate['invoice.pgCommission'] = parseFloat(parseFloat(pgCommission).toFixed(2));
          // dataToUpdate['invoice.walletTransaction'] = parseFloat(walletTrans).toFixed(2);

          // dataToUpdate['invoice.dues'] = parseFloat(dataToUpdate['invoice.masEarning']) - parseFloat(dataToUpdate['invoice.cashCollected']);
          console.log("cashCollect", cashCollect)
          console.log("walletTrans", walletTrans)
          console.log("cardDeduct", cardDeduct)
          console.log("pgCommission", pgCommission)
          let paidBy = {
            cash: orderDetails.paidBy.cash + cashCollect,
            wallet: orderDetails.paidBy.wallet + walletTrans,
            card: orderDetails.paidBy.card + cardDeduct,
            cardChargeId: orderDetails.paidBy.cardChargeId
          }
          req.payload.paidBy = paidBy;
          console.log("req.payload.paidBy", req.payload.paidBy)
          resolve(true);
        })
    });
  }
  readNewOrder()
    .then(readUnassignOrder)
    .then(readAssignOrder)
    .then(readPickedupOrder)
    .then(getCart)
    .then(cartUpdate)
    .then(getUpdatedCart)
    .then(reCalculationForTotalAmount)
    .then(chargeCustomerBaseOnPaymentType)
    .then(data => {
      modelName.returnPatchOrder(req.payload, (err, res) => {
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
    })
    .catch(e => {
      logger.error("Error occurred update order " + req.auth.credentials.sub + " (catch): ", e);
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
          orderPlacedDate: moment(moment.unix(data.bookingDateTimeStamp).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A')),
          addressLine1: data.drop ? data.drop.addressLine1 : "",
          dropAddressLine1: data.drop ? data.drop.addressLine1 : "",
          dropAddressLine2: data.drop ? data.drop.addressLine2 : "",
          addressLine2: data.drop ? data.drop.addressLine2 : "",
          country: data.drop ? data.drop.country : "",
          orderCreationDate: moment(moment.unix(data.bookingDateTimeStamp).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A')),
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
  items: Joi.object({
    addedToCartOn: Joi.number().required().description('id is required'),
    childProductId: Joi.string().required().description('id is required'),
    unitId: Joi.string().required().description('id is required'),
    unitPrice: Joi.number().required().description('id is required'),
    appliedDiscount: Joi.number().required().description('id is required'),
    finalPrice: Joi.number().required().description('id is required'),
    quantity: Joi.number().required().description('id is required'),
    oldQuantity: Joi.number().required().description('id is required'),
  }).required(),
  newItems: Joi.object({
    addedToCartOn: Joi.number().description('id is required'),
    childProductId: Joi.string().description('id is required'),
    unitId: Joi.string().description('id is required'),
    unitPrice: Joi.number().description('id is required'),
    appliedDiscount: Joi.number().description('id is required'),
    finalPrice: Joi.number().description('id is required'),
    quantity: Joi.number().description('id is required'),
    oldQuantity: Joi.number().description('id is required'),
  }),
  updateType: Joi.string().required().min(1).max(3).description("status 1:return, 2: Replace, 3: Cancle Item").allow(""),
  extraNote: Joi.string().description("extraNote").allow(""),
  ipAddress: Joi.string().description("Ip Address"),
  orderId: Joi.number().required().description("orderId "),
  deliveryCharge: Joi.number().required().description("delivery Fee of store"),
  latitude: Joi.number().description("Latitude is required").default(13.0195677),
  longitude: Joi.number().description("Longitude is required").default(77.5968131)
};
/**
 * A module that exports customer update order!
 * @exports validator
 * @exports handler
 */
module.exports = { handler, validator };
