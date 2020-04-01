'use strict';

const Joi = require('joi');
const logger = require('winston');
const ObjectID = require('mongodb').ObjectID;
var moment = require('moment');
var async = require("async");

const completedOrder = require('../../../models/completedOrders');
const wallet = require('../../../worker/wallet/wallet');
const status = require('./walletStatusMessage');
/* 
 *  
 Params = {
 userId,                User Id for User(master,slave,operator)     REQUIRED
 trigger,               ADMIN/TRIP/PROMO/REFREL                     REQUIRED
 comment,               description of transction                   REQUIRED
 currency,              currency                                    REQUIRED
 txnType,               transction type(1-Credit, 2-Debit)          REQUIRED
 amount,                transction amount                           REQUIRED
 paymentType,           CARD/CASH/WALLET                            REQUIRED
 tripId,                Booking ID                                  OPTIONAL
 paymentTxtId,          PAYMENT GATEWAY TRANSCTION ID               OPTIONAL
 initiatedBy            Transction done by(ADMIN NAME)              OPTIONAL
 bookingType            Booking Type(RIDE/DELIVERY/SERVICE)              OPTIONAL
 userType               USER TYPE(1-MASTER, 2-SLAVE, 3-OPERATOR , 4-APP, 5-PG)              REQUIRED
 cashCollected          cashCollected                               OPTIONAL
 }
 */

module.exports.OrderWalletEntry = (orderId, callback) => {

    /** get order details (ex: payment type, order type)*/
    const getOrderDetails = () => {
        return new Promise((resolve, reject) => {
            completedOrder.getOrderById(parseInt(orderId), (error, result) => {
                if (error) reject(error);
                else if (result) resolve(result);
                else reject({ message: 'order not found' });
            })
        })
    }

    return new Promise((resolve, reject) => {
        getOrderDetails()
            // .then(makeEarningEntry)
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            })
    })

}


module.exports.walletTransction = function (params, callback) {

    params.paymentTxtId = (typeof params.paymentTxtId == "undefined" || params.paymentTxtId == "") ? "N/A" : params.paymentTxtId;
    params.initiatedBy = (typeof params.initiatedBy == "undefined" || params.initiatedBy == "") ? "N/A" : params.initiatedBy;
    params.tripId = (typeof params.tripId == "undefined" || params.tripId == "") ? "N/A" : params.tripId;
    params.bookingType = (typeof params.bookingType == "undefined" || params.bookingType == "") ? "N/A" : params.bookingType;
    params.cashCollected = (typeof params.cashCollected == "undefined" || params.cashCollected == "") ? "0" : params.cashCollected;
    var userCollection = "";
    var walletCollection = "";

    switch (parseInt(params.userType)) {
        case 1:
            walletCollection = "walletMaster";
            userCollection = "walletMasterUser";
            break;
        case 2:
            walletCollection = "walletSlave";
            userCollection = "walletSlaveUser";
            break;
        case 3:
            walletCollection = "walletOperator";
            userCollection = "walletOperatorUser";
            break;
        case 4:
            walletCollection = "walletApp";
            userCollection = "";
            break;
        case 5:
            walletCollection = "walletPg";
            userCollection = "";
            break;
        default:
            walletCollection = "";
            userCollection = "";
            break;
    }
    if (walletCollection == "")
        callback("Invalid User Type");

    var txnId = walletCollection.substring(0, 3).toUpperCase() + "-" + moment().unix() + "-" + (Math.random() * (Math.floor(999) - Math.ceil(111)) + 111);
    var userId = params.userId;
    var txnType = "";

    switch (parseInt(params.txnType)) {
        case 1:
            txnType = "CREDIT";
            params.amount = Math.abs(parseFloat(params.amount));
            break;
        case 2:
            txnType = "DEBIT";
            params.amount = Math.abs(parseFloat(params.amount)) * -1;
            break;
        case 3:
            txnType = "DEBIT FOR COLLECTION";
            params.amount = Math.abs(parseFloat(params.amount)) * -1;
            break;
        default:
            callback("Invalid Transaction Type");
            break;
    }

    wallet.SelectWIthLimitSortSkip(walletCollection, { 'userId': userId }, { '_id': -1 }, 1, 0, function (err, waletData) {
        var closingBal = 0;
        if (err) {
            callback(err);
        } else {
            if (waletData.length === 0)
                closingBal = 0;
            else
                closingBal = waletData[0].closingBal || 0;
            var final_closingBal = parseFloat(closingBal) + parseFloat(params.amount);
            if ((params.paymentType == "CARD" && params.trigger == "TRIP" && params.userType == 2) ||
                (params.paymentType == "CASH" && params.trigger == "TRIP" && params.userType == 2))
                final_closingBal = closingBal;
            var walletData = {
                txnId: txnId,
                userId: userId,
                txnType: txnType,
                trigger: params.trigger,
                comment: params.comment,
                currency: params.currency,

                openingBal: parseFloat((closingBal || 0).toFixed(2)),
                amount: parseFloat((params.amount || 0).toFixed(2)),
                closingBal: parseFloat((final_closingBal || 0).toFixed(2)),

                cashCollected: parseFloat(params.cashCollected),
                paymentType: params.paymentType,
                timestamp: parseInt(moment().unix()),
                tripId: params.tripId,
                bookingType: params.bookingType,
                paymentTxnId: params.paymentTxtId,
                intiatedBy: params.initiatedBy
            }
            wallet.Insert(walletCollection, walletData, function (err, result) {
                if (err)
                    callback(err);
                else {
                    if (userCollection != "") {

                        wallet.FINDONEANDUPDATE(
                            userCollection,
                            {
                                query: { 'userId': userId },
                                data: { $set: { "wallet_balance": parseFloat((final_closingBal || 0).toFixed(2)) } },
                                options: { upsert: true }
                            },
                            function (err, userCollectionData) {
                                if (err)
                                    callback(err);
                            }); //create a new document if it does not exists & update the balance

                        UpdateWalletStatus({
                            userType: params.userType,
                            amount: parseFloat((final_closingBal || 0).toFixed(2)),
                            walletData: walletData,
                            userId: userId
                        }, (err, result) => {
                            if (err) {
                                logger.error('err', err)
                            }

                        }); //notify a function in transaction.js to update the wallet balance

                        wallet.SelectWIthLimitSortSkip(walletCollection, {}, { '_id': -1 }, 1, 0, function (err, waletData) {
                            var walletId = "";
                            if (err) {
                                callback(err);
                            } else {
                                if (waletData.length > 0) {
                                    walletId = waletData[0]._id.toString();
                                    wallet.UpdatePush(
                                        userCollection,
                                        { 'userId': userId },
                                        { "txn": walletId },
                                        function (err, userCollectionData) {
                                            if (err)
                                                callback(err);
                                        });
                                }
                            }
                        });
                    }
                    callback(null, txnId);
                }
            });
        }
    });
}

