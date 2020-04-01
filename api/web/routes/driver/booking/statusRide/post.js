"use strict";

const Joi = require("joi");
const logger = require("winston");
const moment = require("moment-timezone");
const async = require("async");
const ObjectID = require("mongodb").ObjectID;
const webSocket = require("../../../../../library/websocket/websocket");
let bookingsUnassigned = require("../../../../../models/bookingsUnassigned");
const storeManagers = require("../../../../../models/storeManagers");
const campaignAndreferral = require("../../../campaignAndreferral/promoCode/post");
const bookingAnalytics = require("../../../../../models/bookingAnalytics");
const validatePromoCampaign = require("../../../campaignAndreferral/validatePromoCampaign/post");
let stores = require("../../../../../models/stores");
const city = require("../../../../../models/promoCampaigns/city");
const providerErrorMsg = require("../../../../../locales");
let bookingsAssigned = require("../../../../../models/bookingsAssigned");
let bookingsPast = require("../../../../../models/bookingsPast");
let locationLogs = require("../../../../../models/locationLogs");
let provider = require("../../../../../models/driver");
let childProducts = require("../../../../../models/childProducts");
let storeFirstCategory = require("../../../../../models/storeFirstCategory");
let PythonOffersTest = require("../../../../../models/PythonOffersTest");
let customer = require("../../../../../models/customer");
const redis = require("../../../../../library/redis");
const googleApi = require("../../../../commonModels/googleApi");
var notifyi = require("../../../../../library/mqttModule/mqtt");
var notifications = require("../../../../../library/fcm");
const configuration = require("../../../../../configuration");
const orderAnalytics = require("../../../../commonModels/orderAnalytics");
const request = require("superagent");
var config = process.env;
const distanceMtx = require("google-distance-matrix");
var managerTopics = require("../../../../commonModels/managerTopics");
distanceMtx.key(configuration.GOOGLE_API_KEY);
distanceMtx.units("imperial");
const accounting = require("../../../../commonModels/accounting/accounting");
const wallet = require("../../../../commonModels/wallet/wallet");
const stripeTransaction = require("../../../../commonModels/stripe/stripeTransaction");
const email = require('../../../../commonModels/email/email');

/** salesforce
 * @library
 * @author Umesh Beti
 */
const superagent = require("superagent");
const sf = require("../../../../../library/salesforce");
/*salesforce*/
let client = redis.client;
let objectToPush = {};
//10- on the way 11- Arrived,12- Delivery started,13- reached at location , 14- completed ,15- done,

const payload = Joi.object({
  orderId: Joi.number()
    .integer()
    .required()
    .description("booking id"),
  status: Joi.number()
    .integer()
    .allow([10, 11, 12, 13, 14, 15, 26, 27, 28])
    .required()
    .description(
      "10 - On the Way,<br/> 11 - Arrived,<br/> 12 - Journey Started,<br/> 13- reached at location , <br/>14- completed, <br/> 15-done,<br/> 26-Arrived at pickup & Picked Laundry, <br/> 27- Arrived at laundromat,<br/> 28 - Dropped at laundromat"
    ),
  // status: Joi.number().integer().min(11).max(15).required().description('10 - On the Way,<br/> 11 - Arrived,<br/> 12 - Journey Started,<br/> 13- reached at location , <br/>14- completed, <br/> 15-done'),
  lat: Joi.number()
    .required()
    .description("latitude"),
  long: Joi.number()
    .required()
    .description("longitude"),
  distance: Joi.number()
    .optional()
    .default(0)
    .description("Distance in meters only if staus is 15"),
  time: Joi.string()
    .optional()
    .description("time"),
  // time: Joi.number().optional().default(0).description('Distance in meters only if staus is 15'),
  signatureUrl: Joi.string().description(" signature url"),
  rating: Joi.number().description("rating"),
  review: Joi.string().description("string"),
  // tip: Joi.number().description('tip'),
  receiverName: Joi.string().description("receiver name"),
  receiverPhone: Joi.string().description("receiver phone"),
  weight: Joi.number()
    .optional()
    .description("weight"),
  storeId: Joi.string()
    .optional()
    .allow("")
    .description("storeId")
}).required();

