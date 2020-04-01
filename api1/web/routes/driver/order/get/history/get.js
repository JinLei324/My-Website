const completedOrders = require('../../../../../../models/completedOrders');
const Auth = require('../../../../../middleware/authentication');
const error = require('../../../../../../locales');  // response messages based on language 
const status = require('../../../../../../statusMessages/statusMessages');
const config = process.env;
let Joi = require('joi');
const ObjectId = require('mongodb').ObjectID;
const logger = require('winston');
const moment = require('moment');


/** 
* @function
* @name handler 
* @return {object} Reply to the user.
*/

const handler = (req, reply) => {
    let ordersArray = [];


    let condition = { "driverId": new ObjectId(req.auth.credentials._id) };

    if (typeof req.payload.orderId != 'undefined' && req.payload.orderId) {
        condition = {
            "driverId": new ObjectId(req.auth.credentials._id),
            "orderId": req.payload.orderId
        };
    }

    let timestampCond = {};

    if (typeof req.payload.startDate != 'undefined' && req.payload.startDate != '' && req.payload.startDate != null)
        timestampCond['$gte'] = moment(req.payload.startDate).unix();

    if (typeof req.payload.endDate != 'undefined' && req.payload.endDate != '' && req.payload.endDate != null)
        timestampCond['$lte'] = moment(req.payload.endDate).unix();

    if (Object.keys(timestampCond).length > 0)
        condition['timeStamp.created.timeStamp'] = timestampCond;

    let aggregationQuery = [
        { $match: condition },
        {
            $project: {
                weight: 1, weightMetric: 1, weightMetricText: 1, storeType: 1, storeTypeMsg: 1, orderId: 1, bookingDate: 1, pickup: 1, storeLogo: 1, subTotalAmount: 1, excTax: 1, exclusiveTaxes: 1, drop: 1, status: 1,
                driverDetails: 1, timeStamp: 1, storeAddress: 1, storeName: 1, bookingDateTimeStamp: 1,
                totalAmount: 1, Items: 1, customerDetails: 1, paymentType: 1, payByWallet: 1, paymentTypeMsg: 1, receivers: 1,
                deliveryCharge: 1, discount: 1, reviewByProvider: 1, accouting: 1, currency: 1, paidBy: 1, mileageMetric: 1, currencySymbol: 1,
            }
        },
        { $sort: { 'timeStamp.created.timeStamp': -1 } },
        { $skip: parseInt(req.payload.pageIndex || 0) * 10 },
        { $limit: 25 }//[todo]-make it dynamic
    ];
    let totalEarning = {};
    for (let day = 0; day < 7; day++) {
        mydate = moment.unix(moment(req.payload.startDate).unix()).add(day, 'days').format("YYYY-MM-DD").toString();
        totalEarning[mydate] = 0;
    }
    const readCompletedOrder = () => {
        return new Promise((resolve, reject) => {
            completedOrders.getOrdersByDate(aggregationQuery, (err, res) => {
                if (err) logger.error('err: ' + JSON.stringify(err))
                let i = 0;
                let arr = [];
                if (res.length > 0) {

                    for (let i = 0; i < res.length; i++) {
                        ordersArray.push({
                            orderId: res[i].orderId,
                            bookingDate: moment.unix(res[i].bookingDateTimeStamp).format("YYYY-MM-DD HH:mm:ss").toString(),
                            pickupLong: res[i].pickup ? res[i].pickup.location.longitude : 0,
                            pickupLat: res[i].pickup ? res[i].pickup.location.latitude : 0,
                            dropLat: res[i].drop ? res[i].drop.location.latitude : 0,
                            dropLong: res[i].drop ? res[i].drop.location.longitude : 0,
                            pickAddress: res[i].pickup.addressLine1 + ' ' + res[i].pickup.addressLine2,
                            dropAddress: res[i].drop.addressLine1 + ' ' + res[i].drop.addressLine2,
                            statusCode: res[i].status,
                            statusMessage: res[i].statusMsg,
                            storeName: res[i].storeName,
                            storeType: res[i].storeType,
                            storeTypeMsg: res[i].storeTypeMsg,
                            storeLogo: res[i].storeLogo,
                            storeAddress: res[i].storeAddress,
                            totalAmount: res[i].totalAmount,
                            subTotalAmountWithExcTax: res[i].subTotalAmountWithExcTax,
                            subTotalAmount: res[i].subTotalAmount,
                            excTax: res[i].excTax,
                            exclusiveTaxes: res[i].exclusiveTaxes,
                            deliveryCharge: res[i].deliveryCharge,
                            discount: res[i].discount,
                            "currency": res[i].currency ? res[i].currency : null,
                            "currencySymbol": res[i].currencySymbol ? res[i].currencySymbol : null,
                            "mileageMetric": res[i].mileageMetric ? res[i].mileageMetric : null,
                            distanceDriver: res[i].accouting ? (parseFloat(res[i].accouting.distanceDriver).toFixed(2)) : 0,
                            cancellationFee: 0,
                            // appCommission: 0,
                            earnedAmount: 0,
                            paymentType: res[i].paymentType,
                            payByWallet: res[i].payByWallet,
                            paymentTypeMsg: res[i].paymentTypeMsg,
                            items: res[i].Items,
                            customerName: res[i].customerDetails ? res[i].customerDetails.name : null,
                            customerPhone: res[i].customerDetails ? res[i].customerDetails.mobile : null,
                            customerId: res[i].customerDetails ? res[i].customerDetails.customerId : null,
                            rating: res[i].reviewByProvider ? res[i].reviewByProvider.rating : 0,
                            signatureUrl: res[i].receivers ? res[i].receivers.signatureUrl : null,
                            pickedupTime: res[i].timeStamp.journeyStart ? moment.unix(res[i].timeStamp.journeyStart.timeStamp).format("YYYY-MM-DD HH:mm:ss").toString() : null,
                            deliveredTime: res[i].timeStamp.completed ? moment.unix(res[i].timeStamp.completed.timeStamp).format("YYYY-MM-DD HH:mm:ss").toString() : null,
                            timeStamp: res[i].timeStamp.created.timeStamp,
                            journeyStartToEndTime:
                                ((res[i].timeStamp.completed ? res[i].timeStamp.completed.timeStamp : 0) -
                                    (res[i].timeStamp.journeyStart ? res[i].timeStamp.journeyStart.timeStamp : 0)),
                            driverEarning: res[i].accouting ? (res[i].accouting.driverEarningValue) : 0,
                            storeEarning: res[i].accouting ? (res[i].accouting.storeEarningValue) : 0,
                            appCommission: res[i].accouting ? (res[i].accouting.appEarningValue) : 0,
                            tax: res[i].excTax,
                            paidByCard: res[i].paidBy ? (res[i].paidBy.card) : 0,
                            paidByCash: res[i].paidBy ? (res[i].paidBy.cash) : 0,
                            paidByWallet: res[i].paidBy ? (res[i].paidBy.wallet) : 0,
                            date: moment.unix(res[i].timeStamp.created.timeStamp).format("YYYY-MM-DD").toString(),
                            weight: res[i].weight ? (res[i].weight) : 0,
                            weightMetric: res[i].weightMetric ? (res[i].weightMetric) : "",
                            weightMetricText: res[i].weightMetricText ? (res[i].weightMetricText) : 0,
                        });
                        date = moment.unix(res[i].timeStamp.created.timeStamp).format("YYYY-MM-DD").toString();
                        if (typeof totalEarning[date] == 'undefined') {
                            totalEarning[date] = 0;
                        }
                        totalEarning[date] += 1;//parseFloat(totalEarning[date]) + res[i].accouting ? parseFloat(res[i].accouting.driverEarningValue) : 0;
                    }


                }
                return err ? reject(err) : resolve({ ordersArray: ordersArray, totalEarning: totalEarning });
            });
        });
    }

    readCompletedOrder().then(data => {




        totalEarning = data.totalEarning;


        data = data.ordersArray;
        if (data.length > 0) {
            function sortNumber(a, b) {
                return b.timeStamp - a.timeStamp;
            };
            data.sort(sortNumber);
            data = (typeof req.payload.orderId != 'undefined' && req.payload.orderId) ? data[0] : data;
            let totalEarningAndroid = [];
            Object.keys(totalEarning).forEach(key => {
                totalEarningAndroid.push({ date: key, amt: totalEarning[key] });
            });//[to do] merge earnings
            return reply({ message: req.i18n.__('getProfile')['200'], data: { orders: data, total: totalEarning, totalEarning: totalEarningAndroid } }).code(200);
        }
        return reply({ message: req.i18n.__('bookings')['404'] }).code(404);
    }).catch(e => {
        logger.error('Error occurred driver history (catch): ' + JSON.stringify(e));
        return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
    });


}
/** 
 *@constant
 *@type {object}
 *@default
 *A object that validates request payload!
 */
const validator = {
    pageIndex: Joi.number().integer().required().description('page index'),
    startDate: Joi.any().description('format : YYYY-MM-DD HH:MM:SS'),
    endDate: Joi.any().description('format : YYYY-MM-DD HH:MM:SS'),
    orderId: Joi.number().description('orderId ')
}
/**
* A module that exports guest logins handler, validator!
* @exports validator
* @exports handler 
*/
module.exports = { handler, validator };