module.exports.authorizeAmount = function (params, callback) {
    var wallet_balance = 0;
    wallet.SelectOne('walletSlaveUser', { 'userId': params.userId }, function (err, userData) {
        if (err) {
            callback(err);
        } else {
            if (userData) {
                var amtWithHardLimit = userData.wallet_balance + params.hardLimit || 0;
                if (typeof userData.wallet_balance != "undefined")
                    wallet_balance = userData.wallet_balance;
                if (params.amount > amtWithHardLimit) {
                    var data = {
                        wallet_balance: wallet_balance,
                        errorFlag: 1,
                        chargeId: ""
                    };
                    callback(null, data);
                } else {
                    var finalClosingBalance = parseFloat(wallet_balance) - parseFloat(params.amount);
                    wallet.Update(
                        'walletSlaveUser',
                        { 'userId': params.userId },
                        { "wallet_balance": parseFloat(finalClosingBalance) },
                        function (err, userCollectionData) {
                            if (err)
                                callback(err);
                            var walletChargesData = {
                                userId: params.userId,
                                amount: params.amount,
                                bid: params.bid || 'N/A',
                                captured: params.capture || false,
                                refund: false,
                            };
                            wallet.Insert('walletCharges', walletChargesData, function (err, result) {
                                if (err)
                                    callback(err);
                                else {
                                    wallet.SelectWIthLimitSortSkip('walletCharges', {}, { '_id': -1 }, 1, 0, function (err, walletChargesData) {
                                        if (err) {
                                            callback(err);
                                        } else {
                                            var data = {
                                                wallet_balance: wallet_balance,
                                                errorFlag: 0,
                                                chargeId: walletChargesData[0]._id.toString(),
                                            };
                                            callback(null, data);
                                        }
                                    });
                                }
                            });
                        });
                }
            } else {
                var data = {
                    wallet_balance: wallet_balance,
                    errorFlag: 1,
                    chargeId: ""
                };
                callback(null, data);
            }
        }
    });
}

module.exports.captureAmount = function (params, callback) {
    wallet.SelectOne('walletCharges', { '_id': new ObjectID(params.chargeId) }, function (err, walletChargesData) {
        if (err) {
            callback(err);
        } else {
            if (walletChargesData) {
                wallet.Update(
                    'walletCharges',
                    { '_id': new ObjectID(params.chargeId) },
                    { "captured": true },
                    function (err, userCollectionData) {
                        if (err)
                            callback(err);
                        var data = {
                            errorFlag: 0,
                            chargeId: params.chargeId
                        };
                        callback(null, data);
                    });
            } else {
                var data = {
                    errorFlag: 1,
                    chargeId: params.chargeId
                };
                callback(null, data);
            }
        }
    });
}

module.exports.refundAmount = function (params, callback) {
    wallet.SelectOne('walletCharges', { '_id': new ObjectID(params.chargeId) }, function (err, walletChargesData) {
        if (err) {
            callback(err);
        } else {
            if (walletChargesData) {
                wallet.Update(
                    'walletCharges',
                    { '_id': params.chargeId },
                    { "refund": true },
                    function (err, userCollectionData) {
                        if (err)
                            callback(err);
                        wallet.SelectOne('walletSlaveUser', { 'userId': walletChargesData.userId }, function (err, userData) {
                            if (err) {
                                callback(err);
                            } else {
                                if (userData) {
                                    var finalClosingBalance = userData.wallet_balance + walletChargesData.amount;
                                    wallet.Update(
                                        'walletSlaveUser',
                                        { 'userId': walletChargesData.userId },
                                        { "wallet_balance": parseFloat(finalClosingBalance) },
                                        function (err, userCollectionData) {
                                            if (err)
                                                callback(err);
                                            var data = {
                                                errorFlag: 0,
                                                wallet_balance: finalClosingBalance
                                            };
                                            callback(null, data);
                                        });
                                } else {
                                    var data = {
                                        errorFlag: 1
                                    };
                                    callback(null, data);
                                }
                            }
                        });
                    });
            } else {
                var data = {
                    errorFlag: 1,
                    chargeId: params.chargeId
                };
                callback(null, data);
            }
        }
    });
}

/**
 * Method to get the charge details
 * @param {*} bid - booking, userId
 */
module.exports.getChargeDetails = (params, callback) => {

    wallet.SelectOne('walletCharges', { 'bid': parseInt(params.bid) }, (err, charge) => {
        if (err) return callback(err);

        return callback(err, charge);
    });
}


/*  
 Params = {
 userId,                User Id for User(master,slave,operator)     REQUIRED
 userType               USER TYPE(1-MASTER, 2-SLAVE, 3-OPERATOR , 4-APP, 5-PG)              REQUIRED
 }
 */
module.exports.userCreate = function (params, callback) {
    var userCollection = "";
    switch (parseInt(params.userType)) {
        case 1:
            userCollection = "walletProviderUser";
            break;
        case 2:
            userCollection = "walletCustomerUser";
            break;
        case 3:
            userCollection = "walletOperatorUser";
            break;
        default:
            callback("Invalid User Type");
            break;
    }
    var userData = {
        userId: params.userId,
        softLimitStatus: 0,
        hardLimitStatus: 0,
        wallet_balance: 0
    }
    wallet.Insert(userCollection, userData, function (err, result) {
        if (err)
            callback(err);
        else {
            wallet.SelectWIthLimitSortSkip(userCollection, {}, { '_id': -1 }, 1, 0, function (err, waletData) {
                var walletId = "";
                if (err) {
                    callback(err);
                } else {
                    if (waletData.length > 0)
                        walletId = waletData[0]._id.toString();
                    callback(null, walletId);
                }
            });
        }
    });
}