const APIHandler = (req, reply) => {
  /*salesforce */
  let OdData = req.payload;
  /*salesforce */
  const dbErrResponse = { message: req.i18n.__("genericErrMsg")["500"], code: 500 };
  let condition = {
    orderId: req.payload.orderId,
    driverId: new ObjectID(req.auth.credentials._id.toString())
  };

  let statusArr = [8, 10, 11, 12, 13, 14, 15, 26, 27, 28];
  let bookingData = {};
  let customerData = {};
  let masterData = {};
  let storeData = {};
  var statusMsg;
  var statusText;
  let dataToUpdate = {};
  let laundryDetails = [];
  let cityDetails = [];
  let laundryFee = 0;
  let taxApplicable = false;
  let timeStamp = moment().unix();
  let appEarningValue = 0;
  let firstCategoryId = 0;
  let iso = new Date();
  
  let productCommissionValue = 0;
  
  let categoryCommissionValue = 0;


  let checkBooking = () => {
    return new Promise((resolve, reject) => {
      bookingsAssigned.SelectOne(condition, function (err, bookingDataDB) {
        if (err) {
          reject(dbErrResponse);
        } else if (bookingDataDB) {
          bookingData = bookingDataDB;
          switch (parseInt(req.payload.status)) {
            case 10:
              if (bookingData.storeType == 5) {
                statusMsg = "Driver enroute to customer location.";
                statusText =
                  bookingData.driverDetails.fName +
                  " " +
                  bookingData.driverDetails.lName +
                  " is on the his way to the " +
                  bookingData.storeName;
              } else if (bookingData.storeType == 7) {
                statusMsg = "Driver enroute to pickup  location.";
                statusText = "Driver enroute to pickup  location.";

              } else {
                statusMsg = req.i18n.__(req.i18n.__('bookingStatusTitle')['10']);
                statusText =
                  bookingData.driverDetails.fName +
                  " " +
                  bookingData.driverDetails.lName +
                  " is on the his way to the " +
                  bookingData.storeName;
              }

              break;
            case 11:
              if (bookingData.storeType == 7) {
                statusMsg = "Driver at pickup location .";
                statusText = "Driver at pickup location.";
              } else {
                statusMsg = req.i18n.__(req.i18n.__('bookingStatusTitle')['11']);;
                statusText =
                  bookingData.driverDetails.fName +
                  " " +
                  bookingData.driverDetails.lName +
                  " has reached the " +
                  bookingData.storeName;
              }


              break;
            case 12:
              statusMsg = req.i18n.__(req.i18n.__('bookingStatusTitle')['12']);;
              statusText =
                bookingData.driverDetails.fName +
                " " +
                bookingData.driverDetails.lName +
                " has picked up orderes & is on the way to customer";
              break;
            case 13:
              statusMsg = req.i18n.__(req.i18n.__('bookingStatusTitle')['13']);;
              statusText =
                bookingData.driverDetails.fName +
                " " +
                bookingData.driverDetails.lName +
                " has reached the customer location.";
              break;
            case 14:
              statusMsg = req.i18n.__(req.i18n.__('bookingStatusTitle')['14']);;
              statusText = req.i18n.__(req.i18n.__('bookingStatusTitle')['14']);;
              break;
            case 15:
              statusMsg = req.i18n.__(req.i18n.__('bookingStatusTitle')['15']);;
              statusText = req.i18n.__(req.i18n.__('bookingStatusTitle')['15']);;
              break;
            case 26:
              statusMsg = req.i18n.__(req.i18n.__('bookingStatusTitle')['26']);;
              statusText = req.i18n.__(req.i18n.__('bookingStatusTitle')['26']);;
              break;
            case 27:
              statusMsg = req.i18n.__(req.i18n.__('bookingStatusTitle')['27']);
              statusText = req.i18n.__(req.i18n.__('bookingStatusTitle')['27']);
              break;
            case 28:
              statusMsg = req.i18n.__(req.i18n.__('bookingStatusTitle')['28']);;
              statusText = req.i18n.__(req.i18n.__('bookingStatusTitle')['28']);;
              break;
            case 29:
              statusMsg = ""
              break;
            default:
              break;
          }
          dataToUpdate["status"] = parseInt(req.payload.status);
          dataToUpdate["statusMsg"] = statusMsg;
          dataToUpdate["statusText"] = statusText;

          var status = bookingData.status;

          var ind = statusArr.indexOf(parseInt(status));

          var indPos = statusArr.indexOf(parseInt(req.payload.status));
          if (bookingData.storeType == 5) {
            resolve(true);
          } else if (parseInt(bookingData.driverType) == 2) {
            resolve(true);
          } else {
            if (indPos - 1 == ind) {
              resolve(true);
            } else {
              reject({ message: req.i18n.__("postStatusRide")["400"], code: 400 });
            }
          }
        } else {
          reject({ message: req.i18n.__("postStatusRide")["404"], code: 404 });
        }
      });
    });
  };
  let getCustomerData = () => {
    return new Promise((resolve, reject) => {
      customer.getOne(
        { _id: bookingData.customerDetails ? new ObjectID(bookingData.customerDetails.customerId) : "" },
        function (err, customer) {
          if (err) {
            reject(dbErrResponse);
          } else if (customer) {
            customerData = customer;
            resolve(true);
          } else {
            logger.error("customer not found ");
            reject({ message: req.i18n.__("postStatusRide")["404"], code: 404 });
          }
        }
      );
    });
  };
  let getMasterData = () => {
    return new Promise((resolve, reject) => {
      var aggregationQuery = [
        { $match: { _id: new ObjectID(req.auth.credentials._id) } },
        {
          $lookup: {
            from: "Driver_plans",
            localField: "planID",
            foreignField: "_id",
            as: "DriverPlan"
          }
        }
      ];
      provider.AGGREGATE(aggregationQuery, function (err, masterDataDB) {
        if (err) {
          reject(dbErrResponse);
        } else if (masterDataDB.length > 0) {
          masterData = masterDataDB[0];
          masterData.name = masterData.firstName + " " + masterData.lastName;
          masterData.DriverPlan = masterData.DriverPlan;
          masterData.referralUsed = masterData.referralUsed || "";

          masterData["currentBookings"] =
            typeof masterData.currentBookings != "undefined"
              ? masterData.currentBookings
              : [{ bid: req.payload.orderId }];
          resolve(true);
        } else {
          reject({ message: req.i18n.__("postStatusRide")["404"], code: 404 });
        }
      });
    });
  };

  let updateJourneyComplete = () => {
    return new Promise((resolve, reject) => {
      if (bookingData.storeType == 5) {
        resolve(true);
      }
      dataToUpdate["timeStamp.journeyComplete"] = timeStamp;

      let subTotalCalc = 0,
        subTotal = 0,
        total = 0,
        appComPer = 20,
        appCom = 0,
        masEarning = 0,
        waitingTimeCalc = 0,
        waitingTime = 0,
        waitingTimeFare = 0,
        tripTimeCalc = 0,
        tripTime = 0,
        tripTimeFare = 0,
        tripDistanceCalc = 0,
        tripDistance = 0,
        tripDistanceFare = 0,
        discountType = 0,
        maxDiscount = 0,
        discount = 0;

      if (Array.isArray(masterData.DriverPlan)) {
        if (masterData.DriverPlan.length > 0) {
          appComPer = masterData.DriverPlan[0].appCommissionValue || 20;
        }
      }

      waitingTimeCalc = Math.ceil(
        (bookingData.timeStamp.journeyStart.timeStamp - bookingData.timeStamp.reached.timeStamp) / 60
      );
      if (bookingData.driverType == 2) {
        dataToUpdate["driverJourney.storeToJourneyStart"] = Math.ceil(
          (bookingData.timeStamp.journeyStart.timeStamp - bookingData.timeStamp.accepted.timeStamp) / 60
        );
        dataToUpdate["driverJourney.OnTheWayToStore"] = 0;
      } else {
        dataToUpdate["driverJourney.OnTheWayToStore"] = Math.ceil(
          (bookingData.timeStamp.arrived.timeStamp - bookingData.timeStamp.onTheWay.timeStamp) / 60
        );

        dataToUpdate["driverJourney.storeToJourneyStart"] = Math.ceil(
          (bookingData.timeStamp.journeyStart.timeStamp - bookingData.timeStamp.arrived.timeStamp) / 60
        );
      }


      dataToUpdate["driverJourney.journeyStartToDrop"] = Math.ceil(
        (timeStamp - bookingData.timeStamp.journeyStart.timeStamp) / 60
      );
      var origins = [bookingData.pickupLocation.latitude + "," + bookingData.pickupLocation.longitude];
      var destinations = [dataToUpdate["dropLocation.latitude"] + "," + dataToUpdate["dropLocation.longitude"]];

      googleApi
        .calculateDistance(origins, destinations, [], [])
        .then(data => {
          let driverDist = req.payload.distance || 0;
          tripDistanceCalc = data;
          dataToUpdate["accouting.cartTotalWithoutOfferPrice"] = bookingData.cartTotal;
          dataToUpdate["accouting.total"] = bookingData.totalAmount;
          dataToUpdate["accouting.deliveryCharge"] = bookingData.deliveryCharge;
          dataToUpdate["accouting.subTotal"] = bookingData.subTotalAmountWithExcTax;
          dataToUpdate["accouting.excTax"] = bookingData.excTax;
          dataToUpdate["accouting.storeCommPer"] = bookingData.storeCommission; //yun
          dataToUpdate["accouting.storeCommissionType"] = bookingData.storeCommissionType;
          dataToUpdate["accouting.storeCommissionTypeMsg"] = bookingData.storeCommissionTypeMsg; //yun
          dataToUpdate["accouting.driverCommPer"] = masterData.DriverPlan[0]
            ? masterData.DriverPlan[0].appCommissionValue
            : 0;
          dataToUpdate["accouting.driverCommType"] = masterData.DriverPlan[0]
            ? masterData.DriverPlan[0].commissionType
            : 1;
          dataToUpdate["accouting.driverCommTypeMsg"] = masterData.DriverPlan[0]
            ? masterData.DriverPlan[0].commissionTypeMsg
            : "";
          dataToUpdate["accouting.distanceDriver"] = driverDist;
          dataToUpdate["accouting.discount"] = bookingData.discount;
          dataToUpdate["accouting.promoCodeDiscount"] = bookingData.discount;
          dataToUpdate["accouting.driverType"] = masterData.driverType;
          dataToUpdate["accouting.driverTypeMsg"] = masterData.driverType == 2 ? "Store" : "Freelancer";
          resolve(true);
        })
        .catch(err => {
          reject({ message: req.i18n.__("postStatusRide")["402"], code: 402 });
        });
    });
  };


    let chargeCustomer = () => {

        let gatewayCommision = 0;
        if (bookingData.paymentType == 1) gatewayCommision = dataToUpdate["accouting.total"] * (2.9 / 100) + 0.3; //0.3

        dataToUpdate["accouting.cashCollected"] = dataToUpdate["accouting.total"];
        dataToUpdate["accouting.pgComm"] = gatewayCommision; //yun
        dataToUpdate["accouting.pgCommName"] = "stripe";
        // dataToUpdate['accouting.pgComm'] = 0;//yun
        dataToUpdate["accouting.tollFee"] = 0;
        dataToUpdate["accouting.handlingFee"] = 0;
        dataToUpdate["accouting.appProfitLoss"] = 0;

        let promiseArray=[];
        
        //let bookingData = pickedUpOrder[3];
        //console.log("bookingData", bookingData);
        //Calculating Start
        
        console.log("Calculation start!");

        let calcComm = (item) => {
            let calcPro = () => {
                return new Promise((resolve, reject)=>{ 
                    console.log("Calc Products");
                    console.log('bookingData.storeId',bookingData.storeId);
                childProducts.getOne(
                    {_id:new ObjectID(item.childProductId)},
                    (err, itemData)=>{
                        console.log("childProducts ended");
                        if(err){
                            return reject(dbErrResponse);
                        }else if (itemData){
                            //console.log("ProductInfo",itemData);
                            firstCategoryId = itemData.firstCategoryId;
                            if(itemData.commissionEnable!=undefined){
                                if(itemData.commissionEnable=='1' || itemData.commissionEnable==1){
                                    //console.log("product name", itemData.commissionValue);
                                    console.log("++++++++++++++++++++++");
                                    console.log("product commission value", itemData.commissionValue);
                                    console.log("item quantity", item.quantity);
                                    console.log("item price", item.unitPrice);
                                    appEarningValue = appEarningValue+parseInt(itemData.commissionValue)/100*item.quantity*item.unitPrice;
                                    console.log("appEarningProduct", appEarningValue);
                                    console.log("++++++++++++++++++++");
                                    return resolve( firstCategoryId);
                                }else{
                                    return resolve(0);
                                }     
                                
                            }else{
                                return resolve(0);
                            }
                            
                        }else{
                            return resolve(0);
                        }
                    }
                );
                });
            };
            let calcCat = (value)=>{
                return new Promise((resolve, reject)=>{ 
                    if(value!=0){
                        return resolve(true);
                    }else{
                        console.log("Calc Category",firstCategoryId);
                        
                        storeFirstCategory.SelectOne(
                            {_id: new ObjectID(firstCategoryId)},
                            (err,storeCategoryData)=>{
                                console.log("storeCategory ended");
                                if(err){
                                    return reject(dbErrResponse);
                                }else if (storeCategoryData){
                                    //console.log("CategoryInfo",storeCategoryData);
                                    if(storeCategoryData.commissionEnable!=undefined){
                                        if(storeCategoryData.commissionEnable=='1' || storeCategoryData.commissionEnable==1){
                                            console.log("********************");
                                            console.log("category commission value", storeCategoryData.commissionValue);
                                            console.log("item quantity", item.quantity);
                                            console.log("item price", item.unitPrice);
                                            appEarningValue = appEarningValue+parseInt(storeCategoryData.commissionValue)/100*item.quantity*item.unitPrice;
                                            console.log("appEarningCategory", appEarningValue);
                                            console.log("********************");
                                            return resolve(true);
                                        }else{
                                            return resolve(false);
                                        }     
                                    
                                    }else{
                                        return resolve(false);
                                    }
                                }else{
                                    return resolve(false);
                                }
                            }
                        );
                    }
                });
            };

            return new Promise((resolve, reject)=>{
                console.log("Start Calc Products and Categories");
                calcPro().then(calcCat).then(value=>{
                    console.log("product comm ended");
                    //store
                    if(value==false){
                        console.log("^^^^^^^^^^^^^^^^^");
                        //appEarningValue = appEarningValue+40/100*item.quantity*item.unitPrice;
                        
                        if (dataToUpdate["accouting.storeCommissionType"] == 0) {
                          // percntage
                          appEarningValue = appEarningValue+dataToUpdate["accouting.storeCommPer"]/100*item.quantity*item.unitPrice;
                                      
                          } else {
                                          // fixed
                          appEarningValue = appEarningValue+dataToUpdate["accouting.storeCommPer"];
                          }
                          
                        console.log("appEarningStore1", appEarningValue);
                        console.log("^^^^^^^^^^^^^^^^^");
                    }
                    return resolve(value);
                    
                });

            });
        };

        console.log("item count",bookingData.Items.length );
        bookingData.Items.forEach((item)=>{
            console.log("-------------------");
            console.log("booking Items", item);
            console.log("-------------------");
            promiseArray.push(calcComm(item));
            
        });
                    
                
        
        return new Promise((resolve, reject)=>{
            
            
            Promise.all(promiseArray).then(data=>{
                
                console.log("appEarningFinal", appEarningValue);
                
                dataToUpdate["accouting.storeCommissionToAppValue"] = appEarningValue;
                dataToUpdate["accouting.storeEarningValue"] = (dataToUpdate["accouting.cartTotalWithoutOfferPrice"] + dataToUpdate["accouting.excTax"])-dataToUpdate["accouting.storeCommissionToAppValue"];
                
                console.log("total",dataToUpdate["accouting.cartTotalWithoutOfferPrice"]);
                console.log("tax",dataToUpdate["accouting.excTax"]);
                console.log("comtoapp",dataToUpdate["accouting.storeCommissionToAppValue"]);
                console.log("storeEarning",dataToUpdate["accouting.storeEarningValue"]);

                let amountDeductionFrom = 0;
                if (dataToUpdate["accouting.deliveryCharge"] > 0) {
                    if (dataToUpdate["accouting.driverCommType"] == 2) {
                    // percntage
                    dataToUpdate["accouting.driverCommissionToAppValue"] =
                        (dataToUpdate["accouting.driverCommPer"] / 100) * dataToUpdate["accouting.deliveryCharge"];
                    dataToUpdate["accouting.driverEarningValue"] =
                        ((100 - dataToUpdate["accouting.driverCommPer"]) / 100) * dataToUpdate["accouting.deliveryCharge"];
                    } else {
                    // fixed
                    dataToUpdate["accouting.driverCommissionToAppValue"] = dataToUpdate["accouting.driverCommPer"];
                    dataToUpdate["accouting.driverEarningValue"] =
                        dataToUpdate["accouting.deliveryCharge"] - dataToUpdate["accouting.driverCommissionToAppValue"];
                    }
                } else {
                    dataToUpdate["accouting.driverCommissionToAppValue"] = dataToUpdate["accouting.driverCommPer"];
                    dataToUpdate["accouting.driverEarningValue"] = dataToUpdate["accouting.driverCommissionToAppValue"];

                    if (dataToUpdate["accouting.driverType"] == 2) {
                    //deduct from store earning(incase of store drivers)
                    dataToUpdate["accouting.storeEarningValue"] =
                        dataToUpdate["accouting.storeEarningValue"] - dataToUpdate["accouting.driverEarningValue"];
                    } else {
                    //deduct from app earning(incase of freelance drivers)
                    dataToUpdate["accouting.appEarningValue"] =
                        parseFloat(dataToUpdate["accouting.appEarningValue"]) - dataToUpdate["accouting.driverEarningValue"];
                    }
                }
                
                dataToUpdate["accouting.appEarningValue"] =
                    dataToUpdate["accouting.storeCommissionToAppValue"] +
                    dataToUpdate["accouting.driverCommissionToAppValue"] -
                    dataToUpdate["accouting.pgComm"] -
                    dataToUpdate["accouting.promoCodeDiscount"]; // appearnings

                console.log("appEarningFinal1", dataToUpdate["accouting.appEarningValue"]);
                //Calculationg End

                dataToUpdate["accouting.taxes"] = dataToUpdate["accouting.excTax"];
                dataToUpdate["accouting.storeCommPer"] = dataToUpdate["accouting.storeCommPer"];
                dataToUpdate["accouting.storeCommissionType"] = dataToUpdate["accouting.storeCommissionType"];
                dataToUpdate["accouting.storeCommissionTypeMsg"] = dataToUpdate["accouting.storeCommissionTypeMsg"];
                dataToUpdate["accouting.driverCommPer"] = dataToUpdate["accouting.driverCommPer"];
                dataToUpdate["accouting.driverCommType"] = dataToUpdate["accouting.driverCommType"];
                dataToUpdate["accouting.driverCommTypeMsg"] = dataToUpdate["accouting.driverCommTypeMsg"];

                dataToUpdate["accouting.appEarningValue"] = dataToUpdate["accouting.appEarningValue"];
                dataToUpdate["accouting.driverEarningValue"] = dataToUpdate["accouting.driverEarningValue"];
                dataToUpdate["accouting.driverCommissionToAppValue"] = dataToUpdate["accouting.driverCommissionToAppValue"];
                dataToUpdate["accouting.storeEarningValue"] = dataToUpdate["accouting.storeEarningValue"];
                dataToUpdate["accouting.storeCommissionToAppValue"] = dataToUpdate["accouting.storeCommissionToAppValue"];

                dataToUpdate["accouting.cashCollected"] = dataToUpdate["accouting.total"];
                dataToUpdate["accouting.pgComm"] = gatewayCommision;
                dataToUpdate["accouting.pgCommName"] = dataToUpdate["accouting.pgCommName"];
                // dataToUpdate['accouting.pgComm'] = 0;
                dataToUpdate["accouting.tollFee"] = 0;
                dataToUpdate["accouting.driverTip"] = 0;
                dataToUpdate["accouting.driverTotalEarningValue"] =
                    parseFloat(dataToUpdate["accouting.driverTip"]) + parseFloat(dataToUpdate["accouting.driverEarningValue"]);
                dataToUpdate["accouting.handlingFee"] = 0;
                dataToUpdate["accouting.appProfitLoss"] = 0;

                //**if payment by card */
                if (bookingData.paymentType == 1 && bookingData.stripeCharge) {
                    // capture charge
                    stripeTransaction
                    .captureCharge(req, bookingData.stripeCharge.id, bookingData.paidBy.card)
                    .then(data => {
                        dataToUpdate["stripeCapture"] = data;
                        if (bookingData.payByWallet == 1) {
                        customer.releaseBlockWalletBalance(
                            {
                            // wallet bal Release
                            userId: bookingData.customerDetails.customerId.toString(),
                            createdBy: "UpdateOrder",
                            amount: bookingData.paidBy.wallet
                            }, (err, data) => {
                                return resolve(true);
                            });
                        } else {
                            return resolve(true);
                        }
                    })
                    .catch(e => {
                        return reply({ message: e.message }).code(400); //stripe error logs
                    });
                } else {
                    if (bookingData.payByWallet == 1) {
                        customer.releaseBlockWalletBalance(
                            {
                            // wallet bal Release
                            userId: bookingData.customerDetails.customerId.toString(),
                            createdBy: "UpdateOrder",
                            amount: bookingData.paidBy.wallet
                            }, (err, data) => {
                            return resolve(true);
                            });
                    } else {
                        return resolve(true);
                    }
                }
                		
            
            });
        });
          
    };



  let getStoresData = () => {
    return new Promise((resolve, reject) => {
      if (req.payload.storeId == "" || typeof req.payload.storeId == "undefined") {
        req.payload.storeId = "5c62b5a007eb037c8e2515cb";
      }
      stores.getOne({ _id: req.payload.storeId ? new ObjectID(req.payload.storeId) : "" }, function (err, store) {
        if (err) {
          reject(dbErrResponse);
        } else if (store) {
          storeData = store;
          resolve(true);
        } else {
          logger.error("store not found ");
          reject({ message: req.i18n.__("postStatusRide")["404"], code: 404 });
        }
      });
    });
  };

  let getLaundryPriceByWeight = () => {
    return new Promise((resolve, reject) => {
      city.cityDetails(storeData.cityId, (cityDetailsError, cityDetailsResponse) => {
        laundryDetails = cityDetailsResponse[0].cities.laundry;
        if (cityDetailsError) {
          reject(dbErrResponse);
        } else if (cityDetailsResponse) {
          for (var k = 0; k < laundryDetails.length; k++) {
            if (
              req.payload.weight >= laundryDetails[k].lowerLimit &&
              req.payload.weight <= laundryDetails[k].upperLimit
            ) {
              laundryFee = laundryDetails[k].price;
              if (laundryDetails[k].taxesApplicable == 1) {
                taxApplicable = true;
              }
            }
          }

          cityDetails = cityDetailsResponse;
          resolve(true);
        } else {
          logger.error("store not found ");
          reject({ message: req.i18n.__("postStatusRide")["404"], code: 404 });
        }
      });
    });
  };
  let updateStoreData = () => {
    return new Promise((resolve, reject) => {
      if (parseInt(req.payload.status) == 27) {
        let totalAmount = 0;
        let subTotalAmount = 0;
        let discount = 0;
        let deliveryCharge = 0;
        let storeFreeDelivery = 0;
        let storeDeliveryFee = 0;
        let excTax = 0;
        let exclusiveTaxes = [];
        if (taxApplicable == true) {
          exclusiveTaxes = cityDetails[0].cities.taxDetails;
        }

        totalAmount = laundryFee + bookingData.deliveryCharge;
        dataToUpdate["weightMetric"] = cityDetails[0].cities.weightMetric;
        dataToUpdate["weightMetricText"] = cityDetails[0].cities.weightMetricText;
        dataToUpdate["totalAmount"] = totalAmount;
        dataToUpdate["subTotalAmount"] = laundryFee;
        dataToUpdate["discount"] = discount;
        dataToUpdate["deliveryCharge"] = bookingData.deliveryCharge;
        dataToUpdate["storeFreeDelivery"] = storeFreeDelivery;
        dataToUpdate["storeDeliveryFee"] = storeDeliveryFee;
        dataToUpdate["excTax"] = excTax;
        dataToUpdate["exclusiveTaxes"] = exclusiveTaxes;
      }
      // dataToUpdate['qrCode'] = req.payload.qrCode ? req.payload.qrCode : '';
      dataToUpdate["storeId"] = storeData["_id"].toString() || "";
      dataToUpdate["storeCoordinates"] = storeData["coordinates"];
      // dataToUpdate['storeCoordinates']['longitude'] = storeData['coordinates']['longitude'] || 0;
      // dataToUpdate['storeCoordinates']['latitude'] = storeData['coordinates']['latitude'] || 0;
      dataToUpdate["storeLogo"] = storeData["profileLogos"]["logoImage"] || "";
      dataToUpdate["storeName"] = storeData["sName"]["en"] || "";
      dataToUpdate["storeType"] = storeData["storeType"] || "";
      dataToUpdate["storeTypeMsg"] = storeData["storeTypeMsg"] || "";
      dataToUpdate["storeAddress"] = storeData["storeAddr"] || "";
      resolve(true);
    });
  };

  let updateBookingData = () => {
    return new Promise((resolve, reject) => {
      let CondToUpdate = {
        $set: dataToUpdate,
        $push: { activityLogs: objectToPush }
      };
      bookingData.status = parseInt(req.payload.status);
      bookingData.statusMsg = statusMsg;
      bookingData.statusText = statusText;

      bookingsAssigned.UpdateWithPush(condition, CondToUpdate, function (err, data) {
        if (err) reject(dbErrResponse);
        else if (parseInt(req.payload.status) == 15) {
          shiftBookingData()
            .then(data => {
              resolve(true);
            })
            .catch(err => {
              reject(err);
            });
        } else if (parseInt(req.payload.status) == 27) {
          getStoresData()
            .then(updateStoreData)
            .then(dataFromUpdateStore => {
              resolve(true);
            })
            .catch(err => {
              reject(err);
            });
        } else if (parseInt(req.payload.status) == 28) {
          shiftBookingDataToUnassign()
            .then(data => {
              resolve(true);
            })
            .catch(err => {
              reject(err);
            });
        } else {
          resolve(true);
        }
      });
    });
  };
  let shiftBookingDataToUnassign = () => {
    return new Promise((resolve, reject) => {
      bookingsAssigned.SelectOne(condition, function (err, bookingDataFull) {
        if (err) {
          reject(dbErrResponse);
        } else if (bookingDataFull) {
          delete bookingDataFull._id;
          bookingDataFull.status = parseInt(4);
          bookingDataFull.statusMsg = "New";
          bookingDataFull.inDispatch = false;
          bookingDataFull.bookingType = 1;
          bookingDataFull.serviceType = 1;
          bookingDataFull.bookingTypeMsg = "drop";
          bookingDataFull.pickUpDriverId = bookingDataFull.driverId;
          bookingDataFull.pickUpDriverDetails = bookingDataFull.driverDetails;
          bookingDataFull.pickUpDriverPlan = bookingDataFull.driverPlan;
          bookingDataFull.isCominigFromStore = true;
          bookingDataFull.laundryBookingType = 2;
          bookingsUnassigned
            .createNewBooking(bookingDataFull)
            .then(result => {
              managerTopics.sendToWebsocket(bookingDataFull, 2, (err, res) => { });

              webSocket.publish("adminOrderUpdates", bookingDataFull, { qos: 2 }, function (mqttErr, mqttRes) { });
              bookingsAssigned.Remove(condition, function (err, res) {
                if (err) {
                  reject(dbErrResponse);
                } else {
                  resolve(true);
                }
              });
            })
            .catch(err => {
              reject(dbErrResponse);
            });
        } else {
          reject({ message: req.i18n.__("postStatusRide")["404"], code: 404 });
        }
      });
    });
  };

  let shiftBookingData = () => {
    return new Promise((resolve, reject) => {
      bookingsAssigned.SelectOne(condition, function (err, bookingDataFull) {
        if (err) {
          reject(dbErrResponse);
        } else if (bookingDataFull) {
          delete bookingDataFull._id;
          bookingsPast
            .createNewBooking(bookingDataFull)
            .then(result => {
              bookingsAssigned.Remove(condition, function (err, res) {
                if (err) {
                  reject(dbErrResponse);
                } else {
                  resolve(true);
                }
              });
            })
            .catch(err => {
              reject(dbErrResponse);
            });
        } else {
          reject({ message: req.i18n.__("postStatusRide")["404"], code: 404 });
        }
      });
    });
  };

  let getMsg = driverName => {
    //10- on the way 11- Arrived,12- Delivery started,13- reached at location , 14- completed ,15- submit, 26 - laundry pickup, 27 - laundry drop at laundromat
    let msg = "";
    switch (parseInt(req.payload.status)) {
      case 10:
        msg = "" + driverName + " is on the way to store.";
        break;
      case 11:
        msg = "" + driverName + " has arrived at the store and will pickup your order soon.";
        break;
      case 12:
        msg = "" + driverName + " has picked up your order. Your order is in route!";
        break;
      case 13:
        msg = "" + driverName + " has arrived at your address, please receive the order.";
        break;
      case 14:
        msg = "Your order has been delivered. Hope you shop with us soon.";
        break;
      case 15:
        msg = "Done";
        break;
      case 26:
        msg = "" + driverName + " arrived at pickup point & picked.";
        break;

      case 27:
        msg = "" + driverName + " arrived at laundromat & dropped.";
        break;
      default:
        msg = "Done.";
        break;
    }
    return msg;
  };
  let updateLogs = () => {
    return new Promise((resolve, reject) => {
      let currentBookings = masterData.currentBookings || [];
      //log the booking activity
      LogBookingActivity(
        currentBookings,
        {
          bid: bookingData.orderId,
          status: parseInt(req.payload.status),
          msg: getMsg(masterData.name),
          time: timeStamp,
          isoDate: iso,
          lat: req.payload.lat || "",
          long: req.payload.long || ""
        },
        () => { }
      );

      // provider.update(
      //     { _id: new ObjectID(req.auth.credentials._id) },
      //     { apptStatus: parseInt(req.payload.status) == 10 ? 0 : parseInt(req.payload.status) },
      //     function (err, booking) { });

      provider.fineAndUpdate(
        { _id: new ObjectID(req.auth.credentials._id) },
        { apptStatus: parseInt(req.payload.status) == 15 ? 0 : parseInt(req.payload.status) },
        (err, bookings) => { }
      );

      if (parseInt(req.payload.status) == 15) {
        //updating order analytics.
        // orderAnalytics.orderAnalytic(bookingData);

        if (
          bookingData.claimData &&
          Object.keys(bookingData.claimData).length !== 0 &&
          bookingData.claimData != null &&
          bookingData.claimData.claimId != ""
        ) {
          campaignAndreferral.claimCouponHandler(
            { claimId: bookingData.claimData.claimId, bookingId: bookingData.orderId },
            (err, res) => { }
          );
        }
        bookingAnalyticsDataPush(bookingData, (err, res) => { });
        validatePromoCampaign.postRequestHandler(
          {
            bookingId: bookingData.orderId,
            userId: bookingData.customerDetails.customerId.toString(),
            customerName: bookingData.customerDetails.name,
            cityId: bookingData.cityId,
            cityName: bookingData.cityName || "",
            zoneId: bookingData.cityId || "",
            paymentMethod: bookingData.paymentType,
            paymentMethodString: bookingData.paymentTypeMsg || "",
            bookingTime: bookingData.bookingDateTimeStamp,
            deliveryFee: 0,
            cartValue: bookingData.totalAmount,
            currency: bookingData.currency,
            currencySymbol: bookingData.currencySymbol,
            email: bookingData.customerDetails.email,
            cartId: bookingData.orderId
          },
          (err, res) => { }
        );

        if (req.payload.rating != null || req.payload.rating != undefined || req.payload.rating != "") {
          // rating
          logger.warn("callng ratingToCustomer");
          ratingToCustomer(bookingData, (err, result) => { });
        }
        updatProductOfferClaimCount(bookingData, (err, result) => { });
        provider.FINDONEANDUPDATE(
          {
            query: { _id: new ObjectID(req.auth.credentials._id) },
            data: {
              $inc: { currentBookingsCount: -1 },
              $pull: { currentBookings: { bid: bookingData.orderId } }
            }
          },
          (err, result) => { }
        );
      }
      resolve(true);
    });
  };

  const bookingAnalyticsDataPush = (data, cb) => {
    bookingAnalytics.read({ userId: data.customerDetails.customerId.toString() }, (err, res) => {
      if (err) {
      } else if (res === null) {
        bookingAnalytics.post(
          {
            userId: data.customerDetails.customerId.toString(),
            totalNumberOfBooking: 1,
            totalBusinessAmount: data.totalAmount,
            bookings: [
              {
                bookingId: data.orderId,
                providerId: data.driverDetails.driverId.toString(),
                amount: data.totalAmount,
                timestamp: moment().unix(),
                isoDate: new Date()
              }
            ]
          },
          (err, res) => {
            cb(null);
          }
        );
      } else {
        let updateQuery = {
          query: { userId: data.customerDetails.customerId.toString() },
          data: {
            $set: {
              totalNumberOfBooking: res.totalNumberOfBooking + 1,
              totalBusinessAmount: res.totalBusinessAmount + data.totalAmount
            },
            $push: {
              bookings: {
                bookingId: data.orderId,
                providerId: data.driverDetails.driverId.toString(),
                amount: data.totalAmount,
                timestamp: moment().unix(),
                isoDate: new Date()
              }
            }
          }
        };
        bookingAnalytics.findUpdate(updateQuery, (err, res) => {
          cb(null);
        });
      }
    });
  }; //update booking assignBooking to booking

  let sendNotification = () => {
    return new Promise((resolve, reject) => {
      //================ customer notification =========>
      let dispatcherData = {
        status: parseInt(req.payload.status),
        statusMsg: statusMsg,
        statusMessage: statusMsg,
        bid: bookingData.orderId,
        _id: bookingData._id,
        orderId: bookingData.orderId,
        storeId: bookingData.storeId // yunus
      };

      if (parseInt(req.payload.status) != 14) {
        dispatcherData.driverId = bookingData.driverDetails ? bookingData.driverDetails.driverId : "";
        dispatcherData.driverName = bookingData.driverDetails ? bookingData.driverDetails.fName : "";
        dispatcherData.driverLName = bookingData.driverDetails ? bookingData.driverDetails.lName : "";
        dispatcherData.driverImage = bookingData.driverDetails ? bookingData.driverDetails.image : "";
        dispatcherData.storeType = bookingData.storeType ? bookingData.storeType : 2;
        dispatcherData.providerType = bookingData.providerType ? bookingData.providerType : 1;
        (dispatcherData.totalAmount = bookingData ? bookingData.totalAmount : ""),
          (dispatcherData.bookingDate = bookingData ? bookingData.bookingDate : ""),
          (dispatcherData.storeName = bookingData ? bookingData.storeName : ""),
          (dispatcherData.serviceType = bookingData ? bookingData.serviceType : ""),
          (dispatcherData.pickupAddress = bookingData.pickup ? bookingData.pickup.addressLine1 : ""),
          (dispatcherData.pickAddress = bookingData.pickup ? bookingData.pickup.addressLine1 : ""),
          (dispatcherData.dropAddress = bookingData.drop ? bookingData.drop.addressLine1 : "");
        dispatcherData.latitude = req.payload.lat || 0;
        dispatcherData.longitude = req.payload.long || 0;
        dispatcherData.paymentType = bookingData.paymentType ? bookingData.paymentType : 0;
        dispatcherData.paymentTypeMsg = bookingData.paymentTypeMsg ? bookingData.paymentTypeMsg : "";
        dispatcherData.latitude = req.payload.lat || 0;
        dispatcherData.longitude = req.payload.long || 0;
        notifyi.notifyRealTime({ listner: customerData.mqttTopic, message: dispatcherData });
        notifications.notifyFcmTopic(
          {
            action: 11,
            usertype: 1,
            deviceType: customerData.mobileDevices ? customerData.mobileDevices.deviceType : 1,
            notification: "",
            msg: req.i18n.__(req.i18n.__('bookingStatusMsg')[req.payload.status]),
            fcmTopic: customerData.fcmTopic || "",
            title: req.i18n.__(req.i18n.__('bookingStatusTitle')[req.payload.status]),
            data: dispatcherData
          },
          () => { }
        );
      }

      notifyi.notifyRealTime({ listner: "bookingChn", message: dispatcherData });

      //================  send notification to dispatcher =============

      if (parseInt(req.payload.status) == 15) {
        webSocket.publish("orderUpdates", dispatcherData, { qos: 2 }, function (mqttErr, mqttRes) { });
        bookingData.status = 15;
        managerTopics.sendToWebsocket(bookingData, 2, (err, res) => { });

        webSocket.publish("adminOrderUpdates", dispatcherData, { qos: 2 }, function (mqttErr, mqttRes) { });

        storeManagers.getAll({ storeId: bookingData.storeId.toString(), status: 2 }, (err, storeManager) => {
          if (err) {
            logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
          }
          if (storeManager.length > 0) {
            for (let s = 0; s < storeManager.length; s++) {
              notifications.notifyFcmTopic(
                {
                  action: 11,
                  usertype: 1,
                  deviceType: storeManager[s].mobileDevices.deviceType ? storeManager[s].mobileDevices.deviceType : 2,
                  notification: "",
                  msg: req.i18n.__(req.i18n.__('bookingStatusMsg')[req.payload.status]),
                  fcmTopic: storeManager[s].fcmManagerTopic,
                  title: req.i18n.__(req.i18n.__('bookingStatusTitle')[req.payload.status]),
                  data: dispatcherData
                },
                () => { }
              );
            }
          }

          storeManagers.getAll({ cityId: bookingData.cityId.toString(), status: 2, userType: 0 }, (err, cityManager) => {
            if (err) {
              logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
            }
            if (cityManager.length > 0) {
              for (let k = 0; k < cityManager.length; k++) {
                notifications.notifyFcmTopic(
                  {
                    action: 11,
                    usertype: 1,
                    deviceType: cityManager[k].mobileDevices.deviceType ? cityManager[k].mobileDevices.deviceType : 2,
                    notification: "",
                    msg: req.i18n.__(req.i18n.__('bookingStatusMsg')[req.payload.status]),
                    fcmTopic: cityManager[k].fcmManagerTopic,
                    title: req.i18n.__(req.i18n.__('bookingStatusTitle')[req.payload.status]),
                    data: dispatcherData
                  },
                  () => { }
                );
              }
            }
          });
        });
      } else if (parseInt(req.payload.status) == 11) {

        storeManagers.getAll({ storeId: bookingData.storeId.toString(), status: 2 }, (err, storeManager) => {
          if (err) {
            logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
          }
          if (storeManager.length > 0) {
            for (let s = 0; s < storeManager.length; s++) {
              notifications.notifyFcmTopic(
                {
                  action: 11,
                  usertype: 1,
                  deviceType: storeManager[s].mobileDevices.deviceType ? storeManager[s].mobileDevices.deviceType : 2,
                  notification: "",
                  msg: req.i18n.__(req.i18n.__('bookingStatusMsg')[req.payload.status + 's'], bookingData.driverDetails.fName, bookingData.driverDetails.lName, bookingData.orderId),
                  fcmTopic: storeManager[s].fcmManagerTopic,
                  title: req.i18n.__(req.i18n.__('bookingStatusTitle')[req.payload.status + 's']),
                  data: dispatcherData
                },
                () => { }
              );
            }
          }

          storeManagers.getAll({ cityId: bookingData.cityId.toString(), status: 2, userType: 0 }, (err, cityManager) => {
            if (err) {
              logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
            }
            if (cityManager.length > 0) {
              for (let k = 0; k < cityManager.length; k++) {
                notifications.notifyFcmTopic(
                  {
                    action: 11,
                    usertype: 1,
                    deviceType: cityManager[k].mobileDevices.deviceType ? cityManager[k].mobileDevices.deviceType : 2,
                    notification: "",
                    msg: req.i18n.__(req.i18n.__('bookingStatusMsg')[req.payload.status + 's'], bookingData.driverDetails.fName, bookingData.driverDetails.lName, bookingData.orderId),
                    fcmTopic: cityManager[k].fcmManagerTopic,
                    title: req.i18n.__(req.i18n.__('bookingStatusTitle')[req.payload.status + 's']),
                    data: dispatcherData

                  },
                  () => { }
                );
              }
            }
          });
        });
        managerTopics.sendToWebsocket(bookingData, 2, (err, res) => { });
        webSocket.publish("orderUpdates", dispatcherData, { qos: 2 }, function (mqttErr, mqttRes) { });

        webSocket.publish("adminOrderUpdates", dispatcherData, { qos: 2 }, function (mqttErr, mqttRes) { });
      } else {

        storeManagers.getAll({ storeId: bookingData.storeId.toString(), status: 2 }, (err, storeManager) => {
          if (err) {
            logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
          }
          if (storeManager.length > 0) {
            for (let s = 0; s < storeManager.length; s++) {
              notifications.notifyFcmTopic(
                {
                  action: 11,
                  usertype: 1,
                  deviceType: storeManager[s].mobileDevices.deviceType ? storeManager[s].mobileDevices.deviceType : 2,
                  notification: "",
                  msg: req.i18n.__(req.i18n.__('bookingStatusMsg')[req.payload.status]),
                  fcmTopic: storeManager[s].fcmManagerTopic,
                  title: req.i18n.__(req.i18n.__('bookingStatusTitle')[req.payload.status]),
                  data: dispatcherData
                },
                () => { }
              );
            }
          }

          storeManagers.getAll({ cityId: bookingData.cityId.toString(), status: 2, userType: 0 }, (err, cityManager) => {
            if (err) {
              logger.error("Error while getting storemanager topics   (getAll): " + JSON.stringify(err));
            }
            if (cityManager.length > 0) {
              for (let k = 0; k < cityManager.length; k++) {
                notifications.notifyFcmTopic(
                  {
                    action: 11,
                    usertype: 1,
                    deviceType: cityManager[k].mobileDevices.deviceType ? cityManager[k].mobileDevices.deviceType : 2,
                    notification: "",
                    msg: req.i18n.__(req.i18n.__('bookingStatusMsg')[req.payload.status]),
                    fcmTopic: cityManager[k].fcmManagerTopic,
                    title: req.i18n.__(req.i18n.__('bookingStatusTitle')[req.payload.status]),
                    data: dispatcherData
                  },
                  () => { }
                );
              }
            }
          });
        });
        bookingsAssigned.SelectOne({ orderId: req.payload.orderId }, function (err, bookingupdatedDataDB) {
          if (err) {
            reject(dbErrResponse);
          } else if (bookingupdatedDataDB) {
            managerTopics.sendToWebsocket(bookingData, 2, (err, res) => { });
            dispatcherData.timeStamp = bookingupdatedDataDB.timeStamp;
            webSocket.publish("orderUpdates", dispatcherData, { qos: 2 }, function (mqttErr, mqttRes) { });

            webSocket.publish("adminOrderUpdates", dispatcherData, { qos: 2 }, function (mqttErr, mqttRes) { });
          }
        });
      }

      resolve(true);
    });
  };
  let sendEmail = () => {
    return new Promise((resolve, reject) => {

      if (parseInt(req.payload.status) == 15) {
        var data = bookingData;
        let itms = data.Items ? data.Items : [];
        var dynamicItems = [];

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

        if (config.mailGunService == "true" || config.mailGunService == true) {
          var cancelledTimestamp = data.bookingDateTimeStamp;
          var cancelledDate = moment.unix(moment().unix(cancelledTimestamp)).format("YYYY-MM-DD HH:mm:ss")
          email.getTemplateAndSendEmail({
            attachment: true,
            orderId: String(data.orderId),
            templateName: 'orderDelivered.html',
            toEmail: data.customerDetails.email,
            trigger: 'Order completed',
            subject: 'Order completed successfully.',
            keysToReplace: {
              userName: data.customerDetails.name || "",
              appName: config.appName,
              orderPlacedDate: moment(moment.unix(cancelledTimestamp)).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
              orderDeliveredDate: moment.unix(moment().unix()).format('YYYY-MM-DD HH:mm:ss'),
              addressLine1: (data.drop.flatNumber != "" ? data.drop.flatNumber + "," : "") + (data.drop.landmark != "" ? data.drop.landmark + "," : "") + (data.drop.addressLine1 != "" ? data.drop.addressLine1 + "," : "") + (data.drop.addressLine2 != "" ? data.drop.addressLine2 : ""),
              addressLine2: (data.drop.city != "" ? data.drop.city + "," : "") + (data.drop.state != "" ? data.drop.state : "") + (data.drop.postalCode != "" ? "-" + data.drop.postalCode : ""),
              country: data.drop.country,
              paymentTypeMsg: data.paymentTypeMsg,
              orderCreationDate: moment(moment.unix(data.bookingDate)).tz(data.timeZone).format('YYYY-MM-DD hh:mm:ss A'),
              itemsCount: String(data.Items.length),
              subTotalAmount: data.currencySymbol + "" + data.subTotalAmount,
              deliveryCharge: data.currencySymbol + "" + data.deliveryCharge,
              discount: data.currencySymbol + "" + data.discount,
              tax: data.currencySymbol + "" + data.excTax ? data.excTax : 0,
              totalAmount: data.currencySymbol + "" + data.totalAmount,
              pendingAmount:
                data.paymentType === 2 ? data.currencySymbol + "" + data.totalAmount : data.currencySymbol + "" + 0,
              orderId: String(data.orderId),
              storeName: data.storeName,
              webUrl: data.webUrl,
              dynamicItems: dynamicItems
            }
          }, () => {
          });
        }

      }

      resolve(true);


    });
  };
  //6 - On the Way,<br/> 7 - Arrived,<br/> 8 - Journey Started,<br/> 10 - Completed
  checkBooking() ////10- on the way 11- Arrived,12- Delivery started,13- reached at location , 14- completed ,15- submit
    .then(getCustomerData)
    .then(getMasterData)
    .then(data => {
      return new Promise((resolve, reject) => {
        switch (parseInt(req.payload.status)) {
          case 10:
            objectToPush = {
              status: 10,
              state: "onTheWay",
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
            };
            dataToUpdate["timeStamp.onTheWay"] = {
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
            };

            resolve(true);
            break;
          case 11:
            objectToPush = {
              // arrived: {
              status: 11,
              state: "arrived",
              distance: req.payload.distance || 0,
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
              // }
            };
            dataToUpdate["timeStamp.arrived"] = {
              distance: req.payload.distance || 0,
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
            };

            resolve(true);
            break;
          case 12:
            objectToPush = {
              // journeyStart: {
              status: 12,
              state: "journeyStart",
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
              // }
            };
            dataToUpdate["timeStamp.journeyStart"] = {
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
            };
            // campaign.applyPromoCode(bookingData._id, () => {
            // })//apply promocode if any
            // reverse geocode API
            googleApi
              .fetchAddress(req.payload.lat, req.payload.long, [])
              // fetchAddress(req.payload.lat, req.payload.long)
              .then(data => {
                dataToUpdate["pickupLocation.longitude"] = parseFloat(req.payload.long);
                dataToUpdate["pickupLocation.latitude"] = parseFloat(req.payload.lat);
                dataToUpdate["addressLine"] = data;
                resolve(true);
              })
              .catch(err => {
                reject({ message: "Location not found", code: 401 });
              });
            break;
          case 13:
            objectToPush = {
              // reached: {
              status: 13,
              state: "reached",
              distance: req.payload.distance || 0,
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
              // }
            };
            dataToUpdate["timeStamp.reached"] = {
              distance: req.payload.distance || 0,
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
            };
            resolve(true);
            break;
          case 14:
            // dataToUpdate['timeStamp.reached'] = {
            //     distance: req.payload.distance || 0,
            //     statusUpdatedBy: 'driver',
            //     userId: new ObjectID(req.auth.credentials._id.toString()),
            //     timeStamp: timeStamp,
            //     isoDate: iso,
            //     location: {
            //         longitude: req.payload.long,
            //         latitude: req.payload.lat
            //     },
            //     message: getMsg(masterData.name),
            //     ip: "0.0.0.0"
            // }
            resolve(true);
            break;
          case 15:
            objectToPush = {
              // completed: {
              status: 15,
              state: "completed",
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
              // }
            };
            dataToUpdate["timeStamp.completed"] = {
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
            };

            dataToUpdate["reviewByProvider"] = {
              pending: 0,
              rating: req.payload.rating,
              review: req.payload.review,
              userId: new ObjectID(req.auth.credentials._id.toString()),
              reviewAt: moment().unix(),
              reviewAtiso: new Date()
            };

            dataToUpdate["receivers"] = {
              goodType: "",
              loadType: "",
              ApproxDistance: "0",
              ApproxFare: "0",
              status: "0",
              signatureUrl: req.payload.signatureUrl,
              driverPhoto: "",
              Fare: "0",
              AproxDropTime: ""
            };

            // reverse geocode API
            // fetchAddress(req.payload.lat, req.payload.long)
            googleApi
              .fetchAddress(req.payload.lat, req.payload.long, [])
              .then(data => {
                dataToUpdate["dropLocation.longitude"] = parseFloat(req.payload.long);
                dataToUpdate["dropLocation.latitude"] = parseFloat(req.payload.lat);
                dataToUpdate["dropAddress"] = data;
                updateJourneyComplete()
                  .then(chargeCustomer)
                  .then(data => {
                    resolve(true);
                  })
                  .catch(err => {
                    if (typeof err.code != undefined) reject(err);
                    else reject({ message: "Location not found", code: 401 });
                  });
              })
              .catch(err => {
                if (typeof err.code != undefined) reject(err);
                else reject({ message: "Location not found", code: 401 });
              });
            break;
          case 26:
            objectToPush = {
              status: 26,
              state: "Picked",
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
            };
            dataToUpdate["timeStamp.Picked"] = {
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
            };

            resolve(true);
            break;

          case 27:
            objectToPush = {
              status: 27,
              state: "Arrived at laundromat",
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
            };
            dataToUpdate["weight"] = req.payload.weight ? req.payload.weight : 0;
            dataToUpdate["timeStamp.Dropped"] = {
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
            };
            getStoresData()
              .then(getLaundryPriceByWeight)
              .then(updateStoreData)
              .then(dataFromUpdateStore => {
                resolve(true);
              })
              .catch(err => {
                reject(err);
              });

            //  resolve(true);
            break;

          case 28:
            objectToPush = {
              status: 28,
              state: "Dropped to laundromat",
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
            };
            dataToUpdate["timeStamp.Dropped"] = {
              statusUpdatedBy: "driver",
              userId: new ObjectID(req.auth.credentials._id.toString()),
              timeStamp: timeStamp,
              isoDate: iso,
              location: {
                longitude: req.payload.long,
                latitude: req.payload.lat
              },
              message: getMsg(masterData.name),
              ip: "0.0.0.0"
            };

            resolve(true);
            break;

          default:
            reject({ message: req.i18n.__("postStatusRide")["400"], code: 400 });
        }
      });
    })
    .then(updateBookingData)
    .then(updateLogs)
    .then(sendNotification)
    .then(sendEmail)
    .then(data => {
      if (parseInt(req.payload.status) == 15) {
        accounting
          .calculate(req.payload.orderId) // accounting/pickup
          .then(orderAccount => {
            if (orderAccount.data) {
              
              const rec = {
                cashCollected: orderAccount.data.paidBy.cash,
                cardDeduct: orderAccount.data.paidBy.card,
                WalletTransaction: orderAccount.data.paidBy.wallet,
                pgComm: orderAccount.data.accouting.pgEarningValue,
                driverEarning: orderAccount.data.accouting.driverEarningValue,
                appEarning: orderAccount.data.accouting.appEarningValue,
                storeEarning: orderAccount.data.accouting.storeEarningValue,
                userId: orderAccount.data.customerDetails.customerId,
                driverId: orderAccount.data.driverId,
                storeId: orderAccount.data.storeId,
                currency: orderAccount.data.currency,
                currencySymbol: orderAccount.data.currencySymbol,
                orderId: orderAccount.data.orderId,
                serviceType: orderAccount.data.serviceType,
                serviceTypeText: orderAccount.data.serviceType === 1 ? "delivery" : "pickup",
                driverType:
                  typeof orderAccount.data.driverDetails != "undefined" &&
                    typeof orderAccount.data.driverDetails.driverType != "undefined"
                    ? orderAccount.data.driverDetails.driverType
                    : 1,
                paymentTypeText: orderAccount.data.paymentTypeMsg,
                cityName: orderAccount.data.pickup.city,
                cityId: orderAccount.data.cityId
              };
              console.log("Rec", rec);
              wallet.walletEntryForOrdering(rec, (error, result) => {
                if (error) {
                  logger.error(error);
                  logger.error("error");
                }
              });
            }
          });
      }
      return reply({ message: req.i18n.__("postStatusRide")["200"], data: statusMsg }).code(200);
    })
    .catch(e => {

      return reply({ message: e.message }).code(e.code);
    });
};

