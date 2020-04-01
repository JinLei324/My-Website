
'use strict';

const headerValidator = require('../../../../middleware/validator');

const entity = "/driver";
const errorMsg = require('../../../../../locales');
const getWalletTransaction = require('./get');
const getWalletTransactionWithType = require('./getSkip');

module.exports = [
    /**
    * api to get wallet transctions
    */
    {
        method: 'GET',
        path: entity + '/walletTransaction/{pageIndex}',
        handler: getWalletTransaction.APIHandler,
        config: {
            tags: ['api', 'wallet'],
            description: errorMsg['apiDescription']['providerGetWalletTransctions'],
            notes: errorMsg['apiDescription']['providerGetWalletTransctions'],
            auth: 'driverJWT',
            // response: getWalletTransaction.responseCode,
            validate: {
                params: getWalletTransaction.payloadValidator,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    },

    /**
    * api to get wallet transctions
    */
    {
        method: 'GET',
        path: entity + '/walletTransaction/{txnType}/{pageIndex}',
        handler: getWalletTransactionWithType.APIHandler,
        config: {
            tags: ['api', 'wallet'],
            description: errorMsg['apiDescription']['providerGetWalletTransctions'],
            notes: errorMsg['apiDescription']['providerGetWalletTransctions'],
            auth: 'driverJWT',
            // response: getWalletTransaction.responseCode,
            validate: {
                params: getWalletTransactionWithType.payloadValidator,
                headers: headerValidator.headerAuthValidator,
                failAction: (req, reply, source, error) => {
                    return reply({ message: error.output.payload.message }).code(error.output.statusCode);
                }
            }
        }
    }
]