/* 
 Params = {
 userId,                User Id for User(master,slave,operator)     REQUIRED
 userType               USER TYPE(1-MASTER, 2-SLAVE, 3-OPERATOR , 4-APP, 5-PG)              REQUIRED
 }
 */
module.exports.userDelete = function (params, callback) {
    var userCollection = "";
    switch (parseInt(params.userType)) {
        case 1:
            userCollection = "walletMasterUser";
            break;
        case 2:
            userCollection = "walletSlaveUser";
            break;
        case 3:
            userCollection = "walletOperatorUser";
            break;
        default:
            callback("Invalid User Type");
            break;
    }
    wallet.Delete(userCollection, { userId: params.userId }, function (err, result) {
        if (err)
            callback(err);
        else {
            callback(null, params.userId);
        }
    });
}

/* 
 *  
 Params = {
 userId,                User Id for User(master,slave,operator)     REQUIRED
 userType               USER TYPE(1-MASTER, 2-SLAVE, 3-OPERATOR , 4-APP, 5-PG)              REQUIRED
 }
 */
module.exports.accountBalance = function (params, callback) {
    var userCollection = "";
    switch (parseInt(params.userType)) {
        case 1:
            userCollection = "walletMasterUser";
            break;
        case 2:
            userCollection = "walletSlaveUser";
            break;
        case 3:
            userCollection = "walletOperatorUser";
            break;
        default:
            userCollection = "";
            callback("Invalid User Id");
            break;
    }

    wallet.SelectOne(userCollection, { 'userId': params.userId }, function (err, waletData) {
        if (err) {
            callback(err);
        } else {
            if (waletData) {
                waletData.wallet_balance = (typeof waletData.wallet_balance == "undefined" || waletData.wallet_balance == "") ? 0 : waletData.wallet_balance;
                callback(null, waletData.wallet_balance);
            } else
                callback(err);
        }
    });
}


/*  
 Params = {
 userId,                User Id for User(master,slave,operator)     REQUIRED
 userType               USER TYPE(1-MASTER, 2-SLAVE, 3-OPERATOR)              REQUIRED
 status                 soft limit status(1-SET SOFT LIMIT, 0-UNSET SOFT LIMIT)              REQUIRED
 }
 */
module.exports.softLimit = function (params, callback) {
    var userCollection = "";
    switch (parseInt(params.userType)) {
        case 1:
            userCollection = "walletMasterUser";
            break;
        case 2:
            userCollection = "walletSlaveUser";
            break;
        case 3:
            userCollection = "walletOperatorUser";
            break;
        default:
            callback("Invalid User Type");
            break;
    }
    wallet.Update(
        userCollection,
        { 'userId': params.userId },
        { "softLimitStatus": parseInt(params.status) },
        function (err, userCollectionData) {
            if (err)
                callback(err);
            callback(null, params.userId);
        });
}

/*  
 Params = {
 userId,                User Id for User(master,slave,operator)     REQUIRED
 userType               USER TYPE(1-MASTER, 2-SLAVE, 3-OPERATOR)              REQUIRED
 status                 hard limit status(1-SET SOFT LIMIT, 0-UNSET SOFT LIMIT)              REQUIRED
 }
 */
module.exports.hardLimit = function (params, callback) {
    var userCollection = "";
    switch (parseInt(params.userType)) {
        case 1:
            userCollection = "walletMasterUser";
            break;
        case 2:
            userCollection = "walletSlaveUser";
            break;
        case 3:
            userCollection = "walletOperatorUser";
            break;
        default:
            callback("Invalid User Type");
            break;
    }
    wallet.Update(
        userCollection,
        { 'userId': params.userId },
        { "hardLimitStatus": parseInt(params.status) },
        function (err, userCollectionData) {
            if (err)
                callback(err);
            callback(null, params.userId);
        });
}


/*  
 Params = {
 userId,                User Id for User(master,slave,operator)     REQUIRED
 userType               USER TYPE(1-MASTER, 2-SLAVE, 3-OPERATOR)    REQUIRED
 pageIndex              page index 0 by default                     REQUIRED
 }
 */
