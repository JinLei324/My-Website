let postAPI = require('./post');
const entity = '/admin';
var async = require("async");

const config = process.env;
/** @global */
const headerValidator = require('../../../../middleware/validator');
const wallet = require('../../../../../worker/wallet/wallet');
const postWalletLimit = require('./walletLimit');
const email = require('../../../../commonModels/email/email');
const errorMsg = require('../../../../../locales');
const i18n = require('../../../../../locales/locales');
/** @global */
const Joi = require('joi')
module.exports = [
    {
        method: 'POST', // Methods Type
        path: '/admin/wallet/walletTransction', // Url
        config: {// "tags" enable swagger to document API 
            tags: ['api', 'admin'],
            description: 'API for admin credit/debit',
            notes: 'API for admin credit/debit',
            auth: false,
            // auth: false,
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form'
                },
                responses: {
                    '200': {
                        'description': 'Success',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    },
                    '400': {
                        'description': 'Bad Request',
                        'schema': Joi.object({
                            equals: Joi.number(),
                        }).label('Result')
                    }
                }
            },
            validate: {
                payload: {
                    amount: Joi.any().required().description('amount'),
                    userType: Joi.string().required().description('1-SLAVE, 2-MASTER, 3-OPERATOR , 4-APP, 5-PG , 6-institutions , 7-institutionUser'),
                    trigger: Joi.string().description('ADMIN/PROMO/REFREL/TRIP/WALLET_RECHARGE'),
                    txnType: Joi.string().required().description('Transaction Type(1-CREDIT, 2-DEBIT)'),
                    comment: Joi.string().description('add your Comment'),
                    paymentType: Joi.string().description('CASH/CARD/WALLET'),
                    initiatedBy: Joi.string().description('ADMIN_USERNAME/CUSTOMER'),
                    users: Joi.any().required().description('array userId, currency, currencySymbol')
                }
            }
        },
        handler: function (req, reply) { // request handler method
            req.payload.users = JSON.parse(req.payload.users);
            if (Array.isArray(req.payload.users) && req.payload.users.length > 0) {
                async.forEach(req.payload.users, function (item, callback) {
                    req.payload.userId = item['userId'];
                    req.payload.currency = item['currency'];
                    req.payload.currencySymbol = item['currencySymbol'];
                    req.payload.cityName = item['cityName'];
                    req.payload.email = item['email'];
                    req.payload.name = item['name'];
                    req.payload.calculateClosingBalance = 1;
                    email.getTemplateAndSendEmail({
                        templateName: 'walletRecharge.html',
                        toEmail: req.payload.email,
                        subject: 'Welcome to ' + config.appName,
                        trigger: 'New Registration',
                        keysToReplace: {
                            username: req.payload.name || '',//.charAt(0).toUpperCase() + req.payload.name.slice(1),
                            appName: config.appName,
                            transactionType: req.payload.trigger,
                            transactionReason: req.payload.comment,
                            transactionAmount: req.payload.amount + req.payload.currencySymbol
                        }
                    }, () => {
                    });
                    switch (parseInt(req.payload.txnType)) {
                        case 1:
                        case 3:
                            wallet.walletTransction(req.payload, function (err, data) {
                            });
                            let walletTemp1 = JSON.parse(JSON.stringify(req.payload));
                            walletTemp1.userId = 1;
                            walletTemp1.txnType = 1;
                            walletTemp1.userType = 4;
                            wallet.walletTransction(walletTemp1, function (err, data) {
                                callback();
                            });
                            break;
                        case 2:
                            wallet.walletTransction(req.payload, function (err, data) {
                            });
                            let walletTemp2 = JSON.parse(JSON.stringify(req.payload));
                            walletTemp2.userId = 1;
                            walletTemp2.txnType = 2;
                            walletTemp2.userType = 4;
                            wallet.walletTransction(walletTemp2, function (err, data) {
                                callback();
                            });
                            break;
                        default:
                            callback();
                            break;
                    }
                }, function (err) {
                    // return reply({ message: req.i18n.__('genericErrMsg')['200'] }).code(200);
                    reply({ 'flag': 0, 'data': 'success' });
                });
            } else {
                // return reply({ message: req.i18n.__('genericErrMsg')['500'] }).code(500);
                reply({ 'flag': 1, 'data': req.payload.users });
            }
        }
    },
    {
        method: 'POST',
        path: entity + '/walletLimit',
        handler: postWalletLimit.APIHandler,
        config: {
            tags: ['api', 'admin'],
            description: errorMsg['apiDescription']['adminPostWalletLimit'],
            notes: errorMsg['apiDescription']['adminPostWalletLimit'],
            auth: 'AdminJWT',
            // auth: false,        
            // response: postWalletLimit.responseCode,
            validate: {
                headers: headerValidator.headerAuthValidator,
                payload: postWalletLimit.payload,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
];