
'use strict';

const Joi = require('joi');
const logger = require('winston');
const ObjectID = require('mongodb').ObjectID;
var moment = require('moment');
var async = require("async");

const wallet = require('../../../../models/wallet');


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
            userCollection = "walletCustomerUser";
            break;
        case 2:
            userCollection = "walletProviderUser";
            break;
        case 3:
            userCollection = "walletOperatorUser";
            break;
        case 4:
            userCollection = "walletInstitutionUser";
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
        case 4:
            userCollection = "walletInstitutionUser";
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