module.exports.transction = function (params, callback) {

    var walletCollection = "";
    switch (parseInt(params.userType)) {
        case 1:
            walletCollection = "walletMaster";
            break;
        case 2:
            walletCollection = "walletSlave";
            break;
        case 3:
            walletCollection = "walletOperator";
            break;
        default:
            walletCollection = "";
            break;
    }
    if (walletCollection == "")
        return callback("invalid User Type");
    var limit = 10;
    var skip = 10 * params.pageIndex;
    var debitCond = { 'txnType': 'DEBIT', 'userId': params.userId };
    var creditCond = { 'txnType': 'CREDIT', 'userId': params.userId };
    var creditDebitCond = { 'userId': params.userId };
    var txnType = "";
    async.series([
        function (callback) {
            wallet.SelectWIthLimitSortSkip(walletCollection, debitCond, { '_id': -1 }, limit, skip, function (err, transction) {
                if (err) {
                    callback(err);
                } else {
                    var debitArr = [];
                    for (var key = 0; key < transction.length; key++) {
                        txnType = transction[key].txnType;
                        var tra = {
                            'txnId': transction[key].txnId,
                            'trigger': transction[key].trigger,
                            'txnType': txnType,
                            'comment': transction[key].comment,
                            'currency': transction[key].currency,
                            'openingBal': transction[key].openingBal,
                            'amount': transction[key].amount,
                            'closingBal': transction[key].closingBal,
                            'paymentType': transction[key].paymentType,
                            'timestamp': transction[key].timestamp,
                            'paymentTxnId': transction[key].paymentTxnId,
                            'intiatedBy': transction[key].intiatedBy,
                            'tripId': transction[key].tripId || ''
                        }
                        debitArr.push(tra);
                    }
                    callback(null, debitArr);
                }
            });
        },
        function (callback) {
            wallet.SelectWIthLimitSortSkip(walletCollection, creditCond, { '_id': -1 }, limit, skip, function (err, transction) {
                if (err) {
                    callback(err);
                } else {
                    var creditArr = [];
                    for (var key = 0; key < transction.length; key++) {
                        txnType = transction[key].txnType;
                        var tra = {
                            'txnId': transction[key].txnId,
                            'trigger': transction[key].trigger,
                            'txnType': txnType,
                            'comment': transction[key].comment,
                            'currency': transction[key].currency,
                            'openingBal': transction[key].openingBal,
                            'amount': transction[key].amount,
                            'closingBal': transction[key].closingBal,
                            'paymentType': transction[key].paymentType,
                            'timestamp': transction[key].timestamp,
                            'paymentTxnId': transction[key].paymentTxnId,
                            'intiatedBy': transction[key].intiatedBy,
                            'tripId': transction[key].tripId || ''
                        }
                        creditArr.push(tra);
                    }
                    callback(null, creditArr);
                }
            });
        },
        function (callback) {
            wallet.SelectWIthLimitSortSkip(walletCollection, creditDebitCond, { '_id': -1 }, limit, skip, function (err, transction) {
                if (err) {
                    callback(err);
                } else {
                    var creditDebitArr = [];
                    for (var key = 0; key < transction.length; key++) {
                        txnType = transction[key].txnType;
                        var tra = {
                            'txnId': transction[key].txnId,
                            'trigger': transction[key].trigger,
                            'txnType': txnType,
                            'comment': transction[key].comment,
                            'currency': transction[key].currency,
                            'openingBal': transction[key].openingBal,
                            'amount': transction[key].amount,
                            'closingBal': transction[key].closingBal,
                            'paymentType': transction[key].paymentType,
                            'timestamp': transction[key].timestamp,
                            'paymentTxnId': transction[key].paymentTxnId,
                            'intiatedBy': transction[key].intiatedBy,
                            'tripId': transction[key].tripId || ''
                        }
                        creditDebitArr.push(tra);
                    }
                    callback(null, creditDebitArr);
                }
            });
        }
    ], function (err, result) {
        if (err)
            return callback("something goes wrong");
        return callback(null, {
            debitArr: result[0],
            creditArr: result[1],
            creditDebitArr: result[2]
        });
    });
}



/**
 * API - to get all the wallet users
 */
module.exports.allUser = (req, reply) => {

    // based on user type
    let collection = "";
    switch (parseInt(req.payload.userType)) {
        case 1:
            collection = "masters";
            break;
        case 2:
            collection = "slaves";
            break;
        case 3:
            collection = "operators";
            break;
        default:
            collection = "";
            break;
    }
    if (collection == "")
        return reply(status.status(3));
    let condition = {};
    // based on tab selection
    switch (parseInt(req.payload.tabType)) {
        case 2:
            condition = { 'walletSoftLimitHit': true };
            break;
        case 3:
            condition = { 'walletHardLimitHit': true };
            break;
    }

    var regexValue = req.payload.sSearch;
    if (req.payload.sSearch != 'undefined' && req.payload.sSearch != '') {
        switch (parseInt(req.payload.userType)) {
            case 1:
                Object.assign(condition, { '$or': [{ 'firstName': new RegExp(regexValue, 'i') }, { 'lastName': new RegExp(regexValue, 'i') }, { 'email': new RegExp(regexValue, 'i') }, { 'mobile': new RegExp(regexValue, 'i') }] })
                break;
            case 2:
                Object.assign(condition, { '$or': [{ 'name': new RegExp(regexValue, 'i') }, { 'email': new RegExp(regexValue, 'i') }, { 'phone': new RegExp(regexValue, 'i') }] })
                break;
            case 3:
                Object.assign(condition, { '$or': [{ 'operatorName': new RegExp(regexValue, 'i') }, { 'email': new RegExp(regexValue, 'i') }, { 'mobile': new RegExp(regexValue, 'i') }] })
                break;
            default:
                break;
        }
    }

    wallet.Count(collection, condition, (err, count) => {
        if (err)
            return reply(status.status(3));
        if (count === 0)
            return reply({ iTotalRecords: 0, iTotalDisplayRecords: 0, aaData: [] });
        let queryObj = {
            q: condition,
            p: {},
            s: { _id: -1 },
            skip: parseInt(req.payload.iDisplayStart) || 0,
            limit: parseInt(req.payload.iDisplayLength) || 20
        }
        wallet.SELECT(collection, queryObj, (err, docs) => {

            if (err)
                return reply(status.status(3));
            return reply({
                iTotalRecords: count,
                iTotalDisplayRecords: count,
                aaData: docs
            });
        });
    });
};


/**
 * API - to get statement detail for perticular users
 */
module.exports.statement = (req, reply) => {

    let collection = "";
    switch (parseInt(req.payload.userType)) {
        case 1:
            collection = "walletMaster";
            break;
        case 2:
            collection = "walletSlave";
            break;
        case 3:
            collection = "walletOperator";
            break;
        case 4:
            collection = "walletApp";
            break;
        case 5:
            collection = "walletPg";
            break;
        default:
            collection = "";
            break;
    }

    if (collection == "")
        return reply(status.status(3));
    let condition = {};
    switch (parseInt(req.payload.userType)) {
        case 1:
        case 2:
        case 3:
            condition = { userId: req.payload.userId };
            break;
        default:
            condition = {};
            break;
    }

    var regexValue = req.payload.sSearch;
    if (req.payload.sSearch != 'undefined' && req.payload.sSearch != '') {
        Object.assign(condition, { '$or': [{ 'txnType': new RegExp(regexValue, 'i') }, { 'trigger': new RegExp(regexValue, 'i') }, { 'comment': new RegExp(regexValue, 'i') }] })

    }

    wallet.Count(collection, condition, (err, count) => {

        if (err)
            return reply(status.status(3));
        if (count === 0)
            return reply({ iTotalRecords: 0, iTotalDisplayRecords: 0, aaData: [] });
        let queryObj = {
            q: condition,
            p: {},
            s: { _id: -1 },
            skip: parseInt(req.payload.iDisplayStart) || 0,
            limit: parseInt(req.payload.iDisplayLength) || 20
        }
        wallet.SELECT(collection, queryObj, (err, docs) => {

            if (err)
                return reply(status.status(3));
            return reply({
                iTotalRecords: count,
                iTotalDisplayRecords: count,
                aaData: docs
            });
        });
    });
};