let lang = providerErrorMsg["langaugeId"];

const responseCode = {
  status: {
    500: { message: providerErrorMsg["genericErrMsg"]["500"] },
    200: { message: providerErrorMsg["postStatusRide"]["200"] },
    400: { message: providerErrorMsg["postStatusRide"]["400"] },
    401: { message: "Location not found" },
    402: { message: providerErrorMsg["postStatusRide"]["402"] },
    404: { message: providerErrorMsg["postStatusRide"]["404"] }
  }
}; //swagger response code

module.exports = { payload, APIHandler, responseCode };

/**
 * Method to Calculate distance from origins, destinations
 * @param {*} params - origins, destinations
 * @param {*} callback - promise method
 */
function calculateDistance(origins, destinations) {
  return new Promise((resolve, reject) => {
    distanceMtx.matrix(origins, destinations, function (err, distances) {
      if (err) {
        reject(err);
      } else if (!distances) {
        reject(distances);
      } else if (distances.status == "OK") {
        let distance = 0;
        for (var i = 0; i < origins.length; i++) {
          for (var j = 0; j < destinations.length; j++) {
            if (distances.rows[0].elements[j].status == "OK") {
              distance += distances.rows[i].elements[j].distance.value;
            }
          }
        }
        resolve(distance);
      } else {
        reject(distances);
      }
    });
  });
}