/**
 * API - to get statement detail for perticular users
 */
module.exports.statementFilter = (req, reply) => {

    let collection = "";
    switch (parseInt(req.payload.userType)) {
        case 1:
            collection = "walletMaster";
            break;
        case 2:
            collection = "walletSlave";
            break;
        case 3:
            collection = "walletOperator";
            break;
        case 4:
            collection = "walletApp";
            break;
        case 5:
            collection = "walletPg";
            break;
        default:
            collection = "";
            break;
    }

    if (collection == "")
        return reply(status.status(3));
    let condition = {};
    switch (parseInt(req.payload.userType)) {
        case 1:
        case 2:
        case 3:
            condition = { userId: req.payload.userId };
            break;
        default:
            condition = {};
            break;
    }

    if (!(typeof req.payload.searchByPayment == 'undefined' || req.payload.searchByPayment == null || req.payload.searchByPayment == '' || req.payload.searchByPayment == '0')) {
        Object.assign(condition, { 'txnType': req.payload.searchByPayment })
    }
    if (!(typeof req.payload.searchByTrigger == 'undefined' || req.payload.searchByTrigger == null || req.payload.searchByTrigger == '' || req.payload.searchByTrigger == '0')) {
        Object.assign(condition, { 'trigger': req.payload.searchByTrigger })
    }
    if (!(typeof req.payload.searchByStartDate == 'undefined' || req.payload.searchByStartDate == 'undefined--undefined' || req.payload.searchByStartDate == null || req.payload.searchByStartDate == '' || req.payload.searchByStartDate == '0') && !(typeof req.payload.searchByEndDate == 'undefined' || req.payload.searchByEndDate == 'undefined--undefined' || req.payload.searchByEndDate == null || req.payload.searchByEndDate == '' || req.payload.searchByEndDate == '0')) {
        var serverStartTime = moment(req.payload.searchByStartDate + ' 00:00:01').unix();
        var serverEndTime = moment(req.payload.searchByEndDate + ' 23:59:59').unix();
        var dateCond = { '$gte': serverStartTime, '$lte': serverEndTime };
        Object.assign(condition, { 'timestamp': dateCond })
    }

    wallet.Count(collection, condition, (err, count) => {

        if (err)
            return reply(status.status(3));
        if (count === 0)
            return reply({ iTotalRecords: 0, iTotalDisplayRecords: 0, aaData: [] });
        let queryObj = {
            q: condition,
            p: {},
            s: { _id: -1 },
            skip: parseInt(req.payload.iDisplayStart) || 0,
            limit: parseInt(req.payload.iDisplayLength) || 20
        }
        wallet.SELECT(collection, queryObj, (err, docs) => {

            if (err)
                return reply(status.status(3));
            return reply({
                iTotalRecords: count,
                iTotalDisplayRecords: count,
                aaData: docs
            });
        });
    });
};


/**
 * API - to get statement detail for perticular users
 */

module.exports.statementExport = (req, reply) => {

    let collection = "";
    switch (parseInt(req.payload.userType)) {
        case 1:
            collection = "walletMaster";
            break;
        case 2:
            collection = "walletSlave";
            break;
        case 3:
            collection = "walletOperator";
            break;
        case 4:
            collection = "walletApp";
            break;
        case 5:
            collection = "walletPg";
            break;
        default:
            collection = "";
            break;
    }

    if (collection == "")
        return reply(status.status(3));
    let condition = {};
    switch (parseInt(req.payload.userType)) {
        case 1:
        case 2:
        case 3:
            condition = { userId: req.payload.userId };
            break;
        default:
            condition = {};
            break;
    }

    if (!(typeof req.payload.searchByPayment == 'undefined' || req.payload.searchByPayment == null || req.payload.searchByPayment == '' || req.payload.searchByPayment == '0')) {
        Object.assign(condition, { 'txnType': req.payload.searchByPayment })
    }
    if (!(typeof req.payload.searchByTrigger == 'undefined' || req.payload.searchByTrigger == null || req.payload.searchByTrigger == '' || req.payload.searchByTrigger == '0')) {
        Object.assign(condition, { 'trigger': req.payload.searchByTrigger })
    }
    if (!(typeof req.payload.searchByStartDate == 'undefined' || req.payload.searchByStartDate == 'undefined--undefined' || req.payload.searchByStartDate == null || req.payload.searchByStartDate == '' || req.payload.searchByStartDate == '0') && !(typeof req.payload.searchByEndDate == 'undefined' || req.payload.searchByEndDate == 'undefined--undefined' || req.payload.searchByEndDate == null || req.payload.searchByEndDate == '' || req.payload.searchByEndDate == '0')) {
        var serverStartTime = moment(req.payload.searchByStartDate + ' 00:00:01').unix();
        var serverEndTime = moment(req.payload.searchByEndDate + ' 23:59:59').unix();
        var dateCond = { '$gte': serverStartTime, '$lte': serverEndTime };
        Object.assign(condition, { 'timestamp': dateCond })
    }

    var stData = {
        'condition': condition,
        'collection': collection
    };
    wallet.Insert('statementReport', stData, function (err, result) { });
    wallet.Count(collection, condition, (err, count) => {

        if (err)
            return reply(status.status(3));
        if (count === 0)
            return reply({ iTotalRecords: 0, iTotalDisplayRecords: 0, aaData: [] });
        let queryObj = {
            q: condition,
            p: {},
            s: { _id: -1 }
        }
        wallet.SELECT(collection, queryObj, (err, docs) => {

            if (err)
                return reply(status.status(3));
            return reply({
                iTotalRecords: count,
                iTotalDisplayRecords: count,
                aaData: docs
            });
        });
    });
};


/**
 * cashCollected
 * cardDeduct
 * WalletTransaction
 * appEarning
 * serviceTypeText: delivery / pickup
 * 
 */
module.exports.walletEntryForOrdering = (params, callback) => {
    logger.error('///////////////////////////////////////////////////////////////// walletEntryForOrdering')
    const getOrderDetails = () => {
        return new Promise((resolve, reject) => {
            completedOrder.getOrderById(parseInt(orderId), (error, result) => {
                if (error) reject(error);
                else if (result) resolve(result);
                else reject({ message: 'order not found' });
            })
        })
    }

    // entry for earning in respective Wallet
    const makeEarningEntry = () => {
        /** payment entry in customer wallet */
        const paymentEntryInCustomer = () => {
            logger.warn('paymentEntryInCustomer ');
            return new Promise((resolve, reject) => {
                let amount = (parseFloat(params.cashCollected) || 0) + (parseFloat(params.cardDeduct) || 0);
                if (amount > 0) {
                    let dataArr = {
                        userId: params.userId,
                        trigger: 'ORDER',
                        comment: 'Payment Entry For Order',
                        currency: params.currency,
                        currencyAbbr: params.currencyAbbr || 1,
                        currencySymbol: params.currencySymbol,
                        txnType: 4, //transction type(1-Credit, 2-Debit) 
                        amount: parseFloat(amount || 0),
                        orderId: params.orderId,
                        serviceTypeText: params.serviceTypeText || "",
                        // bookingTypeText: params.bookingTypeText || "",
                        paymentTypeText: params.paymentTypeText || "",
                        cityName: params.cityName || "",
                        cityId: (params.cityId) ? params.cityId.toString() : '',
                        userType: 1,
                        initiatedBy: 'Customer',
                        calculateClosingBalance: 0
                    };

                    wallet.walletTransction(dataArr, (err, res) => {
                        return err ? reject(err) : resolve(params);
                    });
                } else {
                    return resolve(params);
                }
            });
        };

        //credit master earning to master wallet
        const creditInDriver = () => {
            logger.warn('creditInDriver ');
            return new Promise((resolve, reject) => {
                let txnType = 1;
                if (params.driverEarning > 0) {
                    txnType = 1;
                } else {
                    txnType = 2;
                }
                if (params.driverEarning && params.driverEarning != 0) {
                    let dataArr = {
                        userId: (params.driverId).toString(),
                        trigger: 'ORDER',
                        comment: 'Invoice payment by customer',
                        currency: params.currency,
                        currencyAbbr: params.currencyAbbr || 1,
                        currencySymbol: params.currencySymbol,
                        txnType: txnType, //transction type(1-Credit, 2-Debit)
                        amount: parseFloat(params.driverEarning || 0),
                        orderId: params.orderId,
                        serviceTypeText: params.serviceTypeText || "",
                        // bookingTypeText: params.bookingTypeText || "",
                        paymentTypeText: params.paymentTypeText || "",
                        cityName: params.cityName || "",
                        cityId: (params.cityId) ? params.cityId.toString() : '',
                        userType: 2,
                        initiatedBy: 'Customer',
                        calculateClosingBalance: 1
                    };
                    wallet.walletTransction(dataArr, (err, res) => {
                        return err ? reject(err) : resolve(params);
                    });
                } else {
                    return resolve(params);
                }
            });
        };


        const creditInStore = () => {
            logger.warn('creditInStore ');
            return new Promise((resolve, reject) => {
                let txnType = 1;
                if (params.storeEarning > 0) {
                    txnType = 1;
                } else {
                    txnType = 2;
                }
                if (params.storeEarning && params.storeEarning != 0) {
                    let dataArr = {
                        userId: params.storeId,
                        trigger: 'ORDER',
                        comment: 'Invoice payment by customer',
                        currency: params.currency,
                        currencyAbbr: params.currencyAbbr || 1,
                        currencySymbol: params.currencySymbol,
                        txnType: txnType, //transction type(1-Credit, 2-Debit)
                        amount: parseFloat(params.storeEarning || 0),
                        orderId: params.orderId,
                        serviceTypeText: params.serviceTypeText || "",
                        // bookingTypeText: params.bookingTypeText || "",
                        paymentTypeText: params.paymentTypeText || "",
                        cityName: params.cityName || "",
                        cityId: (params.cityId) ? params.cityId.toString() : '',
                        userType: 3,
                        initiatedBy: 'Customer',
                        calculateClosingBalance: 1
                    };
                    wallet.walletTransction(dataArr, (err, res) => {
                        return err ? reject(err) : resolve(params);
                    });
                } else {
                    return resolve(params);
                }
            });
        };


        //payment entry of app earning in app wallet
        const paymentEntryInApp = () => {
            logger.warn('paymentEntryInApp ');
            return new Promise((resolve, reject) => {
                if (params.appEarning && params.appEarning != 0) {
                    let dataArr = {
                        userId: 1,
                        trigger: 'ORDER',
                        comment: 'Earning Entry For Booking',
                        currency: params.currency,
                        currencyAbbr: params.currencyAbbr || 1,
                        currencySymbol: params.currencySymbol,
                        txnType: 5,
                        amount: parseFloat(params.appEarning || 0),
                        paymentTxtId: params.chargeId,
                        orderId: params.orderId,
                        serviceTypeText: params.serviceTypeText || '',
                        // bookingTypeText: params.bookingTypeText || "",
                        paymentTypeText: params.paymentTypeText || "",
                        cityName: params.cityName || "",
                        cityId: (params.cityId) ? params.cityId.toString() : '',
                        userType: 4,
                        initiatedBy: 'Customer',
                        calculateClosingBalance: 0
                    };

                    wallet.walletTransction(dataArr, (err, res) => {
                        return err ? reject(err) : resolve(params);
                    });
                } else {
                    return resolve(params);
                }
            });
        };

        return new Promise((resolve, reject) => {
            paymentEntryInCustomer()
                .then(creditInStore)
                .then(creditInDriver)
                .then(paymentEntryInApp)
                .then(() => {
                    return resolve(true);
                }).catch((err) => {
                    logger.error('error while making entry of earning =>', err);
                    return reject(err);
                });
        });
    }

    //entry for cash transactions
    /**
     * 
     */
    const checkCashTransaction = () => {
        logger.warn('checkCashTransaction ');
        // debit amount from master wallet
        const debitInDriver = (data) => {
            logger.warn('debitInDriver ');
            return new Promise((resolve, reject) => {
                let dataArr = {
                    userId: (params.driverId).toString(),
                    trigger: 'ORDER',
                    comment: 'Invoice payment by customer',
                    currency: params.currency,
                    currencyAbbr: params.currencyAbbr || 1,
                    currencySymbol: params.currencySymbol,
                    txnType: 2, //transction type(1-Credit, 2-Debit)
                    amount: parseFloat(params.cashCollected || 0),
                    // tripId: params.bookingId,
                    orderId: params.orderId,
                    serviceTypeText: params.serviceTypeText || "",
                    // bookingTypeText: params.bookingTypeText || "",
                    paymentTypeText: params.paymentTypeText || "",
                    cityName: params.cityName || "",
                    cityId: (params.cityId) ? params.cityId.toString() : '',
                    userType: 2,
                    initiatedBy: 'Customer',
                    calculateClosingBalance: 1
                };
                wallet.walletTransction(dataArr, (err, res) => {
                    return err ? reject(err) : resolve(params);
                });
            });
        }


        const debitInStore = (data) => {
            logger.warn('debitInStore ');
            return new Promise((resolve, reject) => {
                let dataArr = {
                    userId: params.storeId,
                    trigger: 'ORDER',
                    comment: 'Invoice payment by customer',
                    currency: params.currency,
                    currencyAbbr: params.currencyAbbr || 1,
                    currencySymbol: params.currencySymbol,
                    txnType: 2, //transction type(1-Credit, 2-Debit)
                    amount: parseFloat(params.cashCollected || 0),
                    // tripId: params.bookingId,
                    orderId: params.orderId,
                    serviceTypeText: params.serviceTypeText || "",
                    // bookingTypeText: params.bookingTypeText || "",
                    paymentTypeText: params.paymentTypeText || "",
                    cityName: params.cityName || "",
                    cityId: (params.cityId) ? params.cityId.toString() : '',
                    userType: 3,
                    initiatedBy: 'Customer',
                    calculateClosingBalance: 1
                };
                wallet.walletTransction(dataArr, (err, res) => {
                    return err ? reject(err) : resolve(params);
                });
            });
        }

        return new Promise((resolve, reject) => {

            if (params.cashCollected && params.cashCollected > 0) {
                if ((params.serviceType && params.serviceType === 2) || (params.driverType && params.driverType === 2))
                    debitInStore()
                        .then(() => {
                            return resolve(true);
                        }).catch((err) => {
                            logger.error('error while making entry of cash transaction =>', err);
                            return reject(err);
                        });
                else if (params.serviceType && params.serviceType === 1)
                    debitInDriver()
                        .then(() => {
                            return resolve(true);
                        }).catch((err) => {
                            logger.error('error while making entry of cash transaction =>', err);
                            return reject(err);
                        });
            } else {
                return resolve(true);
            }
        });
    }

    //entry for card transactions
    const checkCardTransaction = () => {
        logger.warn('checkCardTransaction ');
        // Credit Card Deduct amount in App
        const creditInApp = (data) => {
            return new Promise((resolve, reject) => {
                if (params.cardDeduct && params.cardDeduct > 0) {
                    let dataArr = {
                        userId: 1,
                        trigger: 'ORDER',
                        comment: 'Invoice payment by customer',
                        currency: params.currency,
                        currencyAbbr: params.currencyAbbr || 1,
                        currencySymbol: params.currencySymbol,
                        txnType: 1,
                        amount: parseFloat(params.cardDeduct || 0),
                        paymentTxtId: params.chargeId,
                        orderId: params.orderId,
                        serviceTypeText: params.serviceTypeText || '',
                        // bookingTypeText: params.bookingTypeText || "",
                        paymentTypeText: params.paymentTypeText || "",
                        cityName: params.cityName || "",
                        cityId: (params.cityId) ? params.cityId.toString() : '',
                        userType: 4,
                        initiatedBy: 'Customer',
                        calculateClosingBalance: 1
                    };

                    wallet.walletTransction(dataArr, (err, res) => {
                        return err ? reject(err) : resolve(params);
                    });
                } else {
                    return resolve(params);
                }
            });
        }

        //Debit PG commission from respective Wallet
        const debitPaymentGatwayCommission = (data) => {
            return new Promise((resolve, reject) => {
                if (params.pgComm && params.pgComm != 0) {
                    // let userType = (params.pgCommPayBy && params.pgCommPayBy == 1) ? 2 : 4;
                    let dataArr = {
                        userId: 1,
                        trigger: 'ORDER',
                        comment: 'Invoice payment - PG commission',
                        currency: params.currency,
                        currencyAbbr: params.currencyAbbr || 1,
                        currencySymbol: params.currencySymbol,
                        txnType: 2,
                        amount: parseFloat(params.pgComm || 0),
                        paymentTxtId: params.chargeId,
                        orderId: params.orderId,
                        serviceTypeText: params.serviceTypeText || '',
                        // bookingTypeText: params.bookingTypeText || "",
                        paymentTypeText: params.paymentTypeText || "",
                        cityName: params.cityName || "",
                        cityId: (params.cityId) ? params.cityId.toString() : '',
                        userType: 4,
                        initiatedBy: 'Customer',
                        calculateClosingBalance: 1
                    };

                    wallet.walletTransction(dataArr, (err, res) => {
                        return err ? reject(err) : resolve(params);
                    });
                } else {
                    return resolve(params);
                }
            });
        }

        // credit PG commission in PG wallet
        const creditInPGWallet = (data) => {
            return new Promise((resolve, reject) => {
                if (params.pgComm && params.pgComm != 0) {
                    let dataArr = {
                        userId: 1,
                        trigger: 'ORDER',
                        comment: 'Invoice payment - PG commission',
                        currency: params.currency,
                        currencyAbbr: params.currencyAbbr || 1,
                        currencySymbol: params.currencySymbol,
                        txnType: 1,
                        amount: parseFloat(params.pgComm || 0),
                        paymentTxtId: params.chargeId,
                        orderId: params.orderId,
                        serviceTypeText: params.serviceTypeText || '',
                        // bookingTypeText: params.bookingTypeText || "",
                        paymentTypeText: params.paymentTypeText || "",
                        cityName: params.cityName || "",
                        cityId: (params.cityId) ? params.cityId.toString() : '',
                        userType: 5,
                        initiatedBy: 'Customer',
                        calculateClosingBalance: 1
                    };

                    wallet.walletTransction(dataArr, (err, res) => {
                        return err ? reject(err) : resolve(params);
                    });
                } else {
                    return resolve(params);
                }
            });
        }

        return new Promise((resolve, reject) => {
            creditInApp()
                .then(debitPaymentGatwayCommission)
                .then(creditInPGWallet)
                .then(() => {
                    return resolve(true);
                }).catch((err) => {
                    logger.error('error while making entry of cash transaction =>', err);
                    return reject(err);
                });
        });
    }

    //entry for wallet transactions
    const checkWalletTransaction = () => {
        logger.warn('checkWalletTransaction ');
        // Credit Wallet Transaction amount in App

        const paymentInCustomer = (data) => {
            logger.warn('paymentInCustomer ');
            return new Promise((resolve, reject) => {
                let dataArr = {
                    userId: params.userId,
                    trigger: 'ORDER',
                    comment: 'Wallet Payment Entry For Order',
                    currency: params.currency,
                    currencyAbbr: params.currencyAbbr || 1,
                    currencySymbol: params.currencySymbol,
                    txnType: 2, //transction type(1-Credit, 2-Debit) 
                    amount: parseFloat(params.WalletTransaction || 0),
                    blocked: parseFloat(params.WalletTransaction || 0),
                    wallet: true,
                    orderId: params.orderId,
                    serviceTypeText: params.serviceTypeText || "",
                    // bookingTypeText: params.bookingTypeText || "",
                    paymentTypeText: params.paymentTypeText || "",
                    cityName: params.cityName || "",
                    cityId: (params.cityId) ? params.cityId.toString() : '',
                    userType: 1,
                    initiatedBy: 'Customer',
                    calculateClosingBalance: 1
                };

                wallet.walletTransction(dataArr, (err, res) => {
                    return err ? reject(err) : resolve(params);
                });
            });
        }


        const updateCustomer = () => {
            logger.warn('updateCustomer ');
            return new Promise((resolve, reject) => {

                /** get the customer data and find the wallet balance */
                customer.getOne({ _id: ObjectID(params.userId) }, (error, cust) => {
                    if (error) reject(error);

                    else if (cust) {
                        /** if customer data found */
                        const data = {
                            'wallet.balance': cust.wallet.balance - parseFloat(params.WalletTransaction || 0),
                            'wallet.blocked': cust.wallet.blocked - parseFloat(params.WalletTransaction || 0)
                        }

                        /** update the calculated wallet balance */
                        customer.update({
                            q: { _id: ObjectID(params.userId) },
                            data: { $set: data },
                            options: {}
                        }, (err, res) => {
                            if (err) reject(err);
                            else resolve(true);
                        })
                    } else {
                        /** no customer found */
                        reject({ message: "Customer data not found" });
                    }

                })

            })
        }

        const creditInApp = (data) => {
            logger.warn('creditInApp ');
            return new Promise((resolve, reject) => {
                let dataArr = {
                    userId: 1,
                    trigger: 'ORDER',
                    comment: 'Invoice payment by customer',
                    currency: params.currency,
                    currencyAbbr: params.currencyAbbr || 1,
                    currencySymbol: params.currencySymbol,
                    txnType: 1,
                    amount: parseFloat(params.WalletTransaction || 0),
                    paymentTxtId: params.chargeId,
                    orderId: params.orderId,
                    serviceTypeText: params.serviceTypeText || '',
                    // bookingTypeText: params.bookingTypeText || "",
                    paymentTypeText: params.paymentTypeText || "",
                    cityName: params.cityName || "",
                    cityId: (params.cityId) ? params.cityId.toString() : '',
                    userType: 4,
                    initiatedBy: 'Customer',
                    calculateClosingBalance: 1
                };

                wallet.walletTransction(dataArr, (err, res) => {
                    return err ? reject(err) : resolve(params);
                });
            });
        }
        return new Promise((resolve, reject) => {
            if (params.WalletTransaction && params.WalletTransaction > 0) {
                paymentInCustomer()
                    // .then(updateCustomer)
                    // .then(creditInApp)
                    .then(() => {
                        return resolve(true);
                    }).catch((err) => {
                        logger.error('error while making entry of cash transaction =>', err);
                        return reject(err);
                    });
            } else {
                return resolve(true);
            }
        });
    }

    //entry for last due
    /** NOT USED */
    const checkLastDue = () => {
        logger.warn('checkLastDue ');
        // Credit last due amount in customer wallet
        const creditInCustomer = (data) => {
            return new Promise((resolve, reject) => {
                let data = {
                    userId: params.userId.toString(),
                    trigger: 'TRIP',
                    comment: 'Invoice payment - Last Due ' + params.lastDue,
                    currency: params.currency,
                    currencyAbbr: params.currencyAbbr || 1,
                    currencySymbol: params.currencySymbol,
                    txnType: 1,
                    amount: parseFloat(params.lastDue || 0),
                    tripId: params.bookingId,
                    serviceTypeText: params.serviceTypeText || '',
                    bookingTypeText: params.bookingTypeText || "",
                    paymentTypeText: params.paymentTypeText || "",
                    cityName: params.cityName || "",
                    cityId: (params.cityId) ? params.cityId.toString() : '',
                    userType: 1,
                    initiatedBy: 'Customer',
                    calculateClosingBalance: 1
                };
                wallet.walletTransction(data, (err, res) => {
                    return err ? reject(err) : resolve(params);
                });
            });
        }
        return new Promise((resolve, reject) => {
            if (params.lastDue && params.lastDue > 0) {
                creditInCustomer()
                    .then(() => {
                        return resolve(true);
                    }).catch((err) => {
                        logger.error('error while making entry of cash transaction =>', err);
                        return reject(err);
                    });
            } else {
                return resolve(true);
            }
        });
    }

    checkCashTransaction()
        .then(checkCardTransaction)
        .then(checkWalletTransaction)
        .then(makeEarningEntry)
        // .then(checkLastDue)
        .then(() => {
            return callback(null, true);
        }).catch((err) => {
            return callback(err, true);
        })
}



module.exports.walletConfiguration = (request, reply) => {
    walletConfigurationTrasction(request.payload, (err, result) => {
    });
    return reply(status.status(2));
};