/**
 * Method to log the booking activity along with time stamps
 * @param {*} params - bid, status, msg, time
 * @param {*} callback - async method
 */
function LogBookingActivity(currentBookings, params, callback) {
  async.forEach(
    currentBookings,
    (item, cb) => {
      let data = {
        $set: {
          lt: params.lat,
          lg: params.long
        },
        $push: {
          activities: {
            bid: params.bid,
            status: parseInt(params.status),
            msg: params.msg,
            time: params.time,
            isoDate: new Date(),
            lat: params.lat,
            long: params.long
          }
        }
      };

      let options = {}; // upsert: true };

      let locationLogsData = {
        $push: {
          activities: {
            bid: params.bid,
            status: parseInt(params.status),
            msg: params.msg,
            time: params.time,
            isoDate: new Date(),
            lat: params.lat,
            long: params.long
          }
        }
      };

      if (item.bid == params.bid) locationLogsData["$push"][params.status] = params.lat + "," + params.long;

      locationLogs.FINDONEANDUPDATE(
        { query: { bid: item.bid }, data: locationLogsData, options: options },
        // () => { return callback(null, 'done') });
        () => {
          return;
        }
      );

      bookingsAssigned.FINDONEANDUPDATE(
        { query: { orderId: item.bid }, data: data, options: options },
        // () => { return callback(null, 'done') });
        () => {
          return;
        }
      );

      return cb(null, "done");
    },
    (err, result) => {
      return callback(null, "done");
    }
  );
}

/**
 * Method to log the updatProductOfferClaimCount activity along with time stamps
 * @param {*} params - booking
 * @param {*} callback - async method
 */
function updatProductOfferClaimCount(params, callback) {
  params.Items ? params.Items : [];
  let arrayToPush = [];
  for (let i = 0; i < params.Items.length; i++) {
    if (params.Items[i].offerId != 0) {
      arrayToPush.push({
        bookingID: params.orderId,
        userID: params.customerDetails ? params.customerDetails.customerId : "",
        offerId: params.Items[i].offerId,
        originalAmonut: params.Items[i].unitPrice,
        finalAmount: params.Items[i].finalPrice,
        discount: params.Items[i].appliedDiscount
      });
    }
  }
  if (arrayToPush.length > 0) {
    logger.warn("redemption offers");
    request
      .patch(config.offerRedemptionUrl)
      .send({ data: arrayToPush })
      .end(function (err, res) {
        if (err) {
          // logger.warn('err : ', err);
        }
        // logger.warn('res : ', res);
      });
  }

  // });
}

/**
 * Method to log the ratingToCustomer activity along with time stamps
 * @param {*} params - booking
 * @param {*} callback - async method
 */
function ratingToCustomer(params, callback) {
  let customerData = {};
  const read = newOrder => {
    return new Promise((resolve, reject) => {
      // logger.error(params);
      // logger.error('params');
      customer.getOne(
        { _id: params.customerDetails ? new ObjectID(params.customerDetails.customerId) : "" },
        (err, res) => {
          customerData = res ? res : customerData;
          return err ? reject(err) : resolve(customerData);
        }
      );
    });
  };
  read()
    .then(data => {
      // logger.error(data);
      // logger.error('data');
      let currentratng = customerData.averageRating ? parseFloat(customerData.averageRating) : 0;
      let totalVal = 0;
      totalVal =
        currentratng == 0
          ? params.reviewByProvider
            ? params.reviewByProvider.rating
            : 0 + currentratng
          : (params.reviewByProvider.rating + currentratng) / 2;
      totalVal = totalVal > 0 ? totalVal : 0;

      customer.update(
        {
          q: {
            _id: params.customerDetails ? new ObjectID(params.customerDetails.customerId) : ""
          },
          data: {
            $push: {
              completedOrders: {
                storeId: params.storeId,
                orderId: params.orderId,
                orderTotal: parseFloat(params.totalAmount),
                createdTimestamp: moment().unix(),
                currencySymbol: params.currencySymbol,
                createdIsoData: new Date()
              },
              reviewLogs: params.reviewByProvider
            },
            $set: {
              averageRating: totalVal
            },
            $inc: {
              "orders.ordersCount": 1,
              ordersCount: 1,
              "orders.ordersAmount": parseFloat(params.totalAmount)
            }
          }
        },
        (err, result) => {
          logger.info("product order Count", err);
          //return callback(null, 'done')
        }
      );
    })
    .catch(e => {
      logger.error("Error occurred in update customer (catch): " + JSON.stringify(e));
    });
}
